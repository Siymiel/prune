"use client";

import { useRef, useState } from "react";
import {
  FileText,
  FilePlus2,
  Loader2,
  Rocket,
  Settings2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { type CanvasNode } from "@/lib/editor-nodes";
import { FieldLabel, Section, Slider, Toggle } from "./panel-ui";

type PreloadedFile = NonNullable<CanvasNode["preloadedFiles"]>[number];

const ACCEPT = ".pdf,.docx,.txt,.md";
const MAX_SIZE_MB = 10;

export function FilesPanelSections({
  node,
  onUpdateNode,
}: {
  node: CanvasNode;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exposeAsInput = node.exposeAsInput ?? true;
  const enableParsing = node.enableParsing ?? true;
  const enableOcr = node.enableOcr ?? false;
  const chunkingMethod = node.fileChunkingMethod ?? "sentence";
  const chunkSize = node.fileChunkSize ?? 500;
  const chunkOverlap = node.fileChunkOverlap ?? 20;
  const preloadedFiles: PreloadedFile[] = node.preloadedFiles ?? [];

  function update(fields: Partial<CanvasNode>) {
    onUpdateNode?.(node.id, fields);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File exceeds ${MAX_SIZE_MB} MB limit`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.files.extract(file);
      const newFile: PreloadedFile = {
        id: `f-${Date.now()}`,
        name: result.name,
        type: result.type,
        text: result.text,
        size: result.size,
      };
      update({ preloadedFiles: [...preloadedFiles, newFile] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeFile(id: string) {
    update({ preloadedFiles: preloadedFiles.filter((f) => f.id !== id) });
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <>
      {/* ── Files section ─────────────────────────────────────────── */}
      <Section
        title="Test Files"
        icon={<FileText className="h-3.5 w-3.5" />}
        defaultOpen
      >
          {/* Uploaded files list */}
          {preloadedFiles.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {preloadedFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/30 border rounded-md text-xs"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate font-medium">{f.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {formatSize(f.size)}
                  </span>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 py-8 px-4 text-center cursor-pointer transition-colors",
              dragging
                ? "border-gray-400 bg-muted/30"
                : "border-prune-borderGray bg-prune-lightGray/40 hover:bg-muted/20",
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="h-10 w-10 rounded-xl bg-white border border-prune-borderGray flex items-center justify-center mb-1 shadow-sm">
                  <FilePlus2 className="h-5 w-5 text-prune-commonGray" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Upload file
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, TXT, MD — max {MAX_SIZE_MB} MB
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {uploadError && (
            <p className="mt-2 text-[11px] text-red-500">{uploadError}</p>
          )}
        </Section>

      {/* ── Settings ──────────────────────────────────────────────── */}
      <Section
        title="Settings"
        icon={<Settings2 className="h-3.5 w-3.5" />}
        defaultOpen={exposeAsInput}
      >
        <div className="space-y-4">
          {/* Expose as input */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[14px] font-medium text-gray-800 underline decoration-dashed underline-offset-4 mb-0.5">
                Expose as input
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Let users upload files at runtime via the interface
              </p>
            </div>
            <Toggle
              checked={exposeAsInput}
              onChange={(v) => update({ exposeAsInput: v })}
            />
          </div>

          {/* Enable parsing */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[14px] font-medium text-gray-800 underline decoration-dashed underline-offset-4 mb-0.5">
                Enable parsing
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Extract readable text from PDFs, Word docs, and presentations
              </p>
            </div>
            <Toggle
              checked={enableParsing}
              onChange={(v) => update({ enableParsing: v })}
            />
          </div>

          {enableParsing && (
            <>
              {/* Chunking method */}
              <div>
                <FieldLabel>Chunking Method</FieldLabel>
                <div className="flex gap-1 p-0.5 bg-muted/40 rounded-lg border">
                  {(["naive", "sentence"] as Array<"naive" | "sentence">).map(
                    (m) => (
                      <button
                        key={m}
                        onClick={() => update({ fileChunkingMethod: m })}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors",
                          chunkingMethod === m
                            ? "bg-white text-foreground shadow-sm border"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m === "naive" ? "Naïve (Fixed)" : "Sentence-based"}
                      </button>
                    ),
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  {chunkingMethod === "naive"
                    ? "Splits by character count. Fast but may fragment sentences."
                    : "Splits at sentence boundaries. Better context, slightly more compute."}
                </p>
              </div>

              {/* Chunk size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Chunk Size (tokens)</FieldLabel>
                  <span className="text-xs font-medium tabular-nums">
                    {chunkSize}
                  </span>
                </div>
                <Slider
                  value={chunkSize}
                  min={200}
                  max={1000}
                  step={50}
                  onChange={(v) => update({ fileChunkSize: v })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Recommended: 200–1,000 tokens
                </p>
              </div>

              {/* Chunk overlap */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Chunk Overlap (%)</FieldLabel>
                  <span className="text-xs font-medium tabular-nums">
                    {chunkOverlap}%
                  </span>
                </div>
                <Slider
                  value={chunkOverlap}
                  min={0}
                  max={50}
                  step={5}
                  onChange={(v) => update({ fileChunkOverlap: v })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Recommended: 15–30% to preserve context between chunks
                </p>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── Advanced ──────────────────────────────────────────────── */}
      <Section title="Advanced" icon={<Rocket className="h-3.5 w-3.5" />}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[14px] font-medium text-gray-800 underline decoration-dashed underline-offset-4 mb-0.5">
              OCR (Text in Images)
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Extract text embedded in images inside documents.{" "}
              <span className="text-amber-600 font-medium">
                Significantly increases processing time and cost.
              </span>
            </p>
          </div>
          <Toggle
            checked={enableOcr}
            onChange={(v) => update({ enableOcr: v })}
          />
        </div>
      </Section>
    </>
  );
}
