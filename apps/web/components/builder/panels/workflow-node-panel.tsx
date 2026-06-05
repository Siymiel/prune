"use client";

import { useState, useEffect } from "react";
import {
  Network,
  ChevronDown,
  Check,
  Loader2,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";
import { Section, SubLabel } from "./panel-ui";
import { api, type WorkflowOut } from "@/lib/api";
import { type CanvasNode } from "@/lib/editor-nodes";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkflowRef {
  workflowId?: string;
  workflowName?: string;
}

function parseConfig(inputValue?: string): WorkflowRef {
  if (!inputValue) return {};
  try { return JSON.parse(inputValue) as WorkflowRef; } catch { return {}; }
}

type InputMapping = { key: string; value: string };
type OutputMapping = { key: string; outputKey: string };

export function WorkflowNodePanelSections({
  node,
  onUpdateValue,
  onUpdateNode,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
}) {
  const config = parseConfig(node.inputValue);

  // ── Workflow list ────────────────────────────────────────────────────────
  const [workflows, setWorkflows] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    api.workflows.list()
      .then((wfs: WorkflowOut[]) => setWorkflows(wfs.map(w => ({ id: w.id, name: w.name }))))
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false));
  }, []);

  const selectWorkflow = (wf: { id: string; name: string }) => {
    onUpdateValue(node.id, JSON.stringify({ workflowId: wf.id, workflowName: wf.name }));
    setDropdownOpen(false);
  };
  const selectedWorkflow = workflows.find(w => w.id === config.workflowId);

  // ── Input mappings ───────────────────────────────────────────────────────
  const inputMappings: InputMapping[] = node.workflowCallInputMappings ?? [];

  const addInputMapping = () => {
    onUpdateNode?.(node.id, {
      workflowCallInputMappings: [...inputMappings, { key: "", value: "" }],
    });
  };

  const updateInputMapping = (index: number, field: keyof InputMapping, val: string) => {
    const updated = inputMappings.map((m, i) => i === index ? { ...m, [field]: val } : m);
    onUpdateNode?.(node.id, { workflowCallInputMappings: updated });
  };

  const removeInputMapping = (index: number) => {
    onUpdateNode?.(node.id, {
      workflowCallInputMappings: inputMappings.filter((_, i) => i !== index),
    });
  };

  // ── Output mappings ──────────────────────────────────────────────────────
  const outputMappings: OutputMapping[] = node.workflowCallOutputMappings ?? [];

  const addOutputMapping = () => {
    onUpdateNode?.(node.id, {
      workflowCallOutputMappings: [...outputMappings, { key: "", outputKey: "" }],
    });
  };

  const updateOutputMapping = (index: number, field: keyof OutputMapping, val: string) => {
    const updated = outputMappings.map((m, i) => i === index ? { ...m, [field]: val } : m);
    onUpdateNode?.(node.id, { workflowCallOutputMappings: updated });
  };

  const removeOutputMapping = (index: number) => {
    onUpdateNode?.(node.id, {
      workflowCallOutputMappings: outputMappings.filter((_, i) => i !== index),
    });
  };

  // ── Execution settings ───────────────────────────────────────────────────
  const timeout = node.workflowCallTimeout ?? 30;
  const onError = node.workflowCallOnError ?? "fail";

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-y-auto py-[3px]">

        {/* ── Target Workflow ────────────────────────────────────────────── */}
        <Section title="Target Workflow" icon={<Network className="h-3.5 w-3.5" />}>
          <SubLabel>Workflow to invoke</SubLabel>
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
              <span className={cn("flex-1 text-left truncate", !selectedWorkflow && "text-muted-foreground")}>
                {selectedWorkflow ? selectedWorkflow.name : loading ? "Loading workflows…" : "Select a workflow"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {dropdownOpen && !loading && (
              <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border rounded-xl shadow-lg overflow-hidden py-1 max-h-52 overflow-y-auto">
                {workflows.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground px-3 py-2">No saved workflows found.</p>
                ) : (
                  workflows.map((wf) => (
                    <button
                      key={wf.id}
                      onClick={() => selectWorkflow(wf)}
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

        {/* ── Input Mappings ─────────────────────────────────────────────── */}
        <Section
          title="Input Mappings"
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          extra={
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={addInputMapping}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </TooltipTrigger>
              <TooltipContent>Add an input mapping</TooltipContent>
            </Tooltip>
          }
        >
          <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
            Map parent workflow variables to the child workflow&apos;s inputs.
            Use <code className="bg-muted px-1 rounded text-[10px]">{"{{state.key}}"}</code> or{" "}
            <code className="bg-muted px-1 rounded text-[10px]">{"{{input.key}}"}</code> as values.
          </p>

          {inputMappings.length === 0 ? (
            <div className="text-[12px] text-muted-foreground italic border border-dashed rounded-lg px-3 py-2.5 text-center">
              No input mappings — defaults to forwarding <span className="font-mono not-italic">message</span> and <span className="font-mono not-italic">history</span>
            </div>
          ) : (
            <div className="space-y-2">
              {inputMappings.map((mapping, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Input key"
                    value={mapping.key}
                    onChange={e => updateInputMapping(i, "key", e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-[12px] border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                  />
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder={"{{state.message}}"}
                    value={mapping.value}
                    onChange={e => updateInputMapping(i, "value", e.target.value)}
                    className="flex-[1.4] min-w-0 px-2 py-1.5 text-[12px] border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => removeInputMapping(i)}
                        className="shrink-0 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove mapping</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addInputMapping}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed rounded-lg text-[12px] text-muted-foreground hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add input mapping
          </button>
        </Section>

        {/* ── Output Mappings ────────────────────────────────────────────── */}
        <Section
          title="Output Mappings"
          icon={<ArrowRight className="h-3.5 w-3.5 rotate-180" />}
          extra={
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={addOutputMapping}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800 transition-colors font-medium"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </TooltipTrigger>
              <TooltipContent>Add an output mapping</TooltipContent>
            </Tooltip>
          }
        >
          <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
            Map child workflow outputs to names usable in this workflow.
            Left = child state key · Right = parent state key to write.
          </p>

          {outputMappings.length === 0 ? (
            <div className="text-[12px] text-muted-foreground italic border border-dashed rounded-lg px-3 py-2.5 text-center">
              No output mappings — defaults to{" "}
              <span className="font-mono not-italic">reply</span> and{" "}
              <span className="font-mono not-italic">sub_workflow_state</span>
            </div>
          ) : (
            <div className="space-y-2">
              {outputMappings.map((mapping, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Child key"
                    value={mapping.key}
                    onChange={e => updateOutputMapping(i, "key", e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-[12px] border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                  />
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Parent key"
                    value={mapping.outputKey}
                    onChange={e => updateOutputMapping(i, "outputKey", e.target.value)}
                    className="flex-[1.4] min-w-0 px-2 py-1.5 text-[12px] border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => removeOutputMapping(i)}
                        className="shrink-0 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove mapping</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addOutputMapping}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed rounded-lg text-[12px] text-muted-foreground hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add output mapping
          </button>
        </Section>

        {/* ── Execution Settings ─────────────────────────────────────────── */}
        <Section title="Execution Settings" icon={<Clock className="h-3.5 w-3.5" />}>
          {/* Timeout */}
          <SubLabel>Timeout (seconds)</SubLabel>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={300}
              value={timeout}
              onChange={e => {
                const val = Math.max(1, Math.min(300, Number(e.target.value) || 30));
                onUpdateNode?.(node.id, { workflowCallTimeout: val });
              }}
              className="w-24 px-2 py-1.5 text-[13px] border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[12px] text-muted-foreground">seconds (1–300)</span>
          </div>

          {/* On error */}
          <SubLabel className="mt-3">On child workflow error</SubLabel>
          <div className="flex gap-2">
            {(["fail", "continue"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdateNode?.(node.id, { workflowCallOnError: mode })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors",
                  onError === mode
                    ? mode === "fail"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60",
                )}
              >
                {mode === "fail" ? (
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                ) : (
                  <Check className="h-3 w-3 shrink-0" />
                )}
                {mode === "fail" ? "Fail parent" : "Continue"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
            {onError === "fail"
              ? "If the child workflow errors or times out, this workflow stops with an error."
              : "If the child workflow errors or times out, this workflow continues with an empty sub_workflow_state."}
          </p>
        </Section>

        {/* ── Reference ─────────────────────────────────────────────────── */}
        <Section title="Variable Reference" icon={<Info className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {[
              { expr: "{{state.message}}", desc: "Current message in state" },
              { expr: "{{state.reply}}", desc: "Previous AI reply in state" },
              { expr: "{{input.message}}", desc: "Original workflow trigger input" },
            ].map(({ expr, desc }) => (
              <div key={expr} className="flex items-start gap-2">
                <code className="shrink-0 text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                  {expr}
                </code>
                <span className="text-[11px] text-muted-foreground">{desc}</span>
              </div>
            ))}
            <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
              Outputs are available downstream as{" "}
              <code className="bg-muted px-1 rounded">state.reply</code> (or your mapped key),{" "}
              and <code className="bg-muted px-1 rounded">state.sub_run_id</code> for tracing.
            </div>
          </div>
        </Section>

      </div>
    </TooltipProvider>
  );
}
