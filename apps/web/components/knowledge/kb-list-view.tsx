"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Folder, ArrowUpDown, MoreHorizontal, Lock, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { KnowledgeBase } from "@/lib/knowledge-store"
import { cn } from "@/lib/utils"

type SortKey = "sizeBytes" | "createdAt" | "updatedAt"

interface Props {
  bases: KnowledgeBase[]
  onDelete: (kb: KnowledgeBase) => void
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 KB"
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(2)} KB`
}

function formatRelative(date: Date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const d = Math.floor(hr / 24)
  return `${d} day${d !== 1 ? "s" : ""} ago`
}

export function KBListView({ bases, onDelete }: Props) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "createdAt",
    dir: "desc",
  })

  const allChecked = bases.length > 0 && bases.every((b) => checked.has(b.id))

  function toggleAll() {
    setChecked(allChecked ? new Set() : new Set(bases.map((b) => b.id)))
  }

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    )
  }

  const sorted = [...bases].sort((a, b) => {
    let av: number
    let bv: number
    if (sort.key === "sizeBytes") {
      av = a.documents.reduce((s, d) => s + d.sizeBytes, 0)
      bv = b.documents.reduce((s, d) => s + d.sizeBytes, 0)
    } else if (sort.key === "createdAt") {
      av = a.createdAt.getTime()
      bv = b.createdAt.getTime()
    } else {
      av = a.updatedAt.getTime()
      bv = b.updatedAt.getTime()
    }
    return sort.dir === "asc" ? av - bv : bv - av
  })

  function SortBtn({ k }: { k: SortKey }) {
    return (
      <button
        onClick={() => toggleSort(k)}
        className={cn(
          "ml-1 inline-flex items-center transition-opacity",
          sort.key === k ? "opacity-80" : "opacity-30 hover:opacity-60"
        )}
      >
        <ArrowUpDown className="h-3 w-3" />
      </button>
    )
  }

  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b bg-muted/20">
          <th className="w-10 px-4 py-2.5 text-left">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="accent-primary h-3.5 w-3.5 cursor-pointer"
            />
          </th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
            Total Size
            <SortBtn k="sizeBytes" />
          </th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Connections</th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Health</th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Visible To</th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">General Access</th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
            Created
            <SortBtn k="createdAt" />
          </th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
            Last Modified
            <SortBtn k="updatedAt" />
          </th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
            Last synced
          </th>
          <th className="w-10" />
        </tr>
      </thead>
      <tbody>
        {sorted.map((kb) => {
          const totalBytes = kb.documents.reduce((s, d) => s + d.sizeBytes, 0)
          const isChecked = checked.has(kb.id)
          return (
            <tr
              key={kb.id}
              className={cn(
                "border-b hover:bg-muted/30 cursor-pointer transition-colors",
                isChecked && "bg-muted/20"
              )}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => router.push(`/dashboard/knowledge/${kb.id}/documents` as any)}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    setChecked((p) => {
                      const n = new Set(p)
                      n.has(kb.id) ? n.delete(kb.id) : n.add(kb.id)
                      return n
                    })
                  }
                  className="accent-primary h-3.5 w-3.5 cursor-pointer"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center shrink-0">
                    <Folder className="h-3.5 w-3.5 text-background" />
                  </div>
                  <span className="font-[450] truncate max-w-[200px]">{kb.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatBytes(totalBytes)}</td>
              <td className="px-4 py-3 text-muted-foreground">{kb.connection ?? "No connection"}</td>
              <td className="px-4 py-3">
                <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/25" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
                    SK
                  </div>
                  <span className="text-muted-foreground truncate">Samuel Kinuthia</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span>Private</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatRelative(kb.createdAt)}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatRelative(kb.updatedAt)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">—</td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-[13px]">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => onDelete(kb)}
                    >
                      <Trash className="h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
