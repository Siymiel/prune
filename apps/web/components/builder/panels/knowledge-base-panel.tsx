"use client";

import { useEffect, useRef, useState } from "react";
import {
  Database, Settings2, Plus, Upload, Trash2, FileText,
  Loader2, CheckCircle2, AlertCircle, RefreshCw, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type KnowledgeBaseOut, type KnowledgeDocumentOut } from "@/lib/api";
import type { CanvasNode } from "@/lib/editor-nodes";
import { Section, FieldLabel } from "./panel-ui";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedKbId = node.inputValue ?? "";
  const selectedKb = kbs.find((k) => k.id === selectedKbId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
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
      const doc = await api.knowledgeBases.uploadDocument(selectedKbId, file);
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
        <FieldLabel>Top-K results</FieldLabel>
        <p className="text-xs text-muted-foreground">
          Returns the 5 most relevant chunks. Adjust in the node config.
        </p>
      </Section>
    </>
  );
}
