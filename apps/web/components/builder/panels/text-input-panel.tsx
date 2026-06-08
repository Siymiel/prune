"use client";

import { AlignLeft, Settings2 } from "lucide-react";
import { type CanvasNode } from "@/lib/editor-nodes";
import { Section, FieldLabel, SubLabel, Toggle } from "./panel-ui";
import { Textarea } from "@/components/ui/textarea";

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";
const textareaClass = `${inputClass} resize-none font-medium text-[16px]`;

export function TextInputPanelSections({
  node,
  onUpdateValue,
  onUpdateNode,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
}) {
  return (
    <>
      <Section title="Input Text" icon={<AlignLeft className="h-4 w-4" />} defaultOpen>
        <Textarea
          className="overflow-y-auto p-2 border"
          rows={4}
          placeholder=""
          value={node.inputValue ?? ""}
          onChange={(e) => onUpdateValue(node.id, e.target.value)}
          fontSize={16}
        />
      </Section>

      <Section title="Options" icon={<Settings2 className="h-4 w-4" />}>
        <div className="space-y-4">
          <div>
            <SubLabel hint="State key this input writes to — referenced by downstream nodes">Variable name</SubLabel>
            <input
              type="text"
              className={inputClass}
              placeholder="message"
              value={node.outputKey ?? ""}
              onChange={(e) =>
                onUpdateNode?.(node.id, { outputKey: e.target.value })
              }
            />
          </div>

          <div>
            <SubLabel hint="Hint text shown inside the empty field in your interface">Placeholder</SubLabel>
            <input
              type="text"
              className={inputClass}
              placeholder="Type your message…"
              value={node.placeholder ?? ""}
              onChange={(e) =>
                onUpdateNode?.(node.id, { placeholder: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <SubLabel className="mb-0.5" hint="Block workflow execution if this field is left empty">Required</SubLabel>
            </div>
            <Toggle
              checked={node.required ?? false}
              onChange={(v) => onUpdateNode?.(node.id, { required: v })}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
