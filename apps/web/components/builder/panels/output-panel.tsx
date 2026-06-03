"use client";

import { useState } from "react";
import { LayoutTemplate, FileText, Plus, Upload, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Section } from "./panel-ui";
import type { KnowledgeSource } from "@/lib/api";

const TABS = ["formatted", "text"] as const;
type Tab = (typeof TABS)[number];

function SourceCard({ source }: { source: KnowledgeSource }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(source.score * 100);
  const scoreClass =
    source.score >= 0.8 ? "text-emerald-500" :
    source.score >= 0.6 ? "text-amber-500" :
    "text-muted-foreground";

  return (
    <div className="border border-prune-borderGray rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/30 transition-colors text-left"
      >
        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="flex-1 text-[12px] font-[450] truncate">{source.filename}</span>
        <span className={cn("text-[10px] font-medium tabular-nums shrink-0", scoreClass)}>
          {pct}%
        </span>
        {expanded
          ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 pt-1.5 bg-prune-lightGray border-t border-prune-borderGray">
          <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap line-clamp-8">
            {source.text}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
            Chunk {source.chunk_index + 1} · {pct}% relevance
          </p>
        </div>
      )}
    </div>
  );
}

export function OutputPanelSections({
  runOutput,
  sources,
}: {
  runOutput?: string;
  sources?: KnowledgeSource[];
}) {
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

      {sources && sources.length > 0 && (
        <Section title={`Sources (${sources.length})`} icon={<BookOpen className="h-3.5 w-3.5" />} defaultOpen>
          <div className="space-y-1.5">
            {sources.map((src, i) => (
              <SourceCard key={`${src.filename}-${src.chunk_index}-${i}`} source={src} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
