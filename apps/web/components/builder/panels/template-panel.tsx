"use client";

import { PencilLineIcon, List, ListOrdered, Quote, Code, Image } from "lucide-react";
import { Section } from "./panel-ui";

export function TemplatePanelSections() {
  return (
    <Section title="Edit Template" icon={<PencilLineIcon className="h-3.5 w-3.5" />} defaultOpen>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        Add nodes to the template from the options on the left. Remove the template to use default output.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/10 flex-wrap">
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors text-xs font-bold">B</button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors text-xs italic font-serif">I</button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded bg-gray-800 text-white text-[11px] font-semibold leading-none">H<sub className="text-[8px]">1</sub></button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground text-[11px] font-semibold leading-none">H<sub className="text-[8px]">2</sub></button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground text-[11px] font-semibold leading-none">H<sub className="text-[8px]">3</sub></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><List className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><ListOrdered className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><Quote className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><Code className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><Image className="h-3.5 w-3.5" /></button>
        </div>
        <div className="p-3 min-h-[280px] text-sm leading-relaxed bg-background">
          <h1 className="text-base font-bold mb-2">Template Node</h1>
          <h2 className="text-sm font-semibold mb-1.5">How this works</h2>
          <p className="text-xs text-foreground/80 mb-3">This node allows you to create a template that can be used to format the output of other nodes.</p>
          <h2 className="text-sm font-semibold mb-1.5">How to use</h2>
          <ul className="list-disc list-inside text-xs text-foreground/80 space-y-1">
            <li>Format to heading, bullet points, and more using the options above.</li>
            <li>Use the values of other nodes by selecting them from the expressions side panel.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
