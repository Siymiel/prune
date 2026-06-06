"use client"

import { use, useCallback, useEffect, useRef, useState } from "react"
import {
  RefreshCw, AlertTriangle, Trash2, CheckCircle2, AlertCircle, Clock, MoreHorizontal, Upload, Loader2, FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { api, type KnowledgeDocumentOut } from "@/lib/api"

function StatusBadge({ status, error }: { status: KnowledgeDocumentOut["status"]; error: string | null }) {
  if (status === "ready") return (
    <div className="flex items-center gap-1.5">
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      <span className="text-[12px] text-emerald-600 font-medium">Indexed</span>
    </div>
  )
  if (status === "error") return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-[12px] text-destructive font-medium">Error</span>
        </div>
      </TooltipTrigger>
      {error && <TooltipContent className="max-w-xs text-[12px]">{error}</TooltipContent>}
    </Tooltip>
  )
  return (
    <div className="flex items-center gap-1.5">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-[12px] text-muted-foreground">Processing</span>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [docs, setDocs] = useState<KnowledgeDocumentOut[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(() => {
    return api.knowledgeBases.listDocuments(id).then(setDocs).catch(() => {})
  }, [id])

  useEffect(() => {
    setLoading(true)
    fetchDocs().finally(() => setLoading(false))
  }, [fetchDocs])

  // Poll while any doc is still processing
  useEffect(() => {
    const processing = docs.some((d) => d.status === "processing")
    if (!processing) return
    const timer = setTimeout(() => fetchDocs(), 3000)
    return () => clearTimeout(timer)
  }, [docs, fetchDocs])

  const filtered = docs.filter((d) => {
    const matchSearch = d.filename.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "indexed" && d.status === "ready") ||
      (statusFilter === "error" && d.status === "error") ||
      (statusFilter === "pending" && d.status === "processing")
    return matchSearch && matchStatus
  })

  const allChecked = filtered.length > 0 && filtered.every((d) => checked.has(d.id))
  const indexed = docs.filter((d) => d.status === "ready").length
  const errors = docs.filter((d) => d.status === "error").length

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev)
      if (allChecked) filtered.forEach((d) => next.delete(d.id))
      else filtered.forEach((d) => next.add(d.id))
      return next
    })
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const doc = await api.knowledgeBases.uploadDocument(id, file)
        setDocs((prev) => [...prev, doc])
      }
    } catch {
      // TODO: surface toast
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteDoc(docId: string) {
    await api.knowledgeBases.deleteDocument(id, docId).catch(() => {})
    setDocs((prev) => prev.filter((d) => d.id !== docId))
    setChecked((prev) => { const n = new Set(prev); n.delete(docId); return n })
  }

  async function handleDeleteSelected() {
    const ids = Array.from(checked)
    await Promise.all(ids.map((did) => api.knowledgeBases.deleteDocument(id, did).catch(() => {})))
    setDocs((prev) => prev.filter((d) => !checked.has(d.id)))
    setChecked(new Set())
  }

  async function handleShowErrors() {
    setStatusFilter("error")
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-[12px] w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-[13px]">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="indexed">Indexed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Processing</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setLoading(true); fetchDocs().finally(() => setLoading(false)) }}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleShowErrors}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show errors</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  disabled={checked.size === 0}
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[12px] w-48" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => { handleUpload(e.target.files); e.target.value = "" }}
            />
            <Button size="sm" className="h-8 gap-1.5 text-[12px]" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-muted/40 border-b">
                <tr>
                  <th className="w-10 px-4 py-2.5 text-left">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-primary h-3.5 w-3.5 cursor-pointer" />
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-20">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Chunks</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Added</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                      {docs.length === 0
                        ? "No files yet. Click Upload to add documents."
                        : "No results match your filter."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((doc) => (
                    <tr key={doc.id} className={cn("border-b hover:bg-muted/30 transition-colors", checked.has(doc.id) && "bg-muted/20")}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked.has(doc.id)}
                          onChange={() => setChecked((p) => { const n = new Set(p); n.has(doc.id) ? n.delete(doc.id) : n.add(doc.id); return n })}
                          className="accent-primary h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-[450]">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[280px]">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground uppercase text-[11px] font-medium">{doc.file_type}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {doc.status === "ready" ? doc.chunk_count : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={doc.status} error={doc.error} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-[13px]">
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Files: {docs.length}</span>
          <span>Indexed: {indexed} &nbsp;|&nbsp; Errors: {errors} &nbsp;|&nbsp; Processing: {docs.length - indexed - errors}</span>
        </div>
      </div>
    </TooltipProvider>
  )
}
