"use client";

import { Database, Settings2 } from "lucide-react";
import { Section, FieldLabel } from "./panel-ui";

export function KnowledgeBasePanelSections() {
  return (
    <>
      <Section title="Source" icon={<Database className="h-3.5 w-3.5" />} defaultOpen>
        <FieldLabel>Knowledge base</FieldLabel>
        <div className="w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-muted-foreground/50">
          Select a knowledge base…
        </div>
      </Section>
      <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground">No options configured.</p>
      </Section>
    </>
  );
}
