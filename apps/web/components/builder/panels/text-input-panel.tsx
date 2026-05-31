"use client";

import { AlignLeft, Settings2 } from "lucide-react";
import { type CanvasNode } from "@/lib/editor-nodes";
import { Section, FieldLabel } from "./panel-ui";

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";
const textareaClass = `${inputClass} resize-none font-medium text-[16px]`;

export function TextInputPanelSections({
  node,
  onUpdateValue,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
}) {
  return (
    <>
      <Section title="Value" icon={<AlignLeft className="h-3.5 w-3.5" />} defaultOpen>
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
        <p className="text-xs text-muted-foreground">No options configured.</p>
      </Section>
    </>
  );
}
