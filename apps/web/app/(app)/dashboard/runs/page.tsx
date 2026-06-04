"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, PlayCircle } from "lucide-react"

interface RunSummary {
  id: string
  workflow_id: string | null
  status: string
  started_at: string | null
  completed_at: string | null
  error: string | null
}

const STATUS_STYLES: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    cls: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    cls: "text-red-600 bg-red-50 border-red-200",
  },
  running: {
    label: "Running",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    cls: "text-blue-600 bg-blue-50 border-blue-200",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    cls: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
}

function duration(start: string | null, end: string | null): string {
  if (!start) return "—"
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function RunsPage() {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined
      const data = await api.runs.list(params)
      setRuns(data)
    } catch {
      setRuns([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchRuns() }, [fetchRuns])

  const statuses = ["all", "running", "completed", "failed", "pending"]

  return (
    <div className="flex flex-1 flex-col gap-4 p-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Run History</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Past workflow executions</p>
        </div>
        <button
          onClick={fetchRuns}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1 text-[12px] font-medium rounded-full border transition-colors capitalize",
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Run list */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 h-64 rounded-lg border bg-muted/30">
          <PlayCircle className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-[14px] font-medium">No runs found</p>
          <p className="text-[13px] text-muted-foreground">Run a workflow to see execution history here.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Run ID</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Started</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => {
                const s = STATUS_STYLES[run.status] ?? STATUS_STYLES.pending
                return (
                  <tr key={run.id} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border", s.cls)}>
                        {s.icon}
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {run.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(run.started_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {duration(run.started_at, run.completed_at)}
                    </td>
                    <td className="px-4 py-3 text-red-500 max-w-xs truncate">
                      {run.error ?? "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
