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
  FileSearch,
  CopyPlus,
  Copy,
  Replace,
  SkipForward,
  Pin,
  StickyNote,
  CircleHelp,
  ExternalLink,
  Trash2,
  Download,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RemoveFormatting,
  Loader2,
  X,
  AlertTriangle,
  User,
  FileText,
  Zap,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEditableTextInput } from "./inline-editable-text-input";
import { NodeHandle } from "./node-handle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getNodeDef,
  getModelProvider,
  type CanvasNode,
  type NodeDef,
  type NodeRunStatus,
} from "@/lib/editor-nodes";
import { type KnowledgeBaseOut } from "@/lib/api";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import { Textarea } from "../ui/textarea";

export const NODE_WIDTH = 260;
export const HANDLE_Y_OFFSET = 24;
export const HANDLE_SIDE_OFFSET = 16;

interface ActionConfig {
  providerId: string;
  providerName: string;
  providerIcon: {
    type: string;
    letter?: string;
    bg?: string;
    fg?: string;
    id?: string;
  };
  toolId: string;
  toolName: string;
  toolDescription: string;
}

function parseActionConfig(inputValue?: string): ActionConfig | null {
  if (!inputValue) return null;
  try {
    const p = JSON.parse(inputValue);
    if (p.providerId && p.toolName) return p as ActionConfig;
  } catch {}
  return null;
}

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
      <span className="flex-1 font-normal font-sans">{label}</span>
      {RightIcon && <RightIcon className="h-3.5 w-3.5 text-muted-foreground" />}
    </div>
  );
}

function NodeContentSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-medium text-prune-darkGray mb-1.5">
      {children}
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
  const [fmt, setFmt] = useState({
    bold: false,
    italic: false,
    underline: false,
    block: "",
  });

  // Animate toolbar in on focus, animate out then unmount on blur
  useEffect(() => {
    if (isFocused) {
      setToolbarMounted(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setToolbarVisible(true)),
      );
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
      if (
        !editorRef.current?.contains(document.activeElement) &&
        document.activeElement !== editorRef.current
      )
        return;
      setFmt({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        block: document.queryCommandValue("formatBlock").toLowerCase(),
      });
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  const refreshFmt = () => {
    setFmt({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      block: document.queryCommandValue("formatBlock").toLowerCase(),
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
          <FmtBtn
            title="Bold"
            isActive={fmt.bold}
            onExecute={() => exec("bold")}
          >
            <Bold className="h-3.5 w-3.5" />
          </FmtBtn>
          <FmtBtn
            title="Italic"
            isActive={fmt.italic}
            onExecute={() => exec("italic")}
          >
            <Italic className="h-3.5 w-3.5" />
          </FmtBtn>
          <FmtBtn
            title="Underline"
            isActive={fmt.underline}
            onExecute={() => exec("underline")}
          >
            <Underline className="h-3.5 w-3.5" />
          </FmtBtn>
          <div className="w-px h-3 bg-prune-lightGray mx-0.5 shrink-0" />
          <FmtBtn
            title="Bullet list"
            isActive={
              fmt.block === "ul" ||
              document.queryCommandState("insertUnorderedList")
            }
            onExecute={() => exec("insertUnorderedList")}
          >
            <List className="h-3.5 w-3.5" />
          </FmtBtn>
          <FmtBtn
            title="Numbered list"
            isActive={
              fmt.block === "ol" ||
              document.queryCommandState("insertOrderedList")
            }
            onExecute={() => exec("insertOrderedList")}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </FmtBtn>
          <div className="w-px h-3 bg-prune-lightGray mx-0.5 shrink-0" />
          <FmtBtn
            title="Heading 1"
            isActive={fmt.block === "h1"}
            onExecute={() => exec("formatBlock", "h1")}
          >
            <span className="text-[12px] font-semibold leading-none">
              H<sub className="text-[9px] relative bottom-[-1px]">1</sub>
            </span>
          </FmtBtn>
          <FmtBtn
            title="Heading 2"
            isActive={fmt.block === "h2"}
            onExecute={() => exec("formatBlock", "h2")}
          >
            <span className="text-[12px] font-semibold leading-none">
              H<sub className="text-[9px] relative bottom-[-1px]">2</sub>
            </span>
          </FmtBtn>
          <FmtBtn
            title="Heading 3"
            isActive={fmt.block === "h3"}
            onExecute={() => exec("formatBlock", "h3")}
          >
            <span className="text-[12px] font-semibold leading-none">
              H<sub className="text-[9px] relative bottom-[-1px]">3</sub>
            </span>
          </FmtBtn>
          <div className="w-px h-3 bg-prune-lightGray mx-0.5 shrink-0" />
          <FmtBtn
            title="Clear formatting"
            isActive={false}
            onExecute={() => exec("removeFormat")}
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
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
            className="px-3 py-2.5 focus:outline-none leading-relaxed cursor-text prose prose-sm max-w-none"
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

function OutputNodeContent({ node: _node, runOutput }: { node: CanvasNode; runOutput?: string }) {
  const [tab, setTab] = useState<"formatted" | "text">("formatted");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const content = (!cleared && runOutput) ? runOutput : "";
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  useEffect(() => {
    if (!downloadOpen) return;
    const handle = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node))
        setDownloadOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [downloadOpen]);

  useEffect(() => { if (runOutput) setCleared(false); }, [runOutput]);

  const handleDownload = (ext: "txt" | "csv") => {
    if (!content) return;
    const text = ext === "csv" ? `"${content.replace(/"/g, '""')}"` : content;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadOpen(false);
  };

  return (
    <div className="px-3 pb-2" onMouseDown={stop}>
      {/* Tab bar + action buttons row */}
      <div className="flex items-center gap-1 mb-2">
        <div className="flex items-center p-0.5 bg-muted/30 border border-prune-borderGray rounded-md">
          {(["Formatted", "Text"] as const).map((t) => (
            <button
              key={t}
              onClick={(e) => { stop(e); setTab(t.toLowerCase() as "formatted" | "text"); }}
              className={cn(
                "px-2.5 py-0.5 text-[11px] rounded transition-colors",
                tab === t.toLowerCase()
                  ? "bg-gray-900 text-white font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { stop(e); if (content) navigator.clipboard.writeText(content); }}
                onMouseDown={stop}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>

          <div ref={downloadRef} className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { stop(e); setDownloadOpen(v => !v); }}
                  onMouseDown={stop}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            {downloadOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-xl shadow-lg border px-1 py-1.5"
                onMouseDown={stop}
              >
                <button
                  onClick={(e) => { stop(e); handleDownload("txt"); }}
                  className="flex items-center w-full text-left px-2 py-1.5 text-[12px] text-foreground hover:bg-prune-lightGray rounded-md transition-colors"
                >
                  Plain text (.txt)
                </button>
                <button
                  onClick={(e) => { stop(e); handleDownload("csv"); }}
                  className="flex items-center w-full text-left px-2 py-1.5 text-[12px] text-foreground hover:bg-prune-lightGray rounded-md transition-colors"
                >
                  CSV (.csv)
                </button>
              </div>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { stop(e); setCleared(true); }}
                onMouseDown={stop}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content area */}
      {content ? (
        <div
          className="min-h-[60px] max-h-[140px] overflow-y-auto rounded-md border bg-background p-2"
          onWheel={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
        >
          {tab === "formatted" ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>
          )}
        </div>
      ) : (
        <div className="min-h-[64px] rounded-md border border-dashed flex items-center justify-center">
          <p className="text-[11px] text-muted-foreground/40 select-none">Run to see output</p>
        </div>
      )}
    </div>
  );
}

function NodeContent({
  node,
  def,
  onUpdateValue,
  onOpenDetail,
  allKbs,
  onRemoveKbFromNode,
  runOutput,
}: {
  node: CanvasNode;
  def: NodeDef;
  onUpdateValue: (id: string, value: string) => void;
  onOpenDetail?: (nodeId: string, section: "tools" | "knowledge-sources") => void;
  allKbs?: KnowledgeBaseOut[];
  onRemoveKbFromNode?: (nodeId: string, kbId: string) => void;
  runOutput?: string;
}) {
  const textareaClass =
    "w-full px-2 py-1.5 text-xs bg-prune-lightGray rounded text-foreground placeholder:text-muted-foreground/40 resize-none overflow-y-auto max-h-[80px] focus:outline-none focus:ring-1 focus:ring-prune-midGray";

  if (def.kind === "text-input") {
    return (
      <div className="px-3 pb-2">
        <Textarea
          rows={3}
          className="overflow-y-auto"
          placeholder="Enter value or leave blank for user input…"
          value={node.inputValue ?? ""}
          onChange={(e) => onUpdateValue(node.id, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onWheel={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
          fontSize={12}
        />
      </div>
    );
  }

  if (def.kind === "files") {
    const exposeAsInput = node.exposeAsInput ?? true;
    const fileCount = (node.preloadedFiles ?? []).length;
    return (
      <div className="px-3 pb-3 space-y-1.5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-prune-lightGray border border-prune-borderGray text-xs">
          <div className={cn(
            "h-4 w-4 rounded flex items-center justify-center border shrink-0",
            exposeAsInput ? "bg-gray-900 border-gray-900" : "border-gray-300 bg-white",
          )}>
            {exposeAsInput && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          <span className="font-[450] text-foreground">Exposed as input</span>
        </div>
        {!exposeAsInput && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-prune-lightGray border border-prune-borderGray text-xs text-muted-foreground">
            {fileCount > 0 ? (
              <>
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>{fileCount} file{fileCount !== 1 ? "s" : ""} uploaded</span>
              </>
            ) : (
              <>
                <div className="h-3.5 w-3.5 rounded-full border border-dashed border-muted-foreground shrink-0" />
                <span>No test files uploaded</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (def.kind === "url") {
    const urlMode = node.urlExtractionMode ?? "html";
    const urlSubpages = node.urlEnableSubpageCrawl ?? false;
    const urlAsInput = node.urlEnableAsInput ?? false;
    return (
      <div className="px-3 pb-3 space-y-1.5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-prune-lightGray border border-prune-borderGray text-xs text-muted-foreground">
          <Link2 className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {urlAsInput ? "From upstream node" : (node.inputValue || "Add a URL…")}
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-prune-lightGray border border-prune-borderGray text-[10px] font-[450] text-foreground">
            {urlMode === "html" ? "Page HTML" : "Metadata"}
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] text-muted-foreground",
            urlSubpages
              ? "bg-prune-lightGray border-prune-borderGray"
              : "bg-muted/20 border-border",
          )}>
            {urlSubpages && <Check className="h-2.5 w-2.5 text-foreground shrink-0" />}
            <span>Subpages</span>
          </div>
        </div>
      </div>
    );
  }

  // ai-agent with no provider selected yet — show minimal placeholder
  if (def.kind === "ai-agent" && !node.model) {
    return (
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-[450]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          No AI provider selected
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
          className="flex items-center gap-1.5 px-2 py-2 rounded-md bg-prune-lightGray text-xs text-foreground cursor-pointer hover:bg-muted/60 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span className="flex-1 font-[450] font-inter text-[12px]">{model}</span>
        </div>
        {/* Knowledge Sources */}
        <div>
          <NodeContentSectionLabel>Knowledge Sources</NodeContentSectionLabel>
          {(node.knowledgeBases ?? []).length > 0 && (
            <div className="flex flex-col gap-1 mb-1.5">
              {(allKbs ?? [])
                .filter((kb) => (node.knowledgeBases ?? []).includes(kb.id))
                .map((kb) => (
                  <div
                    key={kb.id}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-prune-borderGray bg-prune-lightGray"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 min-w-0 text-[12px] font-[450] text-foreground truncate">{kb.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenDetail?.(node.id, "knowledge-sources"); }}
                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                    >
                      <Database className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          )}
          <button
            className="w-full flex items-center justify-center shadow-sm gap-1 px-3 py-1 rounded-md border border-prune-borderGray font-medium text-[11px] text-foreground hover:bg-prune-lightGray transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onOpenDetail?.(node.id, "knowledge-sources"); }}
          >
            <Database className="h-3.5 w-3.5" />
            Add Knowledge Sources
          </button>
        </div>
        {/* Tools */}
        <div className="flex items-center group/tools w-fit">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="h-6 w-6 rounded-full border border-prune-borderGray bg-background flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail?.(node.id, "tools");
                }}
              >
                <Plus className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add Tools</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="-ml-1.5 h-6 w-6 rounded-full border border-prune-borderGray bg-background flex items-center justify-center text-muted-foreground hover:bg-muted/50 z-10 transition-all duration-200 ease-out group-hover/tools:translate-x-2"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail?.(node.id, "knowledge-sources");
                }}
              >
                <FileSearch className="h-3 w-3 text-gray-800" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add Knowledge Sources</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  if (def.kind === "knowledge-base") {
    return (
      <div className="px-3 pb-1.5">
        {/* <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
          Source
        </div>
        <div
          className="w-full px-2 py-1.5 text-xs bg-muted/30 border rounded text-muted-foreground/50"
          onMouseDown={(e) => e.stopPropagation()}
        >
          Select a knowledge base…
        </div> */}
      </div>
    );
  }

  if (def.kind === "subflow-tool") {
    let toolName = "";
    let toolDescription = "";
    try {
      const cfg = JSON.parse(node.inputValue ?? "{}");
      toolName = cfg.toolName ?? "";
      toolDescription = cfg.toolDescription ?? "";
    } catch {}
    return (
      <div className="px-3 pb-3 space-y-2" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-2.5 py-2 rounded-md bg-violet-50 border border-violet-100 space-y-0.5">
          <p className="text-[12px] font-medium text-violet-800 truncate">
            {toolName || "Configure tool name…"}
          </p>
          {toolDescription && (
            <p className="text-[11px] text-violet-600 line-clamp-2 leading-relaxed">{toolDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-900 text-[10px] font-mono text-emerald-400">
          <Database className="h-2.5 w-2.5 shrink-0 text-gray-400" />
          <span className="truncate">subflow_tool_input</span>
        </div>
      </div>
    );
  }

  if (def.kind === "workflow") {
    let wfName = "";
    let wfId = "";
    try {
      const cfg = JSON.parse(node.inputValue ?? "{}");
      wfName = cfg.workflowName ?? "";
      wfId = cfg.workflowId ?? "";
    } catch {}
    return (
      <div className="px-3 pb-3" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-2.5 py-2.5 rounded-md border bg-indigo-50 border-indigo-100">
          {wfName ? (
            <>
              <p className="text-[12px] font-medium text-indigo-800 truncate">{wfName}</p>
              <p className="text-[10px] font-mono text-indigo-500 truncate mt-0.5">{wfId}</p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">Select a workflow…</p>
          )}
        </div>
      </div>
    );
  }

  if (def.kind === "trigger") {
    const type = node.triggerType ?? "manual";
    const typeLabels: Record<string, string> = {
      manual: "Manual / Chat",
      scheduled: "Scheduled",
      webhook: "Webhook",
      integration: "Integration",
    };
    return (
      <div className="px-3 pb-3 space-y-1.5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-prune-lightGray border border-prune-borderGray text-xs">
          <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="font-[450] text-foreground">{typeLabels[type]}</span>
        </div>
        {type === "scheduled" && node.triggerScheduleCron && (
          <div className="px-2.5 py-1.5 rounded-lg bg-prune-lightGray border border-prune-borderGray text-[10px] font-mono text-muted-foreground truncate">
            {node.triggerScheduleCron}
          </div>
        )}
        {type === "webhook" && (
          <div className="px-2.5 py-1.5 rounded-lg bg-prune-lightGray border border-prune-borderGray text-[10px] font-mono text-muted-foreground">
            POST /v1/runs
          </div>
        )}
        {type === "integration" && node.triggerIntegrationId && (
          <div className="px-2.5 py-1.5 rounded-lg bg-prune-lightGray border border-prune-borderGray text-xs text-muted-foreground capitalize">
            {node.triggerIntegrationId.replace(/-/g, " ")}
          </div>
        )}
      </div>
    );
  }

  if (def.kind === "output") {
    return <OutputNodeContent node={node} runOutput={runOutput} />;
  }

  if (def.kind === "audio-input") {
    const provider = node.audioProvider ?? "deepgram";
    const model = node.audioModel ?? "nova-2";
    const providerLabels: Record<string, string> = {
      deepgram: "Deepgram",
      "whisper-1": "Whisper-1",
    };
    return (
      <div className="px-3 pb-3 space-y-1.5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-prune-lightGray border border-prune-borderGray text-xs">
          <Mic className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="font-[450] text-foreground">{providerLabels[provider]}</span>
        </div>
        {provider === "deepgram" && (
          <div className="px-2.5 py-1.5 rounded-lg bg-prune-lightGray border border-prune-borderGray text-[10px] font-mono text-muted-foreground">
            {model}
          </div>
        )}
      </div>
    );
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
          <div className="text-muted-foreground">
            This node allows you to create a template that can be used to format
            the output of other nodes.
          </div>
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
        onWheel={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
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
  onOpenDetail?: (
    nodeId: string,
    section: "tools" | "knowledge-sources",
  ) => void;
  allKbs?: KnowledgeBaseOut[];
  onRemoveKbFromNode?: (nodeId: string, kbId: string) => void;
  runStatus?: NodeRunStatus;
  runOutput?: string;
  onCardRef?: (el: HTMLDivElement | null) => void;
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
  onOpenDetail,
  allKbs,
  onRemoveKbFromNode,
  runStatus,
  runOutput,
  onCardRef,
}: NodeCardProps) {
  const def = getNodeDef(node.kind);
  if (!def) return null;

  const Icon = def.icon;
  const isLLMNode =
    def.kind === "ai-agent" ||
    def.kind === "prune-ai" ||
    def.kind === "openai-app";
  const actionConfig =
    def.kind === "action" ? parseActionConfig(node.inputValue) : null;

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
      ref={onCardRef}
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      className={cn(
        "absolute group/node bg-[#FFFFFF] rounded-xl shadow-sm select-none border transition-[border-color,box-shadow,opacity] duration-300 cursor-grab active:cursor-grabbing",
        "z-10 hover:z-20",
        runStatus === "running"
          ? "border-blue-400 shadow-blue-100/60 shadow-md"
          : runStatus === "done"
            ? "border-green-400"
            : runStatus === "error"
              ? "border-red-400"
              : runStatus === "pending"
                ? "opacity-50"
                : isSelected
                  ? "border-prune-midGray"
                  : "border-border",
      )}
      onMouseDown={(e) => {
        e.stopPropagation();
        onStartDrag(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if ((e.target as HTMLElement).closest("button")) return;
        onSelect?.(node.id);
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* Run status badge */}
      {runStatus && runStatus !== "pending" && (
        <div
          className={cn(
            "absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center z-30 border-2 border-background",
            runStatus === "running" && "bg-blue-500",
            runStatus === "done" && "bg-green-500",
            runStatus === "error" && "bg-red-500",
          )}
        >
          {runStatus === "running" && (
            <Loader2 className="h-3 w-3 text-white animate-spin" />
          )}
          {runStatus === "done" && <Check className="h-3 w-3 text-white" />}
          {runStatus === "error" && <X className="h-3 w-3 text-white" />}
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
          disabled={def.badge === "Output"}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-md bg-background border shadow-sm text-[10px] font-medium transition-colors whitespace-nowrap",
            def.badge === "Output"
              ? "text-muted-foreground/40 cursor-not-allowed"
              : "text-foreground hover:bg-muted",
          )}
        >
          <Play className="h-3 w-3" />
          Run
        </button>
      </div>

      {/* Connection handles */}
      <NodeHandle
        type="input"
        node={node}
        def={def}
        isConnecting={isConnecting}
        connectingSourceId={connectingSourceId}
        onStartConnect={onStartConnect}
        onCompleteConnect={onCompleteConnect}
        onOpenPicker={onOpenPicker}
      />
      <NodeHandle
        type="output"
        node={node}
        def={def}
        isConnecting={isConnecting}
        connectingSourceId={connectingSourceId}
        onStartConnect={onStartConnect}
        onCompleteConnect={onCompleteConnect}
        onOpenPicker={onOpenPicker}
      />

      {/* Header */}
      <div className="mb-1.5">
        <div
          className="px-3 pt-2.5 pb-1 flex items-center gap-1"
        >
          <div
            className={cn(
              "h-7 w-7 rounded-md border border-gray-400 flex items-center justify-center shrink-0 overflow-hidden",
              !actionConfig ? "bg-muted/50" : "",
            )}
            style={
              actionConfig?.providerIcon.type === "letter"
                ? { backgroundColor: "#FFFFFF" }
                : undefined
            }
          >
            {actionConfig ? (
              actionConfig.providerIcon.type === "integration" ? (
                renderIntegrationIcon(
                  actionConfig.providerIcon.id as Parameters<
                    typeof renderIntegrationIcon
                  >[0],
                  14,
                )
              ) : (
                <span
                  className="text-[11px] font-bold leading-none"
                  style={{ color: actionConfig.providerIcon.fg ?? "#fff" }}
                >
                  {actionConfig.providerIcon.letter}
                </span>
              )
            ) : isLLMNode ? (
              def.kind === "ai-agent" && !node.model ? (
                <Icon className={cn("h-3.5 w-3.5", def.iconClass)} />
              ) : (
                getLLMIcon(
                  node.model ??
                    (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6"),
                  14,
                )
              )
            ) : def.integrationId ? (
              renderIntegrationIcon(def.integrationId, 14)
            ) : (
              <Icon className={cn("h-3.5 w-3.5", def.iconClass)} />
            )}
          </div>
          <div
            className="min-w-0 flex-1 pt-0.5"
            onKeyDown={(e) => e.stopPropagation()}
          >
            <InlineEditableTextInput
              value={node.label}
              onCommit={(label) => onUpdateLabel?.(node.id, label)}
              textSize="text-xs"
              editOnDoubleClick
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

        {/* Node Description */}
        <div className="px-3 pt-0.5 text-[11px] tracking-normal leading-4 font-inter font-[450] text-prune-darkGray line-clamp-2">
          {actionConfig?.toolDescription ?? def.description}
        </div>
      </div>

      {/* Content */}
      <NodeContent
        node={node}
        def={def}
        onUpdateValue={onUpdateValue}
        onOpenDetail={onOpenDetail}
        allKbs={allKbs}
        onRemoveKbFromNode={onRemoveKbFromNode}
        runOutput={runOutput}
      />

      {/* Footer */}
      {def.kind === "action" ? (
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
          <span className="ml-auto">
            {actionConfig ? "v1.0.0" : "Unset version"}
          </span>
        </div>
      ) : def.kind === "template-out" ? (
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
          {def.kind === "ai-agent" && !node.model ? (
            <span className="ml-auto flex items-center gap-0.5 text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              0.00 sec
            </span>
          ) : (
            <>
              <span className="ml-auto">0 tokens</span>
              <span className="flex items-center gap-0.5">
                <MoreHorizontal className="h-3 w-3 rotate-90 opacity-40" />
                0.0 sec
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
