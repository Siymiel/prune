"use client"

import { useState, useMemo } from "react"
import { Search, SlidersHorizontal, ArrowUpDown, CheckCircle, XCircle, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Connection } from "./provider-data"
import { cn } from "@/lib/utils"

type SortField = "createdBy" | "createdAt" | null
type SortDir = "asc" | "desc"

const PAGE_SIZES = [15, 30, 100]

interface Props {
  connections: Connection[]
  onTest: (id: string) => void
}

function TestBadge({ status }: { status: Connection["testStatus"] }) {
  if (status === "success") return <span className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle className="h-3 w-3" />Passed</span>
  if (status === "failed") return <span className="flex items-center gap-1 text-[11px] text-destructive"><XCircle className="h-3 w-3" />Failed</span>
  return <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Minus className="h-3 w-3" />—</span>
}

export function ConnectionsTable({ connections, onTest }: Props) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [pageSize, setPageSize] = useState(15)
  const [page, setPage] = useState(0)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("asc") }
  }

  const filtered = useMemo(() => {
    let r = connections.filter(
      (c) =>
        c.provider.name.toLowerCase().includes(search.toLowerCase()) ||
        c.connectionName.toLowerCase().includes(search.toLowerCase()),
    )
    if (sortField) {
      r = [...r].sort((a, b) => {
        const va = sortField === "createdBy" ? a.createdBy : a.createdAt.getTime()
        const vb = sortField === "createdBy" ? b.createdBy : b.createdAt.getTime()
        const cmp = va > vb ? 1 : va < vb ? -1 : 0
        return sortDir === "asc" ? cmp : -cmp
      })
    }
    return r
  }, [connections, search, sortField, sortDir])

  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const allChecked = pageData.length > 0 && pageData.every((c) => checked.has(c.id))

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev)
      if (allChecked) pageData.forEach((c) => next.delete(c.id))
      else pageData.forEach((c) => next.add(c.id))
      return next
    })
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortField === field ? "text-foreground" : "text-muted-foreground/50")} />
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search + Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search connections"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-9 h-8 text-[13px]"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-[13px]">
            <p className="px-2 py-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Filter By</p>
            <DropdownMenuItem className="gap-2 cursor-pointer">Provider</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">Created by</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">Created at</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">Copy URL</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              Clear all filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-muted/40 border-b">
            <tr>
              <th className="w-10 px-4 py-2.5 text-left">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-primary h-3.5 w-3.5 cursor-pointer" />
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Provider</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Connection Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("createdBy")}>
                <span className="flex items-center gap-1">Created by <SortIcon field="createdBy" /></span>
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                <span className="flex items-center gap-1">Created at <SortIcon field="createdAt" /></span>
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">General Access</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Test</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-5 text-[13px] text-muted-foreground">No results.</td>
              </tr>
            ) : (
              pageData.map((conn) => (
                <tr key={conn.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked.has(conn.id)}
                      onChange={() => setChecked((prev) => { const n = new Set(prev); n.has(conn.id) ? n.delete(conn.id) : n.add(conn.id); return n })}
                      className="accent-primary h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ backgroundColor: conn.provider.color }}>
                        {conn.provider.name[0]}
                      </div>
                      <span className="font-[450]">{conn.provider.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-[450]">{conn.connectionName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{conn.createdBy}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {conn.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{conn.generalAccess}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TestBadge status={conn.testStatus} />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 text-[11px] px-2" onClick={() => onTest(conn.id)}>
                            Test
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Run connection test</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-[12px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-[12px]" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ‹ Prev
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[12px]" disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage((p) => p + 1)}>
            Next ›
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {PAGE_SIZES.map((n) => (
            <button key={n} onClick={() => { setPageSize(n); setPage(0) }} className={cn("text-[12px] hover:text-foreground transition-colors", pageSize === n ? "text-foreground font-medium" : "")}>
              {n} rows
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
