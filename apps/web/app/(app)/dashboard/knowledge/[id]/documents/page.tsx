"use client"

import { use, useRef, useState } from "react"
import {
  Download, RefreshCw, AlertTriangle, Trash2, CheckCircle2, AlertCircle, Clock, MoreHorizontal, Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useKnowledgeStore, type KBDocument } from "@/lib/knowledge-store"
import { cn } from "@/lib/utils"

function StatusIcon({ status }: { status: KBDocument["status"] }) {
  if (status === "indexed") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />
  return <Clock className="h-4 w-4 text-muted-foreground" />
}

function formatBytes(b: number) {
  return b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${(b / 1024).toFixed(1)} KB`
}

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { bases, addDocument, removeDocument } = useKnowledgeStore()
  const kb = bases.find((b) => b.id === id)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!kb) return null

  const docs = kb.documents.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalBytes = kb.documents.reduce((s, d) => s + d.sizeBytes, 0)
  const indexed = kb.documents.filter((d) => d.status === "indexed").length
  const errors = kb.documents.filter((d) => d.status === "error").length
  const allChecked = docs.length > 0 && docs.every((d) => checked.has(d.id))

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev)
      if (allChecked) docs.forEach((d) => next.delete(d.id))
      else docs.forEach((d) => next.add(d.id))
      return next
    })
  }

  function handleUpload(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((f) => addDocument(id, f))
  }

  return (
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
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          {[
            { icon: Download, tip: "Download selected" },
            { icon: RefreshCw, tip: "Re-index selected" },
            { icon: AlertTriangle, tip: "Show errors" },
            { icon: Trash2, tip: "Delete selected" },
          ].map(({ icon: Icon, tip }) => (
            <Tooltip key={tip}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[12px] w-48" />
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-muted/40 border-b">
            <tr>
              <th className="w-10 px-4 py-2.5 text-left">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-primary h-3.5 w-3.5 cursor-pointer" />
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Size</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  {kb.documents.length === 0 ? "No files yet. Click Upload to add documents." : "No results."}
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className={cn("border-b hover:bg-muted/30 transition-colors", checked.has(doc.id) && "bg-muted/20")}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked.has(doc.id)}
                      onChange={() => setChecked((p) => { const n = new Set(p); n.has(doc.id) ? n.delete(doc.id) : n.add(doc.id); return n })}
                      className="accent-primary h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-[450] flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {doc.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.sizeBytes)}</td>
                  <td className="px-4 py-3">
                    <StatusIcon status={doc.status} />
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-[13px]">
                        <DropdownMenuItem className="gap-2 cursor-pointer">Download</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">Re-index</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => removeDocument(id, doc.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Size: {formatBytes(totalBytes)}</span>
        <span>Files: {kb.documents.length} &nbsp;|&nbsp; Indexed: {indexed} &nbsp;|&nbsp; Errors: {errors}</span>
      </div>
    </div>
  )
}
