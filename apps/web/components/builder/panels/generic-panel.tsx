"use client";

import { Settings2 } from "lucide-react";
import { type CanvasNode, type NodeDef } from "@/lib/editor-nodes";
import { Section, FieldLabel } from "./panel-ui";
import { Textarea } from "@/components/ui/textarea";

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";
const textareaClass = `${inputClass} resize-none font-medium text-[16px]`;

export function GenericPanelSections({
  node,
  def,
  onUpdateValue,
}: {
  node: CanvasNode;
  def: NodeDef;
  onUpdateValue: (id: string, value: string) => void;
}) {
  return (
    <>
      <Section title="Configuration" icon={<Settings2 className="h-3.5 w-3.5" />} defaultOpen>
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
            {/* <textarea
              className={textareaClass}
              rows={3}
              placeholder={def.description}
              value={node.inputValue ?? ""}
              onChange={(e) => onUpdateValue(node.id, e.target.value)}
            /> */}
            <Textarea
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
