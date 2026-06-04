"use client"

import { useState, useRef } from "react"
import {
  Search,
  Plus,
  EyeOff,
  LayoutGrid,
  ArrowDown,
  SlidersHorizontal,
  Pencil,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePublishedAgentsStore } from "@/lib/published-agents-store"
import { CreateLabelDialog } from "@/components/published-agents/create-label-dialog"
import { cn } from "@/lib/utils"

type SortBy = "most-used" | "name" | "date-created" | "last-modified"
type View = "all" | "hidden"

const SORT_LABELS: Record<SortBy, string> = {
  "most-used": "Most Used",
  name: "Name",
  "date-created": "Date Created",
  "last-modified": "Last Modified",
}

export default function PublishedAgentsPage() {
  const { agents, labels, categories, addLabel, addCategory } = usePublishedAgentsStore()

  const [view, setView] = useState<View>("all")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("most-used")
  const [labelDialogOpen, setLabelDialogOpen] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryInput, setCategoryInput] = useState("")
  const categoryInputRef = useRef<HTMLInputElement>(null)

  const visibleAgents = agents
    .filter((a) => (view === "hidden" ? a.isHidden : !a.isHidden))
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  function handleAddCategory() {
    if (categoryInput.trim()) addCategory(categoryInput.trim())
    setCategoryInput("")
    setAddingCategory(false)
  }

  return (
    <>
      <CreateLabelDialog
        open={labelDialogOpen}
        onOpenChange={setLabelDialogOpen}
        onCreate={addLabel}
      />

      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <h1 className="text-[15px] font-semibold">Published Agents</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-[13px] gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button size="sm" className="text-[13px] gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              View public grid
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <aside className="w-52 border-r flex flex-col shrink-0 bg-muted/10">
            {/* Org header */}
            <div className="flex items-center gap-2 px-3 py-3 border-b">
              <div className="h-7 w-7 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
                S
              </div>
              <span className="text-[12px] font-medium leading-tight">
                Samuel Kinuthia&apos;s Organization
              </span>
            </div>

            {/* Nav */}
            <div className="p-2 flex flex-col gap-0.5 border-b">
              <button
                onClick={() => setView("all")}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors w-full text-left",
                  view === "all"
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                All Agents
              </button>
              <button
                onClick={() => setView("hidden")}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors w-full text-left",
                  view === "hidden"
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <EyeOff className="h-3.5 w-3.5 shrink-0" />
                Hidden
              </button>
            </div>

            {/* Categories */}
            <div className="p-2 flex flex-col gap-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1">
                Categories
              </p>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full text-left"
                >
                  {cat.name}
                </button>
              ))}
              {addingCategory ? (
                <input
                  ref={categoryInputRef}
                  autoFocus
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onBlur={handleAddCategory}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory()
                    if (e.key === "Escape") {
                      setCategoryInput("")
                      setAddingCategory(false)
                    }
                  }}
                  placeholder="Category name"
                  className="w-full px-2 py-1.5 rounded-md border text-[13px] outline-none focus:ring-1 focus:ring-ring bg-background"
                />
              ) : (
                <button
                  onClick={() => setAddingCategory(true)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                >
                  <Plus className="h-3 w-3" />
                  Add category
                </button>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-[13px] h-9"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-[13px] gap-1.5 shrink-0">
                    {SORT_LABELS[sortBy]}
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-[13px] min-w-[160px]">
                  {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={cn("cursor-pointer", sortBy === key && "font-medium")}
                    >
                      {label}
                      {sortBy === key && <ArrowDown className="h-3 w-3 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="text-[13px] gap-1.5 shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </Button>
            </div>

            {/* Labels bar */}
            <div className="px-4 py-2.5 border-b shrink-0 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setLabelDialogOpen(true)}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground border border-dashed rounded-md px-3 py-1 hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Label
              </button>
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="text-[12px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                >
                  {label.name}
                </span>
              ))}
            </div>

            {/* Section heading */}
            <div className="px-4 py-3 shrink-0">
              <h2 className="text-[14px] font-semibold">
                {view === "all" ? "All Agents" : "Hidden"}{" "}
                <span className="text-muted-foreground font-normal">
                  ({visibleAgents.length})
                </span>
              </h2>
            </div>

            {/* Content / empty state */}
            <div className="flex-1 flex items-center justify-center overflow-auto">
              {visibleAgents.length === 0 && (
                <div className="text-center">
                  <p className="text-[14px] font-medium">No agents found</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Agents are created when you publish a flow with a public UI URL
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
