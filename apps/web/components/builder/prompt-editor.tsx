"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  type CanvasNode,
  getNodeDef,
  getModelProvider,
  getNodeIdentifier,
  type NodeKind,
} from "@/lib/editor-nodes";
import { ButtonGroup } from "@/components/ui/button-group";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import { PencilLine, BracesIcon } from "lucide-react";
import {
  type ChipType,
  type ChipMeta,
  TOOL_SUGGESTIONS,
  VARIABLE_SUGGESTIONS,
  NODE_XML_TAG,
  TOOL_XML_TAG,
  VARIABLE_XML_TAG,
  buildChip,
  mountValue,
  readValue,
} from "./chip-utils";

type PanelTab = "nodes" | "tools" | "variables";

/* ── MentionPanel ───────────────────────────────────────────────────────────── */

const PANEL_W = 400;

interface PanelState {
  tab: PanelTab;
  query: string;
  trigChar: "/" | "@";
}

interface MentionPanelProps {
  state: PanelState;
  onTabChange: (t: PanelTab) => void;
  nodes: CanvasNode[];
  anchorEl: HTMLDivElement;
  onSelect: (type: ChipType, id: string, label: string) => void;
  onClose: () => void;
}

function MentionPanel({
  state,
  onTabChange,
  nodes,
  anchorEl,
  onSelect,
  onClose,
}: MentionPanelProps) {
  const [rect, setRect] = useState<DOMRect>(() =>
    anchorEl.getBoundingClientRect(),
  );

  useEffect(() => {
    const update = () => setRect(anchorEl.getBoundingClientRect());
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorEl]);

  const q = state.query.toLowerCase();
  const nodeItems = nodes
    .filter((n) => !q || n.label.toLowerCase().includes(q))
    .slice(0, 8);
  const toolItems = TOOL_SUGGESTIONS.filter(
    (t) => !q || t.label.toLowerCase().includes(q),
  ).slice(0, 8);
  const varItems = VARIABLE_SUGGESTIONS.filter(
    (v) => !q || v.label.toLowerCase().includes(q),
  ).slice(0, 8);
  const items =
    state.tab === "nodes"
      ? nodeItems
      : state.tab === "tools"
        ? toolItems
        : varItems;

  const left = Math.max(8, rect.left - PANEL_W - 8);
  const top = Math.max(8, rect.top);

  return createPortal(
    <div
      className="fixed z-[300] bg-card border rounded-xl shadow-xl overflow-hidden p-3"
      style={{ left, top, width: PANEL_W }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="p-1.5 border-b">
        <ButtonGroup
          options={[
            { value: "nodes" as PanelTab, label: "Nodes" },
            { value: "tools" as PanelTab, label: "Tools" },
            { value: "variables" as PanelTab, label: "Variables" },
          ]}
          value={state.tab}
          onChange={onTabChange}
          stretch
          size="xs"
          className="w-full"
        />
      </div>

      <div className="max-h-52 overflow-y-auto py-1">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-5">
            No results
          </p>
        ) : (
          items.map((item) => {
            const node = state.tab === "nodes" ? (item as CanvasNode) : null;
            const def = node ? getNodeDef(node.kind as NodeKind) : null;
            const Icon = def?.icon;
            const isLLM =
              def && ["ai-agent", "prune-ai", "openai-app"].includes(def.kind);
            return (
              <button
                key={item.id}
                type="button"
                onMouseDown={() => {
                  const type: ChipType =
                    state.tab === "nodes"
                      ? "node"
                      : state.tab === "tools"
                        ? "tool"
                        : "variable";
                  onSelect(type, item.id, item.label);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="h-7 w-7 rounded-md border bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                  {isLLM ? (
                    renderIntegrationIcon(
                      getModelProvider(
                        node!.model ??
                          (def!.kind === "openai-app"
                            ? "gpt-4o"
                            : "claude-sonnet-4-6"),
                      ),
                      14,
                    )
                  ) : def?.integrationId ? (
                    renderIntegrationIcon(def.integrationId, 14)
                  ) : Icon ? (
                    <Icon className={cn("h-3.5 w-3.5", def?.iconClass)} />
                  ) : (
                    <PencilLine className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="text-[14px] font-medium text-foreground flex-1 truncate">
                  {item.label}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t pt-2">
        <button
          type="button"
          onMouseDown={() => onClose()}
          className="w-full flex items-center gap-2 px-3 py-2 text-[14px] font-medium text-muted-foreground/70 hover:bg-gray-200 rounded-md hover:text-foreground transition-colors"
        >
          <BracesIcon className="h-4 w-4 shrink-0" />
          Add Advanced Expression
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* ── PromptEditor ─────────────────────────────────────────────────────────── */

export interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  nodes: CanvasNode[];

  placeholder?: string;
  className?: string;

  height?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;

  autoGrow?: boolean;
}

export function PromptEditor({
  value,
  onChange,
  nodes,
  placeholder = "Type your prompt… use / to reference nodes, @ to mention tools",
  className,
  height,
  minHeight = 80,
  maxHeight,
  autoGrow = false,
}: PromptEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const extRef = useRef(value);
  const internalRef = useRef(false);
  const savedSel = useRef<{ node: Node; offset: number } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [panel, setPanel] = useState<PanelState | null>(null);

  function flushChange() {
    if (!editorRef.current) return;
    const next = readValue(editorRef.current);
    extRef.current = next;
    internalRef.current = true;
    onChangeRef.current(next);
  }

  // Sync external value into DOM (skip our own changes)
  useEffect(() => {
    if (internalRef.current) {
      internalRef.current = false;
      return;
    }
    if (!editorRef.current) return;
    mountValue(editorRef.current, value, nodes);
    extRef.current = value;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInput() {
    if (!editorRef.current) return;

    const next = readValue(editorRef.current);
    if (next !== extRef.current) {
      extRef.current = next;
      internalRef.current = true;
      onChangeRef.current(next);
    }

    const sel = window.getSelection();
    if (!sel?.rangeCount) {
      setPanel(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (range.startContainer.nodeType !== Node.TEXT_NODE) {
      setPanel(null);
      return;
    }

    const before = (range.startContainer.textContent ?? "").slice(
      0,
      range.startOffset,
    );
    const slashIdx = before.lastIndexOf("/");
    const atIdx = before.lastIndexOf("@");
    const idx = Math.max(slashIdx, atIdx);
    if (idx === -1) {
      setPanel(null);
      return;
    }

    const trigChar = before[idx] as "/" | "@";
    const query = before.slice(idx + 1);
    if (query.includes(" ") || query.includes("\n")) {
      setPanel(null);
      return;
    }

    savedSel.current = {
      node: range.startContainer,
      offset: range.startOffset,
    };
    setPanel((prev) => ({
      tab: prev?.tab ?? (trigChar === "/" ? "nodes" : "tools"),
      query,
      trigChar,
    }));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setPanel(null);
      return;
    }

    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel?.rangeCount || !sel.isCollapsed) return;
    const { startContainer, startOffset } = sel.getRangeAt(0);

    if (e.key === "Backspace") {
      let chip: Element | null = null;

      if (startContainer.nodeType === Node.TEXT_NODE) {
        const text = startContainer.textContent ?? "";
        const isZWS = text === "​";
        if (startOffset === 0 || (isZWS && startOffset === 1)) {
          const prev = startContainer.previousSibling;
          if (prev instanceof HTMLElement && prev.dataset.mentionType) {
            chip = prev;
            if (isZWS) (startContainer as Text).textContent = "";
          }
        }
      } else if (startContainer === editor && startOffset > 0) {
        const prev = editor.childNodes[startOffset - 1];
        if (prev instanceof HTMLElement && prev.dataset.mentionType)
          chip = prev;
      }

      if (chip) {
        e.preventDefault();
        chip.remove();
        flushChange();
        return;
      }
    }

    if (e.key === "Delete") {
      let chip: Element | null = null;

      if (startContainer.nodeType === Node.TEXT_NODE) {
        const text = startContainer.textContent ?? "";
        const isZWS = text === "​" && startOffset === 0;
        if (startOffset === text.length || isZWS) {
          const next = startContainer.nextSibling;
          if (next instanceof HTMLElement && next.dataset.mentionType) {
            chip = next;
            if (isZWS) (startContainer as Text).textContent = "";
          }
        }
      } else if (startContainer === editor) {
        const next = editor.childNodes[startOffset];
        if (next instanceof HTMLElement && next.dataset.mentionType)
          chip = next;
      }

      if (chip) {
        e.preventDefault();
        chip.remove();
        flushChange();
        return;
      }
    }
  }

  function doInsert(type: ChipType, id: string, label: string) {
    if (!editorRef.current || !panel) return;

    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel) return;

    let container: Node | null = null;
    let caretOffset = 0;
    if (sel.rangeCount) {
      const r = sel.getRangeAt(0);
      if (r.startContainer.nodeType === Node.TEXT_NODE) {
        container = r.startContainer;
        caretOffset = r.startOffset;
      }
    }
    if (!container && savedSel.current) {
      container = savedSel.current.node;
      caretOffset = savedSel.current.offset;
    }
    if (!container || container.nodeType !== Node.TEXT_NODE) return;

    const text = container.textContent ?? "";
    const before = text.slice(0, caretOffset);
    const trigIdx = before.lastIndexOf(panel.trigChar);
    if (trigIdx === -1) return;

    let chipId = id;
    let xmlTag: string | null = null;
    let chipMeta: ChipMeta | undefined;

    if (type === "node") {
      const canvasNode = nodes.find((n) => n.id === id);
      if (canvasNode) {
        chipId = getNodeIdentifier(canvasNode, nodes);
        xmlTag = NODE_XML_TAG[canvasNode.kind as NodeKind] ?? null;
        chipMeta = {
          kind: canvasNode.kind as NodeKind,
          model: canvasNode.model,
        };
      }
    } else if (type === "tool") {
      xmlTag = TOOL_XML_TAG[id] ?? null;
    } else if (type === "variable") {
      xmlTag = VARIABLE_XML_TAG[id] ?? null;
    }

    container.textContent = text.slice(0, trigIdx);
    const parent = container.parentNode!;
    const remaining = text.slice(caretOffset);
    const chip = buildChip(type, chipId, label, chipMeta);

    let caretNode: Text;
    if (xmlTag) {
      const br1 = document.createElement("br");
      const openTag = document.createTextNode(`<${xmlTag}>`);
      const br2 = document.createElement("br");
      const br3 = document.createElement("br");
      const closeTag = document.createTextNode(`</${xmlTag}>`);
      caretNode = document.createTextNode(remaining || "​");
      parent.insertBefore(br1, container.nextSibling);
      parent.insertBefore(openTag, br1.nextSibling);
      parent.insertBefore(br2, openTag.nextSibling);
      parent.insertBefore(chip, br2.nextSibling);
      parent.insertBefore(br3, chip.nextSibling);
      parent.insertBefore(closeTag, br3.nextSibling);
      parent.insertBefore(caretNode, closeTag.nextSibling);
    } else {
      caretNode = document.createTextNode(remaining || "​");
      parent.insertBefore(chip, container.nextSibling);
      parent.insertBefore(caretNode, chip.nextSibling);
    }

    const newRange = document.createRange();
    newRange.setStart(caretNode, remaining ? 0 : 1);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    flushChange();
    setPanel(null);
  }

  useEffect(() => {
    if (!autoGrow || !editorRef.current) return;

    const el = editorRef.current;

    el.style.height = "0px";

    const next = el.scrollHeight;

    if (maxHeight && typeof maxHeight === "number") {
      el.style.height = `${Math.min(next, maxHeight)}px`;
    } else {
      el.style.height = `${next}px`;
    }
  }, [value, autoGrow, maxHeight]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setPanel(null), 150)}
        data-placeholder={placeholder}
        className="
          w-full
          h-full
          overflow-y-auto
          overflow-x-hidden
          whitespace-pre-wrap
          break-words
          outline-none
          text-[14px]
          font-medium
          leading-relaxed
          px-3
          py-2.5
          text-foreground/80
          empty:before:content-[attr(data-placeholder)]
          empty:before:text-muted-foreground/40
          empty:before:pointer-events-none
        "
        style={{
          height,
          minHeight,
          maxHeight,
        }}
      />

      {panel && editorRef.current && (
        <MentionPanel
          state={panel}
          onTabChange={(tab) => setPanel((p) => (p ? { ...p, tab } : null))}
          nodes={nodes}
          anchorEl={editorRef.current}
          onSelect={doInsert}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}
