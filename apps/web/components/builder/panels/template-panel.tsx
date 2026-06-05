"use client";

import { useState, useRef } from "react";
import { PencilLine, Plus, X, Code2, FileText, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Section } from "./panel-ui";
import { type CanvasNode } from "@/lib/editor-nodes";
import { TemplateEditor } from "./template-editor";
import {
  NodesTab,
  VariablesTab,
  TemplateValidation,
  buildLabelResolver,
} from "./output-panel";

// ─── Props ────────────────────────────────────────────────────────────────────

interface TemplatePanelProps {
  node: CanvasNode;
  nodes?: CanvasNode[];
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
  runOutput?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplatePanelSections({
  node,
  nodes = [],
  onUpdateNode,
  runOutput,
}: TemplatePanelProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"nodes" | "variables">("nodes");
  const [outputTab, setOutputTab] = useState<"formatted" | "text">("formatted");
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const templateContent = node.templateContent ?? "";
  const templateContentDoc = node.templateContentDoc ?? null;

  const update = (fields: Partial<CanvasNode>) => onUpdateNode?.(node.id, fields);
  const resolveLabel = buildLabelResolver(nodes, node.id);

  const handleEditorChange = (template: string, doc: Record<string, unknown>) => {
    update({ templateContent: template, templateContentDoc: doc });
  };

  const insertChip = (id: string, label: string) => {
    const container = editorContainerRef.current;
    if (!container) return;
    const editorEl = container.querySelector("[data-template-editor]") as
      | (HTMLElement & { __insertChip?: (id: string, label: string) => void })
      | null;
    editorEl?.__insertChip?.(id, label);
  };

  return (
    <>
      {/* ── Editor section ───────────────────────────────────────── */}
      <Section
        title="Edit Template"
        icon={<PencilLine className="h-3.5 w-3.5" />}
        defaultOpen
        extra={
          <button
            onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
            title="Insert node output or variable"
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-prune-borderGray text-[11px] font-[450] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Insert
          </button>
        }
      >
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3">
          Add nodes to the template from the options on the left. Remove the template to use default output.
        </p>
        <div ref={editorContainerRef} className="rounded-md border border-prune-borderGray overflow-hidden">
          <TemplateEditor
            value={templateContent}
            doc={templateContentDoc}
            resolveLabel={resolveLabel}
            onChange={handleEditorChange}
          />
        </div>
        {templateContent && (
          <div className="mt-2">
            <TemplateValidation template={templateContent} nodes={nodes} currentNodeId={node.id} />
          </div>
        )}
      </Section>

      {/* ── Picker modal ─────────────────────────────────────────── */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-[300px] max-h-[500px] bg-background border border-prune-borderGray rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* ── Preview (only when run output exists) ────────────────── */}
      {runOutput && (
        <Section title="Preview" icon={<FileText className="h-3.5 w-3.5" />} defaultOpen>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center p-0.5 bg-muted/30 border border-prune-borderGray rounded-md w-fit text-[11px]">
              {(["formatted", "text"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOutputTab(t)}
                  className={cn(
                    "px-2.5 py-0.5 capitalize rounded transition-colors",
                    outputTab === t
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:text-foreground",
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
            {outputTab === "formatted" ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{runOutput}</ReactMarkdown>
              </div>
            ) : (
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                {runOutput}
              </pre>
            )}
          </div>
        </Section>
      )}
    </>
  );
}
