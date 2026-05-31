"use client";

import { FileText, FilePlus2, Rocket, Settings2 } from "lucide-react";
import { Section } from "./panel-ui";

export function FilesPanelSections() {
  return (
    <>
      <Section title="Test Files" icon={<FileText className="h-3.5 w-3.5" />} defaultOpen>
        <div className="border-2 border-dashed border-prune-borderGray rounded-xl flex flex-col items-center justify-center gap-1.5 py-8 px-4 text-center bg-prune-lightGray/40">
          <div className="h-10 w-10 rounded-xl bg-white border border-prune-borderGray flex items-center justify-center mb-1 shadow-sm">
            <FilePlus2 className="h-5 w-5 text-prune-commonGray" />
          </div>
          <p className="text-sm font-semibold text-foreground">Upload files</p>
          <p className="text-xs text-muted-foreground">Upload or drop a file here</p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          How to manage documents via API?{" "}
          <a href="#" className="font-semibold text-foreground underline underline-offset-2">
            Learn more
          </a>
        </p>
      </Section>
      <Section title="Settings" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground">No settings configured.</p>
      </Section>
      <Section title="Advanced Settings" icon={<Rocket className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground">No advanced settings configured.</p>
      </Section>
    </>
  );
}
