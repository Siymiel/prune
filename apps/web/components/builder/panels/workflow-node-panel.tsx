"use client";

import { useState, useEffect } from "react";
import { Network, ChevronDown, Check, Loader2, Info } from "lucide-react";
import { Section, SubLabel } from "./panel-ui";
import { api, type WorkflowOut } from "@/lib/api";
import { type CanvasNode } from "@/lib/editor-nodes";
import { cn } from "@/lib/utils";

interface WorkflowRef {
  workflowId?: string;
  workflowName?: string;
}

function parseConfig(inputValue?: string): WorkflowRef {
  if (!inputValue) return {};
  try { return JSON.parse(inputValue) as WorkflowRef; } catch { return {}; }
}

interface WorkflowItem {
  id: string;
  name: string;
}

export function WorkflowNodePanelSections({
  node,
  onUpdateValue,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
}) {
  const config = parseConfig(node.inputValue);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    api.workflows.list()
      .then((wfs: WorkflowOut[]) => setWorkflows(wfs.map(w => ({ id: w.id, name: w.name }))))
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false));
  }, []);

  const select = (wf: WorkflowItem) => {
    onUpdateValue(node.id, JSON.stringify({ workflowId: wf.id, workflowName: wf.name }));
    setDropdownOpen(false);
  };

  const selected = workflows.find(w => w.id === config.workflowId);

  return (
    <div className="flex-1 overflow-y-auto py-[3px]">
      {/* Concept banner */}
      <div className="mx-3 mt-3 mb-1 px-3 py-3 rounded-lg bg-indigo-50 border border-indigo-100">
        <div className="flex items-start gap-2">
          <Network className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-indigo-800 mb-0.5">Workflow Node</p>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Call another saved PruneAI workflow inline. Its output becomes available to the next nodes in this flow — perfect for reusing specialist workflows.
            </p>
          </div>
        </div>
      </div>

      <Section title="Select Workflow" icon={<Network className="h-3.5 w-3.5" />}>
        <SubLabel>Workflow to call</SubLabel>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-[13px] bg-white hover:bg-muted/30 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
            ) : (
              <Network className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            )}
            <span className={cn("flex-1 text-left truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.name : loading ? "Loading workflows…" : "Select a workflow"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>

          {dropdownOpen && !loading && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border rounded-xl shadow-lg overflow-hidden py-1 max-h-48 overflow-y-auto">
              {workflows.length === 0 ? (
                <p className="text-[12px] text-muted-foreground px-3 py-2">No saved workflows found.</p>
              ) : (
                workflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => select(wf)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-muted/50 transition-colors text-left"
                  >
                    <Network className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="flex-1 truncate">{wf.name}</span>
                    {wf.id === config.workflowId && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {config.workflowId && (
          <div className="mt-2 px-2.5 py-1.5 rounded-md bg-muted/40 border text-[11px] font-mono text-muted-foreground truncate">
            ID: {config.workflowId}
          </div>
        )}
      </Section>

      <Section title="How It Works" icon={<Info className="h-3.5 w-3.5" />}>
        <ol className="space-y-2">
          {[
            "Select a saved workflow from the dropdown above",
            "Connect an upstream node's output to this node's input",
            "When the flow runs, this node calls the selected workflow via the API",
            "The workflow's response is passed to the next connected node",
            "Use this to compose specialist workflows into a unified pipeline",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12px] text-muted-foreground">
              <span className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
