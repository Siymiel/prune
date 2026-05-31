"use client";

import { Link2, Settings2 } from "lucide-react";
import { type CanvasNode } from "@/lib/editor-nodes";
import { Section, FieldLabel } from "./panel-ui";

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";

export function UrlPanelSections({
  node,
  onUpdateValue,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
}) {
  return (
    <>
      <Section title="Test URL" icon={<Link2 className="h-3.5 w-3.5" />} defaultOpen>
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
        <p className="text-xs text-muted-foreground">No options configured.</p>
      </Section>
      <Section title="Chunking Settings" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground">Using default chunking settings.</p>
      </Section>
    </>
  );
}
