"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Link2,
  Settings2,
  Cpu,
  Database,
  Zap,
  AlignLeft,
  Wrench,
  Plus,
  Layers,
  ChevronsLeftRight,
  PencilLineIcon,
  MoreVertical,
  Copy,
  SkipForward,
  Crosshair,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodeDef,
  getModelProvider,
  type CanvasNode,
  type NodeDef,
} from "@/lib/editor-nodes";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";

const KIND_PREFIX: Record<string, string> = {
  "text-input": "in",
  url: "url",
  files: "files",
  trigger: "trigger",
  "audio-input": "audio",
  output: "out",
  action: "action",
  "audio-output": "audio-out",
  "template-output": "tpl",
  "ai-agent": "ai",
  "knowledge-base": "kb",
  "prune-ai": "prune",
  "whatsapp-app": "wa",
  mpesa: "mpesa",
  "openai-app": "openai",
  "slack-app": "slack",
  "gmail-app": "gmail",
  "sheets-app": "sheets",
  "calendar-app": "cal",
  "notion-app": "notion",
  "airtable-app": "airtable",
  "if-else": "if",
  code: "code",
  loop: "loop",
  "ai-routing": "router",
  "sticky-note": "note",
  "default-message": "msg",
  delay: "delay",
  "shared-memory": "mem",
  "vector-store": "vs",
  "text-to-sql": "sql",
  "search-tables": "tbl",
  "search-data": "search",
};

function getNodeIdentifier(node: CanvasNode, nodes: CanvasNode[]): string {
  const prefix = KIND_PREFIX[node.kind] ?? node.kind.split("-")[0];
  const sameKind = nodes.filter((n) => n.kind === node.kind);
  const index = Math.max(
    0,
    sameKind.findIndex((n) => n.id === node.id),
  );
  return `${prefix}-${index}`;
}

function Section({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <span className="flex-1 text-left text-sm font-medium">{title}</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";
const textareaClass = `${inputClass} resize-none font-medium text-[16px]`;

function PanelSections({
  node,
  def,
  onUpdateValue,
}: {
  node: CanvasNode;
  def: NodeDef;
  onUpdateValue: (id: string, value: string) => void;
}) {
  if (def.kind === "url") {
    return (
      <>
        <Section
          title="Test URL"
          icon={<Link2 className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FieldLabel>Website URL</FieldLabel>
          <input
            type="url"
            className={inputClass}
            placeholder="https://example.com"
            value={node.inputValue ?? ""}
            onChange={(e) => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">
            No options configured.
          </p>
        </Section>
        <Section
          title="Chunking Settings"
          icon={<Settings2 className="h-3.5 w-3.5" />}
        >
          <p className="text-xs text-muted-foreground">
            Using default chunking settings.
          </p>
        </Section>
      </>
    );
  }

  if (def.kind === "text-input") {
    return (
      <>
        <Section
          title="Value"
          icon={<AlignLeft className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FieldLabel>Default value</FieldLabel>
          <textarea
            className={textareaClass}
            rows={4}
            placeholder="Enter value or leave blank for user input…"
            value={node.inputValue ?? ""}
            onChange={(e) => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">
            No options configured.
          </p>
        </Section>
      </>
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
      <>
        <Section
          title="Prompt"
          icon={<Cpu className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FieldLabel>System prompt</FieldLabel>
          <textarea
            className={textareaClass}
            rows={5}
            placeholder="You are a helpful assistant that…"
            value={node.inputValue ?? ""}
            onChange={(e) => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Model" icon={<Layers className="h-3.5 w-3.5" />}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border text-xs text-muted-foreground">
            <span className="flex items-center justify-center shrink-0">
              {renderIntegrationIcon(getModelProvider(model), 12)}
            </span>
            {model}
          </div>
        </Section>
        <Section
          title="Knowledge Sources"
          icon={<Database className="h-3.5 w-3.5" />}
        >
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Add Knowledge Sources
          </button>
        </Section>
        <Section title="Tools" icon={<Wrench className="h-3.5 w-3.5" />}>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Add tools
          </button>
        </Section>
      </>
    );
  }

  if (def.kind === "knowledge-base") {
    return (
      <>
        <Section
          title="Source"
          icon={<Database className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FieldLabel>Knowledge base</FieldLabel>
          <div className="w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-muted-foreground/50">
            Select a knowledge base…
          </div>
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">
            No options configured.
          </p>
        </Section>
      </>
    );
  }

  if (def.kind === "trigger") {
    return (
      <>
        <Section
          title="Event"
          icon={<Zap className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <div className="px-3 py-2 bg-muted/30 border rounded-md text-xs text-muted-foreground">
            Event:{" "}
            <span className="text-foreground font-medium">
              WhatsApp message received
            </span>
          </div>
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">
            No options configured.
          </p>
        </Section>
      </>
    );
  }

  return (
    <>
      <Section
        title="Configuration"
        icon={<Settings2 className="h-3.5 w-3.5" />}
        defaultOpen
      >
        {def.badge === "App" ? (
          <div className="px-3 py-2 bg-muted/30 border rounded-md text-xs text-muted-foreground leading-relaxed">
            {def.description}
          </div>
        ) : def.badge === "Output" ? (
          <>
            <FieldLabel>Output value</FieldLabel>
            <div className="px-3 py-1.5 text-xs bg-muted/30 border rounded-md text-muted-foreground/50 font-mono">
              {"{{result}}"}
            </div>
          </>
        ) : (
          <>
            <FieldLabel>Value</FieldLabel>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder={def.description}
              value={node.inputValue ?? ""}
              onChange={(e) => onUpdateValue(node.id, e.target.value)}
            />
          </>
        )}
      </Section>
      <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground">No options configured.</p>
      </Section>
    </>
  );
}

interface NodeDetailPanelProps {
  node: CanvasNode;
  nodes: CanvasNode[];
  onClose: () => void;
  onUpdateValue: (id: string, value: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onRemoveNode: (id: string) => void;
  onFocusNode: (id: string) => void;
  onResizeMouseDown?: (e: React.MouseEvent) => void;
}

export function NodeDetailPanel({
  node,
  nodes,
  onClose,
  onUpdateValue,
  onUpdateLabel,
  onRemoveNode,
  onFocusNode,
  onResizeMouseDown,
}: NodeDetailPanelProps) {
  const [labelEditing, setLabelEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(node.label);
  const [labelHovered, setLabelHovered] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLabelDraft(node.label);
    setLabelEditing(false);
  }, [node.id, node.label]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const def = getNodeDef(node.kind);
  if (!def) return null;

  const Icon = def.icon;
  const identifier = getNodeIdentifier(node, nodes);

  function commitLabel() {
    const trimmed = labelDraft.trim();
    setLabelEditing(false);
    if (trimmed && trimmed !== node.label) onUpdateLabel(node.id, trimmed);
    else setLabelDraft(node.label);
  }

  return (
    <div className="relative w-full h-full">
      {/* Drag-to-resize handle — outside overflow-hidden so it's never clipped */}
      <div
        onMouseDown={onResizeMouseDown}
        className="group/resizer absolute left-0 top-0 bottom-0 w-4 -translate-x-full z-50 cursor-col-resize select-none"
      >
       <div
      className="
          absolute
          top-2
          bottom-2
          right-0
          w-px
          opacity-0
          group-hover/resizer:opacity-100
          transition-opacity
          duration-200
          bg-gradient-to-b
          from-transparent
          via-black
          to-transparent
        "
      />
        <div
          className="
            absolute
            top-1/2
            right-0
            translate-x-1/2
            -translate-y-1/2
            h-7
            w-7
            rounded-full
            bg-background
            border
            border-transparent
            shadow-md
            flex
            items-center
            justify-center
            text-muted-foreground
            group-hover/resizer:text-foreground
            group-hover/resizer:border-black
            group-hover/resizer:scale-105
            transition-all
            duration-150
          "
        >
          <ChevronsLeftRight className="h-4 w-4" />
        </div>
      </div>

      {/* Panel shell — overflow-hidden kept here for rounded corners + scroll */}
      <div className="w-full h-full bg-background rounded-xl border shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
          {/* Node icon */}
          <div className="h-7 w-7 rounded-md bg-muted/50 border flex items-center justify-center shrink-0">
            {def.kind === "ai-agent" ||
            def.kind === "prune-ai" ||
            def.kind === "openai-app" ? (
              renderIntegrationIcon(
                getModelProvider(
                  node.model ??
                    (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6"),
                ),
                14,
              )
            ) : def.integrationId ? (
              renderIntegrationIcon(def.integrationId, 14)
            ) : (
              <Icon className={cn("h-3.5 w-3.5", def.iconClass)} />
            )}
          </div>

          {/* Label + identifier badge */}
          <div className="flex-1 min-w-0">
            {labelEditing ? (
              <input
                autoFocus
                className="w-full text-sm font-semibold bg-prune-lightGray rounded px-1 outline-none focus:ring-1 focus:ring-ring"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') { setLabelDraft(node.label); setLabelEditing(false); }
                }}
              />
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    "text-sm font-semibold truncate rounded px-1 -mx-1 cursor-text transition-colors select-none",
                    labelHovered && "bg-prune-lightGray"
                  )}
                  onMouseEnter={() => setLabelHovered(true)}
                  onMouseLeave={() => setLabelHovered(false)}
                  onClick={() => { setLabelEditing(true); setLabelDraft(node.label); }}
                >
                  {node.label}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border text-muted-foreground shrink-0">
                  {identifier}
                </span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Ellipsis menu */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-background border rounded-xl shadow-lg font-normal overflow-hidden z-50 py-1 px-1">
                  {[
                    { icon: Copy,        label: 'Copy',   onClick: () => setMenuOpen(false) },
                    { icon: SkipForward, label: 'Skip',   onClick: () => setMenuOpen(false) },
                    { icon: Crosshair,   label: 'Focus',  onClick: () => { setMenuOpen(false); onFocusNode(node.id); } },
                  ].map(({ icon: MenuIcon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[14px] text-gray-800 rounded-md hover:bg-muted transition-colors"
                    >
                      <MenuIcon className="h-4 w-4 text-gray-800 shrink-0" />
                      {label}
                    </button>
                  ))}
                  <div className="mx-2 my-1 h-px bg-border" />
                  <button
                    onClick={() => { setMenuOpen(false); onRemoveNode(node.id); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-red-500 rounded-md font-normal hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Description — gray background */}
        <div className="border-b shrink-0">
          <p className="text-[14px] text-muted-foreground font-medium leading-relaxed bg-prune-lightGray px-3 py-3">
            {def.description}
          </p>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto py-[3px]">
          {/* Always-visible test input */}
          <Section
            title="Input text"
            icon={<PencilLineIcon className="h-3.5 w-3.5" />}
            defaultOpen
          >
            <textarea
              className={textareaClass}
              rows={5}
              placeholder="Type test input here…"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
          </Section>
          <PanelSections node={node} def={def} onUpdateValue={onUpdateValue} />
        </div>
      </div>
    </div>
  );
}
