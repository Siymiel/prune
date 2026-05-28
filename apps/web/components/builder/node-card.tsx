"use client";

import ReactMarkdown from "react-markdown";
import { useRef, useState, useEffect } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  EllipsisVertical,
  Plus,
  Play,
  Layers,
  Database,
  Link2,
  Check,
  FileSearch2,
  CopyPlus,
  Copy,
  Download,
  Replace,
  SkipForward,
  Pin,
  StickyNote,
  CircleHelp,
  ExternalLink,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Loader2,
  X,
  AlertTriangle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodeDef,
  getModelProvider,
  type CanvasNode,
  type NodeDef,
  type NodeRunStatus,
} from "@/lib/editor-nodes";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";

export const NODE_WIDTH = 260;
export const HANDLE_Y_OFFSET = 24;
export const HANDLE_SIDE_OFFSET = 16;

function getLLMIcon(model: string, size: number): React.ReactNode {
  return renderIntegrationIcon(getModelProvider(model), size);
}

function darkenColor(hex: string, amount = 0.12): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  rightIcon: RightIcon,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  rightIcon?: React.ElementType;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-2 py-1.5 text-[13px] font-medium cursor-pointer transition-colors select-none",
        danger
          ? "text-red-500 hover:bg-red-100 rounded-md"
          : "text-foreground hover:bg-prune-lightGray rounded-md",
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          danger ? "text-red-500" : "text-foreground",
        )}
      />
      <span className="flex-1 font-normal">{label}</span>
      {RightIcon && <RightIcon className="h-3.5 w-3.5 text-muted-foreground" />}
    </div>
  );
}

const STICKY_COLORS = [
  "#FEF9C3",
  "#FCE7F3",
  "#DBEAFE",
  "#D1FAE5",
  "#EDE9FE",
  "#FFEDD5",
  "#E0F2FE",
  "#FEE2E2",
];

function FmtBtn({
  children,
  onExecute,
  title,
  isActive,
}: {
  children: React.ReactNode;
  onExecute: () => void;
  title: string;
  isActive?: boolean;
}) {
  return (
    <button
      title={title}
      className={cn(
        "h-5 w-5 flex items-center justify-center rounded transition-colors",
        isActive
          ? "bg-gray-800 text-white hover:bg-gray-700"
          : "text-prune-darkGray hover:bg-black/10",
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onExecute();
      }}
    >
      {children}
    </button>
  );
}

function StickyNoteEditor({
  nodeId,
  text,
  color,
  onUpdateText,
  onUpdateColor,
}: {
  nodeId: string;
  text: string;
  color: string;
  onUpdateText?: (id: string, html: string) => void;
  onUpdateColor?: (id: string, color: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [toolbarMounted, setToolbarMounted] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, block: '' });

  // Animate toolbar in on focus, animate out then unmount on blur
  useEffect(() => {
    if (isFocused) {
      setToolbarMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setToolbarVisible(true)));
    } else {
      setToolbarVisible(false);
      const t = setTimeout(() => setToolbarMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (document.activeElement === editorRef.current) return;
    if (editorRef.current.innerHTML !== text) {
      editorRef.current.innerHTML = text || "";
    }
  }, [text]);

  // Sync active-format state whenever the caret moves inside this editor
  useEffect(() => {
    const update = () => {
      if (!editorRef.current?.contains(document.activeElement) && document.activeElement !== editorRef.current) return;
      setFmt({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        block: document.queryCommandValue('formatBlock').toLowerCase(),
      });
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  const refreshFmt = () => {
    setFmt({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      block: document.queryCommandValue('formatBlock').toLowerCase(),
    });
  };

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    requestAnimationFrame(() => {
      if (editorRef.current)
        onUpdateText?.(nodeId, editorRef.current.innerHTML);
      refreshFmt();
    });
  };

  return (
    <>
      {/* Toolbar — white bg, pops up from the note on focus, slides back on blur */}
      {toolbarMounted && (
        <div
          className={cn(
            "mb-1 bg-white rounded-lg border border-gray-200 shadow-sm px-2 py-1.5 flex items-center gap-0.5",
            "transition-all duration-[180ms] ease-out origin-bottom",
            toolbarVisible
              ? "opacity-100 translate-y-0 scale-y-100"
              : "opacity-0 translate-y-2 scale-y-95 pointer-events-none",
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color picker */}
          <div className="relative mr-0.5">
            <button
              className="w-4 h-4 rounded-full border border-black/15 shrink-0 block"
              style={{ backgroundColor: color }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                setColorPickerOpen((v) => !v);
              }}
            />
            {colorPickerOpen && (
              <div
                className="absolute top-full left-0 mt-1 flex gap-1 p-1.5 bg-white rounded-lg shadow-lg border border-gray-100 z-[60]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "w-4 h-4 rounded-full border border-black/10 hover:scale-125 transition-transform",
                      c === color && "ring-2 ring-offset-1 ring-prune-midGray",
                    )}
                    style={{ backgroundColor: c }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateColor?.(nodeId, c);
                      setColorPickerOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-3 bg-prune-lightGray mx-0.5 shrink-0" />
          <FmtBtn title="Bold" isActive={fmt.bold} onExecute={() => exec("bold")}>
            <Bold className="h-3.5 w-3.5" />
          </FmtBtn>
          <FmtBtn title="Italic" isActive={fmt.italic} onExecute={() => exec("italic")}>
            <Italic className="h-3.5 w-3.5" />
          </FmtBtn>
          <FmtBtn title="Underline" isActive={fmt.underline} onExecute={() => exec("underline")}>
            <Underline className="h-3.5 w-3.5" />
          </FmtBtn>
          <div className="w-px h-3 bg-prune-lightGray mx-0.5 shrink-0" />
          <FmtBtn
            title="Bullet list"
            isActive={fmt.block === 'ul' || document.queryCommandState('insertUnorderedList')}
            onExecute={() => exec("insertUnorderedList")}
          >
            <List className="h-3.5 w-3.5" />
          </FmtBtn>
          <FmtBtn
            title="Numbered list"
            isActive={fmt.block === 'ol' || document.queryCommandState('insertOrderedList')}
            onExecute={() => exec("insertOrderedList")}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </FmtBtn>
          <div className="w-px h-3 bg-prune-lightGray mx-0.5 shrink-0" />
          <FmtBtn title="Heading 1" isActive={fmt.block === 'h1'} onExecute={() => exec("formatBlock", "h1")}>
            <span className="text-[12px] font-semibold leading-none">
              H<sub className="text-[9px] relative bottom-[-1px]">1</sub>
            </span>
          </FmtBtn>
          <FmtBtn title="Heading 2" isActive={fmt.block === 'h2'} onExecute={() => exec("formatBlock", "h2")}>
            <span className="text-[12px] font-semibold leading-none">
              H<sub className="text-[9px] relative bottom-[-1px]">2</sub>
            </span>
          </FmtBtn>
          <FmtBtn title="Heading 3" isActive={fmt.block === 'h3'} onExecute={() => exec("formatBlock", "h3")}>
            <span className="text-[12px] font-semibold leading-none">
              H<sub className="text-[9px] relative bottom-[-1px]">3</sub>
            </span>
          </FmtBtn>
        </div>
      )}

      {/* Sticky note body — always the colored card */}
      <div
        className="rounded-xl shadow-sm border overflow-hidden cursor-text"
        style={{ backgroundColor: color, borderColor: darkenColor(color) }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {!text && !isFocused && (
            <div className="absolute top-0 left-0 px-3 py-2.5 text-sm text-black/30 pointer-events-none select-none">
              Add a note…
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="px-3 py-2.5 text-base focus:outline-none text-gray-800 leading-relaxed min-h-[72px] cursor-text [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setColorPickerOpen(false);
            }}
            onInput={() => {
              if (editorRef.current)
                onUpdateText?.(nodeId, editorRef.current.innerHTML);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </>
  );
}

// ── Editable label ────────────────────────────────────────────────────────────

function EditableLabel({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => { inputRef.current?.select(); });
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') setEditing(false);
          e.stopPropagation();
        }}
        onMouseDown={e => e.stopPropagation()}
        className="text-sm font-medium leading-tight bg-muted/60 rounded px-1 py-1 -mx-1 w-full outline-none focus:ring-1 focus:ring-prune-midGray"
      />
    );
  }

  return (
    <div
      className="text-sm font-medium leading-tight rounded px-1 py-1 -mx-1 hover:bg-prune-lightGray cursor-grab transition-colors"
      onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
    >
      {value}
    </div>
  );
}

function OutputNodeContent({ node }: { node: CanvasNode }) {
  const [tab, setTab] = useState<"formatted" | "text">("formatted");
  const content = node.inputValue ?? "";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
  };

  const handleDownloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    const win = window.open("", "_blank");
    if (!win) return;
    const escaped = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    win.document.write(
      `<!DOCTYPE html><html><head><title>Output</title><style>body{font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto;line-height:1.6}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><pre>${escaped}</pre></body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center border rounded-md overflow-hidden text-[11px]">
          <button
            className={cn(
              "px-2.5 py-1 font-medium transition-colors",
              tab === "formatted"
                ? "bg-gray-900 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setTab("formatted"); }}
          >
            Formatted
          </button>
          <button
            className={cn(
              "px-2.5 py-1 transition-colors",
              tab === "text"
                ? "bg-gray-900 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setTab("text"); }}
          >
            Text
          </button>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleDownloadPDF}
            title="Download as PDF"
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className={cn("min-h-[72px] rounded-md border bg-background", content && "p-2")}>
        {content ? (
          tab === "formatted" ? (
            <div className="text-xs text-foreground leading-relaxed [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-1 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:mb-0.5 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-1 [&_code]:bg-muted/50 [&_code]:px-0.5 [&_code]:rounded [&_code]:font-mono [&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_blockquote]:text-muted-foreground">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">
              {content}
            </pre>
          )
        ) : null}
      </div>
    </div>
  );
}

function NodeContent({
  node,
  def,
  onUpdateValue,
}: {
  node: CanvasNode;
  def: NodeDef;
  onUpdateValue: (id: string, value: string) => void;
}) {
  const textareaClass =
    "w-full px-2 py-1.5 text-xs bg-prune-lightGray rounded text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-prune-midGray";

  if (def.kind === "text-input") {
    return (
      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
          Value
        </div>
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Enter value or leave blank for user input…"
          value={node.inputValue ?? ""}
          onChange={(e) => onUpdateValue(node.id, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  if (def.kind === "url") {
    return (
      <div className="px-3 pb-3 space-y-2.5">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border text-xs text-muted-foreground"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Link2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{node.inputValue || "Add a URL…"}</span>
        </div>
        <div>
          <div className="text-[10px] font-medium text-muted-foreground/70 mb-1.5">
            Settings
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-foreground shrink-0" />
              <span>Scrape subpages on</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
              Website URL
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    def.kind === "ai-agent" ||
    def.kind === "prune-ai" ||
    def.kind === "openai-app"
  ) {
    const model =
      node.model ??
      (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6");
    return (
      <div className="px-3 pb-3 space-y-3">
        {/* Model selector */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-prune-lightGray/50 text-xs text-foreground cursor-pointer hover:bg-muted/60 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 font-medium">{model}</span>
        </div>
        {/* Knowledge Sources */}
        <div>
          <div className="text-[10px] font-medium text-muted-foreground/70 mb-1.5">
            Knowledge Sources
          </div>
          <button
            className="w-full flex items-center justify-center shadow-xs gap-2 px-3 py-1 rounded-lg border text-[11px] text-foreground hover:bg-muted/30 transition-colors font-normal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Database className="h-3.5 w-3.5" />
            Add Knowledge Sources
          </button>
        </div>
        {/* Tools */}
        <div>
          <div className="text-[10px] font-medium text-muted-foreground/70 mb-1.5">
            Tools
          </div>
          <div className="flex items-center">
            <button
              className="h-6 w-6 rounded-full border bg-background flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors z-10"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Plus className="h-3 w-3" />
            </button>
            <div className="-ml-1.5 h-6 w-6 rounded-full border bg-muted/30 flex items-center justify-center text-muted-foreground">
              <FileSearch2 className="h-3 w-3 text-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (def.kind === "knowledge-base") {
    return (
      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
          Source
        </div>
        <div
          className="w-full px-2 py-1.5 text-xs bg-muted/30 border rounded text-muted-foreground/50"
          onMouseDown={(e) => e.stopPropagation()}
        >
          Select a knowledge base…
        </div>
      </div>
    );
  }

  if (def.kind === "trigger") {
    return null;
  }

  if (def.kind === "output") {
    return <OutputNodeContent node={node} />;
  }

  if (def.kind === "audio-output") {
    return (
      <div className="px-3 pb-3 space-y-1.5">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>eleven_multilingual_v2</span>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>Sarah</span>
        </div>
      </div>
    );
  }

  if (def.kind === "template-out") {
    return (
      <div className="px-3 pb-3">
        <div className="rounded-lg bg-muted/30 border p-3 min-h-[80px] text-xs leading-relaxed">
          <div className="font-bold text-[13px] mb-0.5">Template Node</div>
          <div className="font-semibold text-[12px] mb-0.5">How this works</div>
          <div className="text-muted-foreground">This node allows you to create a template that can be used to format the output of other nodes.</div>
        </div>
      </div>
    );
  }

  if (def.kind === "action") {
    return null;
  }

  if (def.badge === "Output") {
    return (
      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
          Value
        </div>
        <div className="px-2 py-1.5 text-xs bg-muted/30 border rounded text-muted-foreground/50 font-mono">
          {"{{result}}"}
        </div>
      </div>
    );
  }

  if (def.badge === "App") {
    return (
      <div className="px-3 pb-3">
        <div className="px-2 py-2 bg-muted/30 border rounded text-[10px] text-muted-foreground leading-relaxed">
          {def.description}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3">
      <textarea
        className={textareaClass}
        rows={2}
        placeholder={def.description}
        value={node.inputValue ?? ""}
        onChange={(e) => onUpdateValue(node.id, e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

interface NodeCardProps {
  node: CanvasNode;
  isConnecting: boolean;
  connectingSourceId: string | null;
  isSelected?: boolean;
  onStartDrag: (e: React.MouseEvent) => void;
  onUpdateValue: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onStartConnect: (nodeId: string) => void;
  onCompleteConnect: (nodeId: string) => void;
  onSelect?: (nodeId: string) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onOpenPicker?: (
    nodeId: string,
    screenX: number,
    screenY: number,
    side: "input" | "output",
  ) => void;
  onToggleStickyNote?: (id: string) => void;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onUpdateStickyNoteColor?: (id: string, color: string) => void;
  onUpdateLabel?: (id: string, label: string) => void;
  runStatus?: NodeRunStatus;
}

export function NodeCard({
  node,
  isConnecting,
  connectingSourceId,
  isSelected,
  onStartDrag,
  onUpdateValue,
  onRemove,
  onDuplicate,
  onStartConnect,
  onCompleteConnect,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onOpenPicker,
  onToggleStickyNote,
  onUpdateStickyNote,
  onUpdateStickyNoteColor,
  onUpdateLabel,
  runStatus,
}: NodeCardProps) {
  const def = getNodeDef(node.kind);
  if (!def) return null;

  const Icon = def.icon;
  const isSource = connectingSourceId === node.id;
  const isLLMNode =
    def.kind === "ai-agent" ||
    def.kind === "prune-ai" ||
    def.kind === "openai-app";

  const outputDragMoved = useRef(false);
  const outputDragCleanup = useRef<(() => void) | null>(null);
  const inputDragMoved = useRef(false);
  const inputDragCleanup = useRef<(() => void) | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  return (
    <div
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      className={cn(
        "absolute group/node bg-card rounded-xl shadow-sm select-none border transition-all duration-300",
        "z-10 hover:z-20",
        runStatus === 'running' ? "border-blue-400 shadow-blue-100/60 shadow-md"
          : runStatus === 'done'    ? "border-green-400"
          : runStatus === 'error'   ? "border-red-400"
          : runStatus === 'pending' ? "opacity-50"
          : isSelected ? "border-prune-midGray" : "border-border",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if ((e.target as HTMLElement).closest("button")) return;
        onSelect?.(node.id);
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* Run status badge */}
      {runStatus && runStatus !== 'pending' && (
        <div className={cn(
          "absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center z-30 border-2 border-background",
          runStatus === 'running' && "bg-blue-500",
          runStatus === 'done'    && "bg-green-500",
          runStatus === 'error'   && "bg-red-500",
        )}>
          {runStatus === 'running' && <Loader2 className="h-3 w-3 text-white animate-spin" />}
          {runStatus === 'done'    && <Check className="h-3 w-3 text-white" />}
          {runStatus === 'error'   && <X className="h-3 w-3 text-white" />}
        </div>
      )}

      {/* Sticky Note */}
      {node.stickyNote?.visible && (
        <div
          className="absolute bottom-full left-0 w-full mb-10 z-50"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <StickyNoteEditor
            nodeId={node.id}
            text={node.stickyNote.text}
            color={node.stickyNote.color}
            onUpdateText={onUpdateStickyNote}
            onUpdateColor={onUpdateStickyNoteColor}
          />
        </div>
      )}

      {/* Run button */}
      <div className="absolute -top-8 left-0 right-0 pb-1 flex justify-start pointer-events-none opacity-0 group-hover/node:opacity-100 transition-opacity z-30">
        <button
          disabled={def.badge === 'Output'}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-md bg-background border shadow-sm text-[10px] font-medium transition-colors whitespace-nowrap",
            def.badge === 'Output'
              ? "text-muted-foreground/40 cursor-not-allowed"
              : "text-foreground hover:bg-muted",
          )}
        >
          <Play className="h-3 w-3" />
          Run
        </button>
      </div>

      {/* INPUT handle — hidden for trigger nodes */}
      {node.kind !== "trigger" && (
        <button
          style={{ top: HANDLE_Y_OFFSET - 10, left: -22 }}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (isConnecting) return;
            inputDragMoved.current = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const onMove = (me: MouseEvent) => {
              if (
                !inputDragMoved.current &&
                Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY) >
                  6
              ) {
                inputDragMoved.current = true;
                document.removeEventListener("mousemove", onMove);
                inputDragCleanup.current = null;
              }
            };
            inputDragCleanup.current = () =>
              document.removeEventListener("mousemove", onMove);
            document.addEventListener("mousemove", onMove);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            inputDragCleanup.current?.();
            inputDragCleanup.current = null;
            if (isConnecting && !isSource) {
              onCompleteConnect(node.id);
            } else if (!isConnecting && !inputDragMoved.current) {
              onOpenPicker?.(node.id, e.clientX, e.clientY, "input");
            }
          }}
          className={cn(
            "absolute w-4 h-4 rounded-md border z-20 flex items-center justify-center transition-all duration-200 ease-out",
            "group-hover/node:scale-125 hover:scale-125",
            "hover:bg-black hover:border-black",
            isConnecting && !isSource
              ? "bg-primary/20 border-primary cursor-pointer animate-pulse"
              : "bg-background border-muted-foreground/30",
          )}
        >
          {!isConnecting && (
            <Plus className="h-3 w-3 text-black opacity-0 transition-all duration-200 group-hover/node:opacity-100 hover:text-white" />
          )}
        </button>
      )}

      {/* OUTPUT handle — hidden for output nodes (they only receive) */}
      {def.kind !== "output" && <button
        style={{ top: HANDLE_Y_OFFSET - 10, right: -22 }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (isConnecting) return;

          outputDragMoved.current = false;
          const startX = e.clientX;
          const startY = e.clientY;

          const onMove = (me: MouseEvent) => {
            if (
              !outputDragMoved.current &&
              Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY) > 6
            ) {
              outputDragMoved.current = true;
              document.removeEventListener("mousemove", onMove);
              outputDragCleanup.current = null;
              onStartConnect(node.id);
            }
          };
          outputDragCleanup.current = () =>
            document.removeEventListener("mousemove", onMove);
          document.addEventListener("mousemove", onMove);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          outputDragCleanup.current?.();
          outputDragCleanup.current = null;
          if (isConnecting) {
            onCompleteConnect(node.id);
          } else if (!outputDragMoved.current) {
            onOpenPicker?.(node.id, e.clientX, e.clientY, "output");
          }
        }}
        className={cn(
          "absolute w-4 h-4 rounded-md border z-20 flex items-center justify-center transition-all duration-200 ease-out",
          "group-hover/node:scale-125 hover:scale-125",
          "hover:bg-black hover:border-black",
          isSource
            ? "bg-primary border-primary"
            : isConnecting
              ? "bg-background border-muted-foreground/20 opacity-40 cursor-default"
              : "bg-background border-muted-foreground/30 cursor-pointer",
        )}
      >
        {isSource ? (
          <Plus className="h-3 w-3 text-white" />
        ) : !isConnecting ? (
          <Plus className="h-3 w-3 text-black opacity-0 transition-all duration-200 group-hover/node:opacity-100 hover:text-white" />
        ) : null}
      </button>}

      {/* Header */}
      <div className="mb-2.5">
        <div
          className="px-3 pt-2.5 pb-1 flex items-center gap-2 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartDrag(e);
          }}
        >
          <div className="h-7 w-7 rounded-md bg-muted/50 border flex items-center justify-center shrink-0">
            {isLLMNode ? (
              getLLMIcon(
                node.model ??
                  (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6"),
                14,
              )
            ) : def.integrationId ? (
              renderIntegrationIcon(def.integrationId, 14)
            ) : (
              <Icon className={cn("h-3.5 w-3.5", def.iconClass)} />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <EditableLabel
              value={node.label}
              onCommit={label => onUpdateLabel?.(node.id, label)}
            />
          </div>

          {/* Context menu trigger */}
          <div className="shrink-0 mt-0.5" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <EllipsisVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 z-50 w-52 bg-white rounded-xl shadow-lg border border-prune-lightGray px-1 py-1.5 overflow-hidden">
                <MenuItem
                  icon={CopyPlus}
                  label="Duplicate"
                  onClick={() => {
                    onDuplicate?.(node.id);
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  icon={Copy}
                  label="Copy"
                  onClick={() => setMenuOpen(false)}
                />
                <MenuItem
                  icon={Replace}
                  label="Replace node"
                  onClick={() => setMenuOpen(false)}
                />
                <MenuItem
                  icon={SkipForward}
                  label="Skip node"
                  onClick={() => setMenuOpen(false)}
                />
                <MenuItem
                  icon={Pin}
                  label="Pin output"
                  onClick={() => setMenuOpen(false)}
                />
                <MenuItem
                  icon={StickyNote}
                  label={
                    node.stickyNote?.visible
                      ? "Hide Sticky Note"
                      : "Show Sticky Note"
                  }
                  onClick={() => {
                    onToggleStickyNote?.(node.id);
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  icon={CircleHelp}
                  label="Help"
                  rightIcon={ExternalLink}
                  onClick={() => setMenuOpen(false)}
                />
                <div className="h-px bg-prune-lightGray mx-3 my-1" />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  danger
                  onClick={() => {
                    onRemove(node.id);
                    setMenuOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="px-3 text-[12px] text-muted-foreground line-clamp-1">
          {def.description}
        </div>
      </div>

      {/* Content */}
      <NodeContent node={node} def={def} onUpdateValue={onUpdateValue} />

      {/* Footer */}
      {def.kind === 'action' ? (
        <div className="px-3 py-2 border-t flex items-center gap-2 text-[10px] text-muted-foreground bg-prune-lightGray rounded-b-xl">
          <button
            className="flex items-center gap-0.5 hover:text-foreground transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ChevronDown className="h-3 w-3" />
            View Results
          </button>
          <span className="flex items-center gap-0.5 text-amber-500">
            <AlertTriangle className="h-3 w-3" />
            0.00 sec
          </span>
          <span className="ml-auto">Unset version</span>
        </div>
      ) : def.kind === 'template-out' ? (
        <div className="px-3 py-2 border-t flex items-center gap-2 text-[10px] text-muted-foreground bg-prune-lightGray rounded-b-xl">
          <button
            className="flex items-center gap-0.5 hover:text-foreground transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ChevronDown className="h-3 w-3" />
            View Results
          </button>
          <span className="ml-auto">0.00 sec</span>
        </div>
      ) : (
        <div className="px-3 py-2 border-t flex items-center gap-2 text-[10px] text-muted-foreground bg-prune-lightGray rounded-b-xl">
          <button
            className="flex items-center gap-0.5 hover:text-foreground transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ChevronDown className="h-3 w-3" />
            View Results
          </button>
          <span className="ml-auto">0 tokens</span>
          <span className="flex items-center gap-0.5">
            <MoreHorizontal className="h-3 w-3 rotate-90 opacity-40" />
            0.0 sec
          </span>
        </div>
      )}
    </div>
  );
}
