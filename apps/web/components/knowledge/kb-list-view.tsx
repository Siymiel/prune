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
import type { KnowledgeBaseOut } from "@/lib/api"
import { cn } from "@/lib/utils"

type SortKey = "document_count" | "created_at"

interface Props {
  bases: KnowledgeBaseOut[]
  onDelete: (kb: KnowledgeBaseOut) => void
}

function formatRelative(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
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
    key: "created_at",
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
    if (sort.key === "document_count") {
      av = a.document_count
      bv = b.document_count
    } else {
      av = new Date(a.created_at).getTime()
      bv = new Date(b.created_at).getTime()
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
            Documents
            <SortBtn k="document_count" />
          </th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Description</th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Access</th>
          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
            Created
            <SortBtn k="created_at" />
          </th>
          <th className="w-10" />
        </tr>
      </thead>
      <tbody>
        {sorted.map((kb) => {
          const isChecked = checked.has(kb.id)
          return (
            <tr
              key={kb.id}
              className={cn(
                "border-b hover:bg-muted/30 cursor-pointer transition-colors",
                isChecked && "bg-muted/20"
              )}
              onClick={() => router.push(`/dashboard/knowledge/${kb.id}/documents` as never)}
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
              <td className="px-4 py-3 text-muted-foreground">{kb.document_count}</td>
              <td className="px-4 py-3 text-muted-foreground truncate max-w-[240px]">
                {kb.description ?? "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span>Private</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatRelative(kb.created_at)}
              </td>
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
