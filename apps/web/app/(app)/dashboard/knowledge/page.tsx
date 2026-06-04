"use client"

import { useState } from "react"
import { Plus, LayoutGrid, List, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useKnowledgeStore } from "@/lib/knowledge-store"
import { KnowledgeCard } from "@/components/knowledge/knowledge-card"
import { KBListView } from "@/components/knowledge/kb-list-view"
import { NewKBDialog } from "@/components/knowledge/new-kb-dialog"
import { DeleteKBDialog } from "@/components/knowledge/delete-kb-dialog"
import { KBFiltersPanel } from "@/components/knowledge/kb-filters-panel"
import { cn } from "@/lib/utils"
import type { KnowledgeBase } from "@/lib/knowledge-store"

const PAGE_SIZES = [15, 30, 100]

export default function KnowledgeBasesPage() {
  const { bases, addBase, removeBase } = useKnowledgeStore()
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("list")
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  const filtered = bases.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  function handleDelete(kb: KnowledgeBase) {
    setDeleteTarget({ id: kb.id, name: kb.name })
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  return (
    <TooltipProvider>
      <NewKBDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={addBase} />
      <DeleteKBDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        kbName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && removeBase(deleteTarget.id)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h1 className="text-[15px] font-semibold">Knowledge Bases</h1>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Knowledge Base
          </Button>
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Search knowledge bases"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-8 text-[13px]"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", view === "grid" && "bg-muted")}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", view === "list" && "bg-muted")}
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <KBFiltersPanel />
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center -mt-8">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-[15px] font-medium text-muted-foreground">No knowledge bases yet</p>
            <Button size="sm" className="gap-1.5 mt-1" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Knowledge Base
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map((kb) => (
                <KnowledgeCard
                  key={kb.id}
                  kb={kb}
                  onDelete={() => handleDelete(kb)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <KBListView bases={paginated} onDelete={handleDelete} />
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t text-[13px]">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-0.5 text-[12px]"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ‹ Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-0.5 text-[12px]"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                >
                  Next ›
                </Button>
              </div>
              <div className="flex items-center gap-1">
                {PAGE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setPageSize(size); setPage(0) }}
                    className={cn(
                      "px-2.5 py-1 rounded text-[12px] transition-colors",
                      pageSize === size
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {size === 15 ? "15 rows" : size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
