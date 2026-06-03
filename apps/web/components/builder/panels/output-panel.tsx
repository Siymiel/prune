"use client";

import { useState } from "react";
import { LayoutTemplate, FileText, Plus, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Section } from "./panel-ui";

const TABS = ["formatted", "text"] as const;
type Tab = (typeof TABS)[number];

export function OutputPanelSections({ runOutput }: { runOutput?: string }) {
  const [tab, setTab] = useState<Tab>("formatted");

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
        {runOutput ? (
          <>
            <div className="flex items-center border rounded-md overflow-hidden text-[11px] mb-2 w-fit">
              {(["formatted", "text"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-2.5 py-1 capitalize transition-colors",
                    tab === t
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div
              className="max-h-[300px] overflow-y-auto"
              onWheel={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
            >
              {tab === "formatted" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{runOutput}</ReactMarkdown>
                </div>
              ) : (
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                  {runOutput}
                </pre>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            No output available. Run the workflow to see the output here.
          </p>
        )}
      </Section>
    </>
  );
}
