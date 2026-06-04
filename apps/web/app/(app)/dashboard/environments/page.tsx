"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Globe, X, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEnvironmentStore } from "@/lib/environment-store"
import { NewEnvDialog } from "@/components/environments/new-env-dialog"
import { cn } from "@/lib/utils"

const PAGE_SIZES = [15, 30, 100]

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function UserCell({ name, date }: { name: string; date: Date }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
        SK
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-[450]">{name}</span>
        <span className="text-[11px] text-muted-foreground">{formatDate(date)}</span>
      </div>
    </div>
  )
}

export default function EnvironmentsPage() {
  const router = useRouter()
  const { environments, bannerDismissed, dismissBanner, addEnvironment, removeEnvironment } =
    useEnvironmentStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  const pageCount = Math.max(1, Math.ceil(environments.length / pageSize))
  const paginated = environments.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <TooltipProvider>
      <NewEnvDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={addEnvironment}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h1 className="text-[15px] font-semibold">Environments</h1>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Environment
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-4">
          {/* Info banner */}
          {!bannerDismissed && (
            <div className="flex items-start gap-3 rounded-xl border border-prune-borderGray px-4 py-3 relative">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-[500]">What are Environments?</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                  Manage variables like API keys and secrets across stages (Development, Staging,
                  Production). Assign an environment to any workflow from the toolbar to access
                  variables in your workflow.
                </p>
              </div>
              <button
                onClick={dismissBanner}
                className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Table */}
          <div className="flex flex-col flex-1 overflow-hidden rounded-xl border border-prune-borderGray">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Name
                      </div>
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Description
                      </div>
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
                        </svg>
                        Last Modified By
                      </div>
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
                        </svg>
                        Created By
                      </div>
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-[13px] text-muted-foreground">
                        No results.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((env) => (
                      <tr
                        key={env.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => router.push(`/dashboard/environments/${env.id}/variables` as any)}
                      >
                        <td className="px-4 py-3 font-[450]">{env.name}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[320px] truncate">
                          {env.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <UserCell name={env.modifiedBy} date={env.updatedAt} />
                        </td>
                        <td className="px-4 py-3">
                          <UserCell name={env.createdBy} date={env.createdAt} />
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
                                onClick={() => removeEnvironment(env.id)}
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
            <div className="flex items-center justify-between px-4 py-2.5 border-t text-[13px]">
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
      </div>
    </TooltipProvider>
  )
}
