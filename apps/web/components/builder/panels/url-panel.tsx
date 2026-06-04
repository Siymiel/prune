"use client";

import { Link2, Settings2, AlignLeft, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CanvasNode } from "@/lib/editor-nodes";
import { Section, FieldLabel } from "./panel-ui";

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-1.5 cursor-pointer select-none"
      onClick={() => onChange(!checked)}
    >
      <span className="text-xs text-foreground">{label}</span>
      <div
        className={cn(
          "relative h-4 w-7 rounded-full transition-colors shrink-0",
          checked ? "bg-gray-900" : "bg-gray-300",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </div>
    </div>
  );
}

const CHUNKING_METHODS: { id: "sentence" | "naive"; label: string }[] = [
  { id: "sentence", label: "Sentence" },
  { id: "naive", label: "Naive" },
];

export function UrlPanelSections({
  node,
  onUpdateValue,
  onUpdateNode,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
}) {
  const mode = node.urlExtractionMode ?? "html";
  const enableSubpageCrawl = node.urlEnableSubpageCrawl ?? false;
  const enableAsInput = node.urlEnableAsInput ?? false;
  const chunkSize = node.urlChunkSize ?? 500;
  const chunkOverlapPct = node.urlChunkOverlapPct ?? 20;
  const chunkingMethod = node.urlChunkingMethod ?? "sentence";
  const enableOcr = node.urlEnableOcr ?? false;

  const update = (fields: Partial<CanvasNode>) => onUpdateNode?.(node.id, fields);

  return (
    <>
      <Section title="Test URL" icon={<Link2 className="h-3.5 w-3.5" />} defaultOpen>
        <FieldLabel>Website URL</FieldLabel>
        <input
          type="url"
          className={cn(inputClass, "mb-3")}
          placeholder="https://example.com"
          value={node.inputValue ?? ""}
          onChange={(e) => onUpdateValue(node.id, e.target.value)}
          disabled={enableAsInput}
        />
        <Toggle
          checked={enableAsInput}
          onChange={(v) => update({ urlEnableAsInput: v })}
          label="Enable URL as Input"
        />
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          Allow an upstream node to supply the URL dynamically.
        </p>
      </Section>

      <Section title="Extraction Mode" icon={<AlignLeft className="h-3.5 w-3.5" />} defaultOpen>
        <div className="flex gap-2">
          {(["html", "metadata"] as const).map((m) => (
            <button
              key={m}
              onClick={() => update({ urlExtractionMode: m })}
              className={cn(
                "flex-1 px-3 py-2 rounded-md border text-xs font-[450] transition-colors",
                mode === m
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-background text-foreground border-prune-borderGray hover:bg-muted/40",
              )}
            >
              {m === "html" ? "Page HTML" : "Metadata Only"}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          {mode === "html"
            ? "Retrieves full HTML — suited for content parsing, summarization, and extraction."
            : "Fetches only meta tags — useful for lightweight previews or indexing."}
        </p>
      </Section>

      <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <Toggle
          checked={enableSubpageCrawl}
          onChange={(v) => update({ urlEnableSubpageCrawl: v })}
          label="Crawl subpages"
        />
        <p className="text-[11px] text-muted-foreground/70 mb-3">
          Follow and crawl linked pages within the same domain.
        </p>
        <Toggle
          checked={enableOcr}
          onChange={(v) => update({ urlEnableOcr: v })}
          label="Enable OCR"
        />
        <p className="text-[11px] text-muted-foreground/70">
          Extract text from images on the page.
        </p>
      </Section>

      <Section title="Chunking Settings" icon={<Hash className="h-3.5 w-3.5" />}>
        <FieldLabel>Algorithm</FieldLabel>
        <div className="flex gap-2 mb-3">
          {CHUNKING_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => update({ urlChunkingMethod: m.id })}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md border text-xs font-[450] transition-colors",
                chunkingMethod === m.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-background text-foreground border-prune-borderGray hover:bg-muted/40",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Chunk size</FieldLabel>
            <input
              type="number"
              min={100}
              max={4000}
              step={100}
              className={inputClass}
              value={chunkSize}
              onChange={(e) => update({ urlChunkSize: Number(e.target.value) })}
            />
          </div>
          <div>
            <FieldLabel>Overlap %</FieldLabel>
            <input
              type="number"
              min={0}
              max={50}
              step={5}
              className={inputClass}
              value={chunkOverlapPct}
              onChange={(e) => update({ urlChunkOverlapPct: Number(e.target.value) })}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
