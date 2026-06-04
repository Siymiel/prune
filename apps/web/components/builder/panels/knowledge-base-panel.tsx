"use client";

import { useEffect, useRef, useState } from "react";
import {
  Database, Settings2, Plus, Upload, Trash2, FileText,
  Loader2, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type KnowledgeBaseOut, type KnowledgeDocumentOut } from "@/lib/api";
import type { CanvasNode } from "@/lib/editor-nodes";
import { Section, FieldLabel, Slider } from "./panel-ui";

const EMBEDDING_MODELS = [
  { id: "text-embedding-3-large", label: "text-embedding-3-large", provider: "OpenAI" },
  { id: "text-embedding-3-small", label: "text-embedding-3-small", provider: "OpenAI" },
  { id: "text-embedding-ada-002", label: "text-embedding-ada-002", provider: "OpenAI" },
  { id: "all-mpnet-base-v2", label: "all-mpnet-base-v2", provider: "Open Source" },
  { id: "bert-base-cased", label: "bert-base-cased", provider: "Google" },
];

const STATUS_ICON = {
  processing: <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />,
  ready:      <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  error:      <AlertCircle className="h-3 w-3 text-red-400" />,
};

function CreateKBForm({ onCreated }: { onCreated: (kb: KnowledgeBaseOut) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const kb = await api.knowledgeBases.create(name.trim());
      onCreated(kb);
      setName("");
    } catch {
      // surface error inline in future; for now fail silently
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        className="flex-1 px-2 py-1.5 text-xs bg-muted/30 border rounded-md outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/40"
        placeholder="Knowledge base name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        Create
      </button>
    </form>
  );
}

function DocumentRow({
  doc,
  onDelete,
}: {
  doc: KnowledgeDocumentOut;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 group">
      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="flex-1 text-xs truncate text-foreground">{doc.filename}</span>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {doc.status === "ready" ? `${doc.chunk_count} chunks` : doc.status}
      </span>
      {STATUS_ICON[doc.status] ?? null}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export function KnowledgeBasePanelSections({
  node,
  onUpdateValue,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
}) {
  const [kbs, setKbs] = useState<KnowledgeBaseOut[]>([]);
  const [docs, setDocs] = useState<KnowledgeDocumentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [embeddingDropdownOpen, setEmbeddingDropdownOpen] = useState(false);
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [chunkingMethod, setChunkingMethod] = useState<"naive" | "sentence">("sentence");
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(20);
  const [topK, setTopK] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const embeddingDropdownRef = useRef<HTMLDivElement>(null);

  const selectedKbId = node.inputValue ?? "";
  const selectedKb = kbs.find((k) => k.id === selectedKbId);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (embeddingDropdownRef.current && !embeddingDropdownRef.current.contains(e.target as Node))
        setEmbeddingDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Load knowledge bases
  useEffect(() => {
    setLoading(true);
    api.knowledgeBases.list()
      .then(setKbs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load documents when selected KB changes
  useEffect(() => {
    if (!selectedKbId) { setDocs([]); return; }
    api.knowledgeBases.listDocuments(selectedKbId)
      .then(setDocs)
      .catch(() => setDocs([]));
  }, [selectedKbId]);

  // Poll processing documents until they settle
  useEffect(() => {
    if (!selectedKbId) return;
    const processing = docs.some((d) => d.status === "processing");
    if (!processing) return;
    const id = setTimeout(() => {
      api.knowledgeBases.listDocuments(selectedKbId)
        .then(setDocs)
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(id);
  }, [docs, selectedKbId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedKbId) return;
    e.target.value = "";
    setUploading(true);
    try {
      const doc = await api.knowledgeBases.uploadDocument(selectedKbId, file, {
        chunkSize: chunkSize,
        chunkOverlapPct: chunkOverlap,
        chunkingMethod: chunkingMethod,
        embeddingModel: embeddingModel,
      });
      setDocs((prev) => [...prev, doc]);
    } catch {
      // TODO: surface error toast
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!selectedKbId) return;
    await api.knowledgeBases.deleteDocument(selectedKbId, docId).catch(() => {});
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  async function handleDeleteKb(kbId: string) {
    await api.knowledgeBases.delete(kbId).catch(() => {});
    setKbs((prev) => prev.filter((k) => k.id !== kbId));
    if (selectedKbId === kbId) onUpdateValue(node.id, "");
  }

  function handleRefreshDocs() {
    if (!selectedKbId) return;
    api.knowledgeBases.listDocuments(selectedKbId).then(setDocs).catch(() => {});
  }

  return (
    <>
      {/* Source section */}
      <Section title="Source" icon={<Database className="h-3.5 w-3.5" />} defaultOpen>
        <FieldLabel>Knowledge base</FieldLabel>

        {/* KB selector dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-muted/30 border rounded-md hover:bg-muted/50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Database className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={cn("flex-1 text-left truncate", !selectedKb && "text-muted-foreground/50")}>
              {selectedKb ? selectedKb.name : "Select a knowledge base…"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border rounded-xl shadow-lg py-1 px-1 max-h-48 overflow-y-auto">
              {kbs.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2">No knowledge bases yet.</p>
              ) : (
                kbs.map((kb) => (
                  <div
                    key={kb.id}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() => { onUpdateValue(node.id, kb.id); setDropdownOpen(false); }}
                      className={cn(
                        "flex-1 flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-left hover:bg-muted/40 transition-colors",
                        selectedKbId === kb.id && "bg-muted/60 font-medium",
                      )}
                    >
                      <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{kb.name}</span>
                      <span className="text-muted-foreground/50 shrink-0">{kb.document_count} docs</span>
                    </button>
                    <button
                      onClick={() => handleDeleteKb(kb.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Create new KB */}
        <button
          onClick={() => setShowCreate((o) => !o)}
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          {showCreate ? "Cancel" : "New knowledge base"}
        </button>
        {showCreate && (
          <CreateKBForm
            onCreated={(kb) => {
              setKbs((prev) => [...prev, kb]);
              onUpdateValue(node.id, kb.id);
              setShowCreate(false);
            }}
          />
        )}
      </Section>

      {/* Documents section */}
      <Section title="Documents" icon={<FileText className="h-3.5 w-3.5" />} defaultOpen>
        {!selectedKbId ? (
          <p className="text-xs text-muted-foreground">Select a knowledge base to manage documents.</p>
        ) : (
          <>
            {/* Upload button */}
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted/30 transition-colors disabled:opacity-40"
              >
                {uploading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Upload className="h-3 w-3" />}
                {uploading ? "Uploading…" : "Upload file"}
              </button>
              <button
                onClick={handleRefreshDocs}
                className="p-1.5 rounded-md border hover:bg-muted/30 transition-colors text-muted-foreground"
                title="Refresh"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground/60 mb-2">
              Supported: PDF, DOCX, TXT, MD
            </p>

            {docs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents yet.</p>
            ) : (
              <div className="space-y-0.5">
                {docs.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    onDelete={() => handleDeleteDoc(doc.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      {/* Options section */}
      <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="space-y-5">
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
              Used to convert documents into vectors for semantic search.
            </p>
          </div>

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

          {/* Top-K */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Top-K Results</FieldLabel>
              <span className="text-xs font-medium tabular-nums">{topK}</span>
            </div>
            <Slider value={topK} min={1} max={20} step={1} onChange={setTopK} />
            <p className="text-[10px] text-muted-foreground mt-1">
              Number of most relevant chunks returned to the AI per query
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
