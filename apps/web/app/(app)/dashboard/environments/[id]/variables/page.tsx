"use client"

import { use, useState } from "react"
import { Plus, Eye, EyeOff, MoreHorizontal, Trash, KeyRound, AlignLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEnvironmentStore } from "@/lib/environment-store"
import { NewVariableDialog } from "@/components/environments/new-variable-dialog"
import { cn } from "@/lib/utils"

const PAGE_SIZES = [15, 30, 100]

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function MaskedValue({ value }: { value: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("font-mono text-[12px]", !visible && "tracking-widest")}>
        {visible ? value || "—" : value ? "••••••••" : "—"}
      </span>
      {value && (
        <button
          onClick={() => setVisible((v) => !v)}
          className="text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      )}
    </div>
  )
}

export default function VariablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { environments, addVariable, removeVariable } = useEnvironmentStore()
  const env = environments.find((e) => e.id === id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  if (!env) return null

  const pageCount = Math.max(1, Math.ceil(env.variables.length / pageSize))
  const paginated = env.variables.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <>
      <NewVariableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={(data) => addVariable(id, data)}
      />

      <div className="flex flex-col h-full">
        {/* Action bar */}
        <div className="flex justify-end px-5 py-3 border-b">
          <Button size="sm" className="gap-1.5 text-[13px]" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Variable
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-none border-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      Key
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <AlignLeft className="h-3.5 w-3.5" />
                      Development Value
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <AlignLeft className="h-3.5 w-3.5" />
                      Staging Value
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <AlignLeft className="h-3.5 w-3.5" />
                      Production Value
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Last Updated By
                    </div>
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-[13px] text-muted-foreground">
                      No results.
                    </td>
                  </tr>
                ) : (
                  paginated.map((variable) => (
                    <tr key={variable.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-[500]">{variable.key}</td>
                      <td className="px-5 py-3">
                        <MaskedValue value={variable.devValue} />
                      </td>
                      <td className="px-5 py-3">
                        <MaskedValue value={variable.stagingValue} />
                      </td>
                      <td className="px-5 py-3">
                        <MaskedValue value={variable.prodValue} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
                            SK
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-[450]">{variable.updatedBy}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(variable.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
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
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => removeVariable(id, variable.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
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
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t text-[13px]">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[12px]"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ‹ Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[12px]"
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
      </div>
    </>
  )
}
