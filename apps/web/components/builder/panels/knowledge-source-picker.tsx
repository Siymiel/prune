"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Search, Database, Check, Loader2, X, Globe, Link2, Plus, Upload, FileText, CheckCircle2, AlertCircle, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { SiGoogledrive, SiSlack, SiGmail, SiGooglesheets, SiAirtable, SiAlgolia } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/* ── Generic wrapper ─────────────────────────────────────────────────────── */

interface KnowledgeSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function KnowledgeSourceDialog({
  open,
  onOpenChange,
  title,
  children,
}: KnowledgeSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden"
        style={{
          right: 'calc(var(--panel-width, 0px) + 8px)',
          left: 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ── OR divider ──────────────────────────────────────────────────────────── */

function OrDivider() {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">OR</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ── Add Knowledge Base dialog ───────────────────────────────────────────── */

import { api, type KnowledgeBaseOut, type KnowledgeDocumentOut } from "@/lib/api";
import { cn } from "@/lib/utils";


const DOC_STATUS_ICON: Record<string, React.ReactNode> = {
  processing: <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />,
  ready:      <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  error:      <AlertCircle className="h-3 w-3 text-red-400" />,
};

export function KnowledgeBaseDialog({
  open,
  onOpenChange,
  selectedIds,
  onToggle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [kbs, setKbs] = useState<KnowledgeBaseOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKbId, setExpandedKbId] = useState<string | null>(null);
  const [docsByKb, setDocsByKb] = useState<Record<string, KnowledgeDocumentOut[]>>({});
  const [docsLoading, setDocsLoading] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [creating, setCreating] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.knowledgeBases.list()
      .then(setKbs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Poll processing docs in expanded KB
  useEffect(() => {
    if (!expandedKbId) return;
    const docs = docsByKb[expandedKbId] ?? [];
    if (!docs.some((d) => d.status === "processing")) return;
    const id = setTimeout(() => {
      api.knowledgeBases.listDocuments(expandedKbId)
        .then((updated) => setDocsByKb((prev) => ({ ...prev, [expandedKbId]: updated })))
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(id);
  }, [docsByKb, expandedKbId]);

  function toggleExpand(kbId: string) {
    if (expandedKbId === kbId) { setExpandedKbId(null); return; }
    setExpandedKbId(kbId);
    if (docsByKb[kbId]) return;
    setDocsLoading((p) => ({ ...p, [kbId]: true }));
    api.knowledgeBases.listDocuments(kbId)
      .then((docs) => setDocsByKb((prev) => ({ ...prev, [kbId]: docs })))
      .catch(() => {})
      .finally(() => setDocsLoading((p) => ({ ...p, [kbId]: false })));
  }

  async function handleUpload(kbId: string, file: File) {
    setUploading((p) => ({ ...p, [kbId]: true }));
    try {
      const doc = await api.knowledgeBases.uploadDocument(kbId, file);
      setDocsByKb((prev) => ({ ...prev, [kbId]: [...(prev[kbId] ?? []), doc] }));
      setKbs((prev) => prev.map((k) => k.id === kbId ? { ...k, document_count: k.document_count + 1 } : k));
      setExpandedKbId(kbId);
    } catch { /* silently fail */ }
    finally { setUploading((p) => ({ ...p, [kbId]: false })); }
  }

  async function handleDeleteDoc(kbId: string, docId: string) {
    await api.knowledgeBases.deleteDocument(kbId, docId).catch(() => {});
    setDocsByKb((prev) => ({ ...prev, [kbId]: (prev[kbId] ?? []).filter((d) => d.id !== docId) }));
    setKbs((prev) => prev.map((k) => k.id === kbId ? { ...k, document_count: Math.max(0, k.document_count - 1) } : k));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKbName.trim()) return;
    setCreating(true);
    try {
      const kb = await api.knowledgeBases.create(newKbName.trim());
      setKbs((prev) => [...prev, kb]);
      setNewKbName("");
      setShowCreate(false);
      onToggle(kb.id);
    } catch { /* silently fail */ }
    finally { setCreating(false); }
  }

  return (
    <KnowledgeSourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Knowledge Bases"
    >
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : kbs.length === 0 && !showCreate ? (
          <p className="text-sm text-muted-foreground px-4 py-6 text-center">
            No knowledge bases yet.
          </p>
        ) : (
          kbs.map((kb) => {
            const selected = selectedIds.includes(kb.id);
            const expanded = expandedKbId === kb.id;
            const docs = docsByKb[kb.id] ?? [];
            const isUploading = uploading[kb.id];
            const isDocsLoading = docsLoading[kb.id];

            return (
              <div key={kb.id} className="border-b last:border-b-0">
                {/* KB row */}
                <div className={cn("flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-colors", selected && "bg-muted/20")}>
                  {/* Checkbox */}
                  <button
                    onClick={() => onToggle(kb.id)}
                    className={cn(
                      "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      selected ? "bg-foreground border-foreground" : "border-muted-foreground/40 hover:border-muted-foreground"
                    )}
                  >
                    {selected && <Check className="h-2.5 w-2.5 text-background" />}
                  </button>

                  {/* Name + doc count */}
                  <button
                    onClick={() => toggleExpand(kb.id)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-[450] text-foreground truncate">{kb.name}</div>
                      <div className="text-[11px] text-muted-foreground">{kb.document_count} {kb.document_count === 1 ? "file" : "files"}</div>
                    </div>
                    {expanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Upload button */}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.md"
                    ref={(el) => { fileInputRefs.current[kb.id] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(kb.id, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRefs.current[kb.id]?.click(); }}
                    disabled={isUploading}
                    title="Upload file"
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-prune-borderGray bg-white hover:bg-muted/40 transition-colors shrink-0 disabled:opacity-40"
                  >
                    {isUploading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      : <Upload className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>

                {/* Expanded documents */}
                {expanded && (
                  <div className="px-3 pb-2 bg-muted/10">
                    {isDocsLoading ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      </div>
                    ) : docs.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-2 pl-1">
                        No documents yet. Click <Upload className="inline h-3 w-3 mx-0.5" /> to upload.
                      </p>
                    ) : (
                      <div className="space-y-0.5 pt-1">
                        {docs.map((doc) => (
                          <div key={doc.id} className="flex flex-col px-2 py-1 rounded-md hover:bg-muted/30 group">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="flex-1 text-[12px] truncate text-foreground">{doc.filename}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {doc.status === "ready" ? `${doc.chunk_count} chunks` : doc.status}
                              </span>
                              {DOC_STATUS_ICON[doc.status] ?? null}
                              <button
                                onClick={() => handleDeleteDoc(kb.id, doc.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            {doc.status === "error" && doc.error && (
                              <p className="text-[10px] text-red-400 pl-5 mt-0.5 leading-tight line-clamp-2" title={doc.error}>
                                {doc.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 pt-1">PDF, DOCX, TXT, MD supported</p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Create new KB */}
        <div className="px-3 py-2 border-t">
          {showCreate ? (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                autoFocus
                value={newKbName}
                onChange={(e) => setNewKbName(e.target.value)}
                placeholder="Knowledge base name…"
                className="flex-1 px-2.5 py-1.5 text-[13px] bg-muted/30 border rounded-md outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/40"
              />
              <button
                type="submit"
                disabled={creating || !newKbName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] border rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
              >
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewKbName(""); }}
                className="px-2.5 py-1.5 text-[13px] border rounded-md hover:bg-muted/30 transition-colors text-muted-foreground shrink-0"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New knowledge base
            </button>
          )}
        </div>
      </div>

      <div className="border-t px-4 py-3">
        <button
          onClick={() => onOpenChange(false)}
          className="w-full py-2 text-sm font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </KnowledgeSourceDialog>
  );
}

/* ── Connected apps ──────────────────────────────────────────────────────── */

const CONNECTED_APPS = [
  {
    id: "google-drive",
    label: "Google Drive",
    icon: <SiGoogledrive size={18} color="#4285F4" />,
  },
  {
    id: "onedrive",
    label: "OneDrive",
    icon: (
      <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-sm text-[9px] font-bold text-white bg-[#0078D4]">
        OD
      </span>
    ),
  },
  {
    id: "sharepoint",
    label: "Microsoft SharePoint",
    icon: (
      <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-sm text-[9px] font-bold text-white bg-[#0B6A0B]">
        SP
      </span>
    ),
  },
  {
    id: "slack",
    label: "Slack",
    icon: <SiSlack size={18} color="#4A154B" />,
  },
] as const;

export function ConnectedAppsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = CONNECTED_APPS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <KnowledgeSourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Connected Apps"
    >
      <div className="px-3 py-2.5 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Select an app to search"
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <div className="py-1 max-h-56 overflow-y-auto">
        {filtered.map((app) => (
          <button
            key={app.id}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-sm font-medium transition-colors text-left"
          >
            <span className="shrink-0">{app.icon}</span>
            {app.label}
          </button>
        ))}
      </div>
    </KnowledgeSourceDialog>
  );
}

/* ── Tools picker ────────────────────────────────────────────────────────── */

function AppBadge({ text, bg }: { text: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-sm text-[9px] font-bold text-white shrink-0"
      style={{ backgroundColor: bg }}
    >
      {text}
    </span>
  );
}

const MOST_USED_TOOLS = [
  { id: "stackai", label: "StackAI", icon: <AppBadge text="S" bg="#6366f1" /> },
  { id: "gmail", label: "Gmail", icon: <SiGmail size={18} color="#EA4335" /> },
  { id: "outlook", label: "Microsoft Outlook", icon: <AppBadge text="O" bg="#0078D4" /> },
  { id: "linkedin", label: "LinkedIn", icon: <AppBadge text="in" bg="#0A66C2" /> },
  { id: "google-sheets", label: "Google Sheets", icon: <SiGooglesheets size={18} color="#0F9D58" /> },
  { id: "slack", label: "Slack", icon: <SiSlack size={18} color="#4A154B" /> },
];

const ALL_TOOLS = [
  { id: "ahrefs", label: "Ahrefs", icon: <AppBadge text="A" bg="#FF6B35" /> },
  { id: "airops", label: "AirOps", icon: <AppBadge text="AO" bg="#1a1a2e" /> },
  { id: "airtable", label: "Airtable", icon: <SiAirtable size={18} color="#18BFFF" /> },
  { id: "algolia", label: "Algolia", icon: <SiAlgolia size={18} color="#5468FF" /> },
];

const PANEL_STYLE: React.CSSProperties = {
  right: "calc(var(--panel-width, 0px) + 8px)",
  left: "auto",
  top: "50%",
  transform: "translateY(-50%)",
};

export function ToolsPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");

  const filterFn = (label: string) =>
    !query || label.toLowerCase().includes(query.toLowerCase());

  const mostUsed = MOST_USED_TOOLS.filter((t) => filterFn(t.label));
  const all = ALL_TOOLS.filter((t) => filterFn(t.label));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="max-w-sm p-0 overflow-hidden"
        style={PANEL_STYLE}
      >
        <DialogTitle className="sr-only">Add Tools</DialogTitle>
        {/* Search header with inline close */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
          />
          <DialogClose className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus:outline-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {mostUsed.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
                Most used apps
              </div>
              {mostUsed.map((tool) => (
                <button
                  key={tool.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-sm font-medium transition-colors text-left"
                >
                  <span className="shrink-0">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </>
          )}
          {all.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground mt-1">
                All apps
              </div>
              {all.map((tool) => (
                <button
                  key={tool.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-sm font-medium transition-colors text-left"
                >
                  <span className="shrink-0">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
