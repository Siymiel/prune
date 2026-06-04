"use client";

import { Boxes, Cpu, Info } from "lucide-react";
import { Section, SubLabel } from "./panel-ui";
import { Input } from "@/components/ui/input";
import { type CanvasNode } from "@/lib/editor-nodes";

interface SubflowToolConfig {
  toolName?: string;
  toolDescription?: string;
}

function parseConfig(inputValue?: string): SubflowToolConfig {
  if (!inputValue) return {};
  try { return JSON.parse(inputValue) as SubflowToolConfig; } catch { return {}; }
}

export function SubflowToolPanelSections({
  node,
  identifier,
  onUpdateValue,
}: {
  node: CanvasNode;
  identifier: string;
  onUpdateValue: (id: string, value: string) => void;
}) {
  const config = parseConfig(node.inputValue);

  const update = (patch: SubflowToolConfig) => {
    onUpdateValue(node.id, JSON.stringify({ ...config, ...patch }));
  };

  return (
    <div className="flex-1 overflow-y-auto py-[3px]">
      {/* Concept explanation */}
      <div className="mx-3 mt-3 mb-1 px-3 py-3 rounded-lg bg-violet-50 border border-violet-100">
        <div className="flex items-start gap-2">
          <Boxes className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-violet-800 mb-0.5">Subflow Tool</p>
            <p className="text-[11px] text-violet-700 leading-relaxed">
              Connect this node to an AI Agent. The agent can invoke this sub-workflow as a tool — it decides when to call it based on your description.
            </p>
          </div>
        </div>
      </div>

      <Section title="Tool Identity" icon={<Boxes className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
          <div>
            <SubLabel>Tool Name</SubLabel>
            <Input
              value={config.toolName ?? ""}
              onChange={(e) => update({ toolName: e.target.value })}
              placeholder="e.g. Search Web, Run Calculator, Lookup CRM"
              className="text-[13px]"
            />
          </div>
          <div>
            <SubLabel>Description <span className="font-normal text-muted-foreground">(tells the agent when to use it)</span></SubLabel>
            <textarea
              rows={3}
              value={config.toolDescription ?? ""}
              onChange={(e) => update({ toolDescription: e.target.value })}
              placeholder="e.g. Use this to search the internet for current information, news, or facts not in the knowledge base."
              className="w-full text-[13px] px-3 py-2 rounded-md border bg-muted/30 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </Section>

      <Section title="Input Variable" icon={<Cpu className="h-3.5 w-3.5" />}>
        <p className="text-[12px] text-muted-foreground mb-2 leading-relaxed">
          When the agent calls this tool, it passes its input via this variable. Use it as the starting point inside this sub-workflow.
        </p>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-900 rounded-lg text-[12px] font-mono text-emerald-400 select-all">
          <Cpu className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          {identifier}.subflow_tool_input
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Connect this to a Text Input node or directly into an AI Agent node inside the sub-workflow.
        </p>
      </Section>

      <Section title="How It Works" icon={<Info className="h-3.5 w-3.5" />}>
        <ol className="space-y-2">
          {[
            "Connect this node to an AI Agent on the canvas",
            "The agent sees this tool's name and description in its context",
            "When relevant, the agent decides to call this tool and passes input",
            "The sub-workflow runs and its output returns to the agent",
            "The agent incorporates the result into its final response",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12px] text-muted-foreground">
              <span className="h-4 w-4 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
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
