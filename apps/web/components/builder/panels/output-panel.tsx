"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutTemplate, FileText, BookOpen,
  ChevronDown, ChevronRight, Plus, Upload,
  Trash2, AlertCircle, Pencil, Check, X, Copy,
  User, Code2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Section, FieldLabel } from "./panel-ui";
import { getNodeDef, getNodeIdentifier, type CanvasNode } from "@/lib/editor-nodes";
import type { KnowledgeSource } from "@/lib/api";
import { TemplateEditor, serializeEditorToTemplate } from "./template-editor";
import { useWorkspaceVariablesStore } from "@/lib/workspace-variables-store";
import { useAuthStore } from "@/lib/auth-store";

// ─── Output field definitions per node kind ──────────────────────────────────

export const KIND_OUTPUT_FIELDS: Partial<Record<string, Array<{ key: string; label: string }>>> = {
  "ai-agent":       [{ key: "reply",            label: "completion"       }],
  "prune-ai":       [{ key: "reply",            label: "completion"       }],
  "openai-app":     [{ key: "reply",            label: "completion"       }],
  "text-input":     [{ key: "message",          label: "text"             }],
  "knowledge-base": [{ key: "context",          label: "context"          }],
  "code":           [{ key: "output",           label: "output"           }],
  "if-else":        [{ key: "condition_result", label: "condition_result" }],
  "url":            [{ key: "content",          label: "content"          }],
  "files":          [{ key: "content",          label: "content"          }],
  "audio-input":    [{ key: "transcript",       label: "transcript"       }],
};

// ─── System / user variables ──────────────────────────────────────────────────

export const SYS_VARS: Array<{ id: string; label: string; hint: string }> = [
  { id: "sys.run_id",         label: "$ Run ID",          hint: "Unique ID of this workflow run"        },
  { id: "sys.conversation_id",label: "$ Conversation ID", hint: "Current conversation thread ID"        },
  { id: "sys.tenant_id",      label: "$ Organization ID", hint: "Your workspace / tenant identifier"    },
  { id: "sys.now",            label: "$ Now",             hint: "Current UTC timestamp (ISO 8601)"      },
];

export const USER_VARS: Array<{ id: string; label: string; hint: string }> = [
  { id: "user.id",    label: "$ User ID",    hint: "Supabase user UUID"   },
  { id: "user.email", label: "$ User Email", hint: "Signed-in user email" },
  { id: "user.name",  label: "$ User Name",  hint: "Signed-in user name"  },
];

// ─── Chip label resolver (used by the editor to display known expressions) ───

export function buildLabelResolver(nodes: CanvasNode[], currentNodeId: string) {
  return (id: string): string => {
    if (SYS_VARS.some((v) => v.id === id)) return SYS_VARS.find((v) => v.id === id)!.label;
    if (USER_VARS.some((v) => v.id === id)) return USER_VARS.find((v) => v.id === id)!.label;
    if (id.startsWith("vars.")) return `$ ${id.slice(5)}`;

    const [nodeId, ...rest] = id.split(".");
    const n = nodes.find((x) => x.id === nodeId && x.id !== currentNodeId);
    if (!n) return `{{${id}}}`;
    const fieldKey = rest.join(".");
    const fieldDef = (KIND_OUTPUT_FIELDS[n.kind] ?? []).find((f) => f.key === fieldKey);
    return `@ ${n.label} .${fieldDef?.label ?? fieldKey}`;
  };
}

// ─── Nodes tab ────────────────────────────────────────────────────────────────

export function NodesTab({
  nodes,
  currentNodeId,
  onInsert,
}: {
  nodes: CanvasNode[];
  currentNodeId: string;
  onInsert: (id: string, label: string) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const sourceNodes = nodes.filter(
    (n) => n.id !== currentNodeId && n.kind !== "output" && n.kind !== "sticky-note",
  );

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (sourceNodes.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground px-2 py-3">
        No nodes to reference
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {sourceNodes.map((n) => {
        const def = getNodeDef(n.kind);
        const fields = KIND_OUTPUT_FIELDS[n.kind] ?? [];
        const isExpanded = expandedIds.has(n.id);
        const NodeIcon = def?.icon;
        const identifier = getNodeIdentifier(n, nodes);

        return (
          <div key={n.id} className="rounded-md border border-prune-borderGray overflow-hidden">
            <button
              onClick={() => toggle(n.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-muted/20 transition-colors"
            >
              {NodeIcon && <NodeIcon className={cn("h-3 w-3 shrink-0", def?.iconClass)} />}
              <span className="flex-1 text-[11px] font-[450] truncate">{n.label}</span>
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted/50 border text-muted-foreground shrink-0">
                {identifier}
              </span>
              {isExpanded
                ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </button>
            {isExpanded && (
              <div className="bg-prune-lightGray border-t border-prune-borderGray px-2 py-1.5 space-y-1">
                {fields.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/60 italic">No output fields defined.</p>
                ) : (
                  fields.map((f) => {
                    const chipId = `${n.id}.${f.key}`;
                    const chipLabel = `@ ${n.label} .${f.label}`;
                    return (
                      <button
                        key={f.key}
                        onClick={() => onInsert(chipId, chipLabel)}
                        title={`Insert {{${chipId}}}`}
                        className="flex items-center gap-1 w-full text-left px-1 py-0.5 rounded hover:bg-muted/50 transition-colors group"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-violet-50 border border-violet-200 text-[10px] font-mono text-violet-700 group-hover:bg-violet-100 transition-colors">
                          {chipLabel}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Variables tab ────────────────────────────────────────────────────────────

function VarChip({
  label,
  hint,
  onClick,
  varType = "sys",
}: {
  label: string;
  hint: string;
  onClick: () => void;
  varType?: "sys" | "user";
}) {
  const displayLabel = label.replace(/^\$ /, "");
  return (
    <button
      onClick={onClick}
      title={hint}
      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-muted/30 transition-colors"
    >
      {varType === "user" ? (
        <User className="h-3.5 w-3.5 text-blue-400 shrink-0" />
      ) : (
        <span className="text-[12px] font-semibold text-amber-500 shrink-0 leading-none">$</span>
      )}
      <span className="text-[13px] text-foreground">{displayLabel}</span>
    </button>
  );
}

function WorkspaceVarRow({
  id,
  varKey,
  value,
  onInsert,
  onUpdate,
  onRemove,
}: {
  id: string;
  varKey: string;
  value: string;
  onInsert: (id: string, label: string) => void;
  onUpdate: (id: string, fields: { key?: string; value?: string }) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftKey, setDraftKey] = useState(varKey);
  const [draftVal, setDraftVal] = useState(value);

  const commit = () => {
    if (draftKey.trim()) onUpdate(id, { key: draftKey.trim(), value: draftVal });
    setEditing(false);
  };

  const cancel = () => {
    setDraftKey(varKey);
    setDraftVal(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-md border border-prune-borderGray bg-prune-lightGray p-2 space-y-1.5">
        <input
          autoFocus
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          placeholder="Variable key"
          className="w-full px-2 py-1 text-[11px] font-mono border border-prune-borderGray rounded bg-background focus:outline-none"
        />
        <input
          value={draftVal}
          onChange={(e) => setDraftVal(e.target.value)}
          placeholder="Value"
          className="w-full px-2 py-1 text-[11px] border border-prune-borderGray rounded bg-background focus:outline-none"
        />
        <div className="flex gap-1.5">
          <button
            onClick={commit}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md bg-foreground text-background text-[11px] hover:opacity-90 transition-opacity"
          >
            <Check className="h-3 w-3" /> Save
          </button>
          <button
            onClick={cancel}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md border border-prune-borderGray text-[11px] text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <button
        onClick={() => onInsert(`vars.${varKey}`, `$ ${varKey}`)}
        title={`Insert {{vars.${varKey}}}`}
        className="flex-1 flex items-center px-1 py-0.5 rounded hover:bg-muted/50 transition-colors text-left"
      >
        <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-mono text-amber-700 group-hover:bg-amber-100 transition-colors">
          $ {varKey}
        </span>
        {value && (
          <span className="ml-2 text-[10px] text-muted-foreground/60 truncate max-w-[80px]">
            = {value}
          </span>
        )}
      </button>
      <button
        onClick={() => setEditing(true)}
        className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        onClick={() => onRemove(id)}
        className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export function VariablesTab({ onInsert }: { onInsert: (id: string, label: string) => void }) {
  const { variables, addVariable, updateVariable, removeVariable } = useWorkspaceVariablesStore();
  const [addingNew, setAddingNew] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const commitNew = () => {
    if (newKey.trim()) {
      addVariable(newKey.trim(), newVal);
      setNewKey("");
      setNewVal("");
      setAddingNew(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* System variables */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-1">
          System Variables
        </p>
        <div className="space-y-0">
          {SYS_VARS.map((v) => (
            <VarChip key={v.id} label={v.label} hint={v.hint} varType="sys" onClick={() => onInsert(v.id, v.label)} />
          ))}
        </div>
      </div>

      {/* User variables */}
      <div>
        <div className="space-y-0">
          {USER_VARS.map((v) => (
            <VarChip key={v.id} label={v.label} hint={v.hint} varType="user" onClick={() => onInsert(v.id, v.label)} />
          ))}
        </div>
      </div>

      {/* Workspace variables */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Workspace
          </p>
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-1">
          {variables.map((v) => (
            <WorkspaceVarRow
              key={v.id}
              id={v.id}
              varKey={v.key}
              value={v.value}
              onInsert={onInsert}
              onUpdate={updateVariable}
              onRemove={removeVariable}
            />
          ))}
          {variables.length === 0 && !addingNew && (
            <p className="text-[10px] text-muted-foreground/60 italic px-1">
              No workspace variables yet.
            </p>
          )}
          {addingNew && (
            <div className="rounded-md border border-prune-borderGray bg-prune-lightGray p-2 space-y-1.5">
              <input
                autoFocus
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitNew(); if (e.key === "Escape") { setAddingNew(false); setNewKey(""); setNewVal(""); } }}
                placeholder="Variable key (e.g. company_name)"
                className="w-full px-2 py-1 text-[11px] font-mono border border-prune-borderGray rounded bg-background focus:outline-none"
              />
              <input
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitNew(); if (e.key === "Escape") { setAddingNew(false); setNewKey(""); setNewVal(""); } }}
                placeholder="Default value"
                className="w-full px-2 py-1 text-[11px] border border-prune-borderGray rounded bg-background focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={commitNew}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md bg-foreground text-background text-[11px] hover:opacity-90 transition-opacity"
                >
                  <Check className="h-3 w-3" /> Add
                </button>
                <button
                  onClick={() => { setAddingNew(false); setNewKey(""); setNewVal(""); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md border border-prune-borderGray text-[11px] text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Template validation ──────────────────────────────────────────────────────

const ALL_VAR_IDS = new Set([
  ...SYS_VARS.map((v) => v.id),
  ...USER_VARS.map((v) => v.id),
]);

export function TemplateValidation({
  template,
  nodes,
  currentNodeId,
}: {
  template: string;
  nodes: CanvasNode[];
  currentNodeId: string;
}) {
  const { variables } = useWorkspaceVariablesStore();
  const workspaceKeys = new Set(variables.map((v) => `vars.${v.key}`));

  const knownExprs = new Set<string>([...ALL_VAR_IDS, ...workspaceKeys]);
  nodes
    .filter((n) => n.id !== currentNodeId)
    .forEach((n) => {
      (KIND_OUTPUT_FIELDS[n.kind] ?? []).forEach((f) => {
        knownExprs.add(`${n.id}.${f.key}`);
        knownExprs.add(`state.${f.key}`);
      });
    });
  knownExprs.add("state.reply");
  knownExprs.add("state.message");
  knownExprs.add("state.context");
  knownExprs.add("state.result");

  const refs = [...template.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
  const unknownRefs = refs.filter((r) => !knownExprs.has(r));

  if (unknownRefs.length === 0) return null;

  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/70 overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-amber-200">
        <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
        <span className="text-[11px] font-medium text-amber-800">Expression warning</span>
      </div>
      <p className="px-2.5 py-1.5 text-[11px] text-amber-700 leading-relaxed">
        Unknown variable{unknownRefs.length > 1 ? "s" : ""}:{" "}
        {unknownRefs.map((r) => `{{${r}}}`).join(", ")}
      </p>
    </div>
  );
}

// ─── Source card ──────────────────────────────────────────────────────────────

function SourceCard({ source }: { source: KnowledgeSource }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(source.score * 100);
  const scoreClass =
    source.score >= 0.8 ? "text-emerald-500" :
    source.score >= 0.6 ? "text-amber-500" :
    "text-muted-foreground";

  return (
    <div className="border border-prune-borderGray rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/30 transition-colors text-left"
      >
        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="flex-1 text-[12px] font-[450] truncate">{source.filename}</span>
        <span className={cn("text-[10px] font-medium tabular-nums shrink-0", scoreClass)}>{pct}%</span>
        {expanded
          ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 pt-1.5 bg-prune-lightGray border-t border-prune-borderGray">
          <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap line-clamp-8">
            {source.text}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
            Chunk {source.chunk_index + 1} · {pct}% relevance
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OutputPanelSections({
  node,
  nodes = [],
  onUpdateNode,
  runOutput,
  sources,
}: {
  node: CanvasNode;
  nodes?: CanvasNode[];
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
  runOutput?: string;
  sources?: KnowledgeSource[];
}) {
  const [tab, setTab] = useState<"formatted" | "text">("formatted");
  const [isEditing, setIsEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"nodes" | "variables">("nodes");
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const outputTemplate = node.outputTemplate ?? "";
  const outputTemplateDoc = node.outputTemplateDoc ?? null;
  const hasTemplate = Boolean(outputTemplate) || isEditing;

  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        update({ outputTemplate: text, outputTemplateDoc: undefined });
        setIsEditing(true);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const update = (fields: Partial<CanvasNode>) => onUpdateNode?.(node.id, fields);

  const resolveLabel = buildLabelResolver(nodes, node.id);

  const handleEditorChange = (template: string, doc: Record<string, unknown>) => {
    update({ outputTemplate: template, outputTemplateDoc: doc });
  };

  // Insert a chip into the active Tiptap editor
  const insertChip = (id: string, label: string) => {
    setIsEditing(true);
    const container = editorContainerRef.current;
    if (!container) return;
    const editorEl = container.querySelector("[data-template-editor]") as
      | (HTMLElement & { __insertChip?: (id: string, label: string) => void })
      | null;
    editorEl?.__insertChip?.(id, label);
  };

  const removeTemplate = () => {
    update({ outputTemplate: "", outputTemplateDoc: undefined });
    setIsEditing(false);
  };

  // Suppress unused import warning — user context will be used when injecting at run time
  void user;

  return (
    <>
      {/* ── Template section ──────────────────────────────────── */}
      {!hasTemplate ? (
        <Section
          title="Templated Output"
          icon={<LayoutTemplate className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-2.5">
            Add a template to format the output. By default the output combines results from all connected nodes.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-prune-borderGray rounded-md text-xs font-[450] text-foreground hover:bg-muted/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-prune-borderGray rounded-md text-xs font-[450] text-foreground hover:bg-muted/30 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Template
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown"
              className="hidden"
              onChange={handleUploadTemplate}
            />
          </div>
        </Section>
      ) : (
        /* ── Full-width editor with modal picker ── */
        <div className="border-b border-prune-borderGray last:border-b-0">
          {/* Section header */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-prune-borderGray">
            <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[13px] font-[450] text-foreground flex-1">Templated Output</span>
            <button
              onClick={() => setPickerOpen(true)}
              title="Insert node output or variable"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-prune-borderGray text-[11px] font-[450] text-foreground hover:bg-muted/30 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Insert
            </button>
          </div>

          {/* Full-width editor */}
          <div ref={editorContainerRef} className="border-b border-prune-borderGray">
            <TemplateEditor
              value={outputTemplate}
              doc={outputTemplateDoc}
              resolveLabel={resolveLabel}
              onChange={handleEditorChange}
            />
          </div>

          {outputTemplate && (
            <div className="px-3 py-2">
              <TemplateValidation template={outputTemplate} nodes={nodes} currentNodeId={node.id} />
            </div>
          )}

          {/* Remove Template */}
          <div className="px-3 py-2.5">
            <button
              onClick={removeTemplate}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-red-200 text-xs font-[450] text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Template
            </button>
          </div>
        </div>
      )}

      {/* ── Picker modal ──────────────────────────────────────── */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-[300px] max-h-[500px] bg-background border border-prune-borderGray rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-prune-borderGray shrink-0">
              <span className="text-[13px] font-[450]">Insert Reference</span>
              <button
                onClick={() => setPickerOpen(false)}
                title="Close"
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-prune-borderGray shrink-0">
              {(["Nodes", "Variables"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPickerTab(t.toLowerCase() as "nodes" | "variables")}
                  className={cn(
                    "flex-1 py-2 text-[12px] font-[450] border-b-2 transition-colors -mb-px",
                    pickerTab === t.toLowerCase()
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2">
              {pickerTab === "nodes" ? (
                <NodesTab
                  nodes={nodes}
                  currentNodeId={node.id}
                  onInsert={(id, label) => { insertChip(id, label); setPickerOpen(false); }}
                />
              ) : (
                <VariablesTab
                  onInsert={(id, label) => { insertChip(id, label); setPickerOpen(false); }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-prune-borderGray p-2.5 shrink-0">
              <button
                title="Add a custom expression"
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Code2 className="h-3.5 w-3.5 shrink-0" />
                Add Advanced Expression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Output Content ─────────────────────────────────────── */}
      <Section title="Output Content" icon={<FileText className="h-3.5 w-3.5" />} defaultOpen>
        {runOutput ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center p-0.5 bg-muted/30 border border-prune-borderGray rounded-md w-fit text-[11px]">
                {(["formatted", "text"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "px-2.5 py-0.5 capitalize rounded transition-colors",
                      tab === t ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(runOutput)}
                title="Copy to clipboard"
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              className="max-h-[300px] overflow-y-auto"
              onWheel={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
            >
              {tab === "formatted" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{runOutput}</ReactMarkdown>
                </div>
              ) : (
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                  {runOutput}
                </pre>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            No output yet. Run the workflow to see results here.
          </p>
        )}
      </Section>

      {/* ── Sources ────────────────────────────────────────────── */}
      {sources && sources.length > 0 && (
        <Section title={`Sources (${sources.length})`} icon={<BookOpen className="h-3.5 w-3.5" />} defaultOpen>
          <div className="space-y-1.5">
            {sources.map((src, i) => (
              <SourceCard key={`${src.filename}-${src.chunk_index}-${i}`} source={src} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
