"use client";

import { LayoutTemplate, FileText, Plus, Upload } from "lucide-react";
import { Section } from "./panel-ui";

export function OutputPanelSections() {
  return (
    <>
      <Section title="Templated Output" icon={<LayoutTemplate className="h-3.5 w-3.5" />} defaultOpen>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Add a template to format the output. By default, the output combines the results of all connected nodes.
        </p>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Add Template
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            Upload Template
          </button>
        </div>
      </Section>
      <Section title="Output Content" icon={<FileText className="h-3.5 w-3.5" />} defaultOpen>
        <p className="text-xs text-muted-foreground leading-relaxed">
          No output available. Run the workflow to see the output here.
        </p>
      </Section>
    </>
  );
}
