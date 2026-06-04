"use client";

import { useState, useRef } from "react";
import { FileText, FilePlus2, Rocket, Settings2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, FieldLabel, Slider } from "./panel-ui";

const EMBEDDING_MODELS = [
  { id: "text-embedding-3-large", label: "text-embedding-3-large", provider: "OpenAI" },
  { id: "text-embedding-3-small", label: "text-embedding-3-small", provider: "OpenAI" },
  { id: "text-embedding-ada-002", label: "text-embedding-ada-002", provider: "OpenAI" },
  { id: "all-mpnet-base-v2", label: "all-mpnet-base-v2", provider: "Open Source" },
  { id: "bert-base-cased", label: "bert-base-cased", provider: "Google" },
];

export function FilesPanelSections() {
  const [chunkingMethod, setChunkingMethod] = useState<"naive" | "sentence">("sentence");
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(20);
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [embeddingDropdownOpen, setEmbeddingDropdownOpen] = useState(false);
  const embeddingDropdownRef = useRef<HTMLDivElement>(null);

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
        <div className="space-y-5">
          {/* Chunking Method */}
          <div>
            <FieldLabel>Chunking Method</FieldLabel>
            <div className="flex gap-1 p-0.5 bg-muted/40 rounded-lg border">
              {(["naive", "sentence"] as Array<"naive" | "sentence">).map((m) => (
                <button
                  key={m}
                  onClick={() => setChunkingMethod(m)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors",
                    chunkingMethod === m
                      ? "bg-white text-foreground shadow-sm border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "naive" ? "Naïve (Fixed)" : "Sentence-based"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              {chunkingMethod === "naive"
                ? "Splits by character or token count. Fast but may fragment sentences."
                : "Splits at natural sentence boundaries. Better context, slightly more compute."}
            </p>
          </div>

          {/* Chunk Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Chunk Size (tokens)</FieldLabel>
              <span className="text-xs font-medium tabular-nums">{chunkSize}</span>
            </div>
            <Slider value={chunkSize} min={200} max={1000} step={50} onChange={setChunkSize} />
            <p className="text-[10px] text-muted-foreground mt-1">Recommended: 200–1,000 tokens</p>
          </div>

          {/* Chunk Overlap */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Chunk Overlap (%)</FieldLabel>
              <span className="text-xs font-medium tabular-nums">{chunkOverlap}%</span>
            </div>
            <Slider value={chunkOverlap} min={0} max={50} step={5} onChange={setChunkOverlap} />
            <p className="text-[10px] text-muted-foreground mt-1">Recommended: 15–30% to preserve context between chunks</p>
          </div>
        </div>
      </Section>

      <Section title="Advanced Settings" icon={<Rocket className="h-3.5 w-3.5" />}>
        <div className="space-y-4">
          {/* Embedding Model */}
          <div>
            <FieldLabel>Embedding Model</FieldLabel>
            <div className="relative" ref={embeddingDropdownRef}>
              <button
                onClick={() => setEmbeddingDropdownOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-muted/30 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <span className="flex-1 text-left font-mono truncate">{embeddingModel}</span>
                <span className="text-muted-foreground/60 shrink-0 text-[10px]">
                  {EMBEDDING_MODELS.find((m) => m.id === embeddingModel)?.provider}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
              {embeddingDropdownOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border rounded-xl shadow-lg py-1 px-1 max-h-48 overflow-y-auto">
                  {EMBEDDING_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setEmbeddingModel(m.id); setEmbeddingDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted/40 transition-colors text-left"
                    >
                      <span className="flex-1 font-mono truncate">{m.label}</span>
                      <span className="text-muted-foreground/50 shrink-0 text-[10px]">{m.provider}</span>
                      {m.id === embeddingModel && <Check className="h-3 w-3 text-emerald-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Model used to vectorize this file for semantic search.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
