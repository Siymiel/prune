"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  BookOpen, RefreshCw, CheckCircle2, XCircle, Clock,
  Loader2, PlayCircle, ExternalLink, ChevronDown, ChevronUp, Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HealPanel } from "@/components/runs/heal-panel"
import { ExplainPanel } from "@/components/runs/explain-panel"

interface RunSummary {
  id: string
  workflow_id: string | null
  status: string
  started_at: string | null
  completed_at: string | null
  error: string | null
}

const STATUS_STYLES: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  done: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    cls: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    cls: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  error: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    cls: "text-red-600 bg-red-50 border-red-200",
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

type ActivePanel = "explain" | "heal"

function RunRow({
  run,
  activePanel,
  onToggle,
}: {
  run: RunSummary
  activePanel: ActivePanel | null
  onToggle: (panel: ActivePanel) => void
}) {
  const router = useRouter()
  const isFailed = run.status === "error" || run.status === "failed"
  const isFinished = isFailed || run.status === "done" || run.status === "completed"
  const s = STATUS_STYLES[run.status] ?? STATUS_STYLES.pending
  const expanded = activePanel !== null

  return (
    <>
      <tr className={cn(
        "border-b transition-colors",
        expanded ? "bg-muted/30" : "hover:bg-muted/20",
      )}>
        <td className="px-4 py-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
            s.cls,
          )}>
            {s.icon}
            {s.label}
          </span>
        </td>
        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
          {run.id.slice(0, 8)}…
        </td>
        <td className="px-4 py-3 text-[13px] text-muted-foreground">
          {fmtDate(run.started_at)}
        </td>
        <td className="px-4 py-3 text-[13px] text-muted-foreground">
          {duration(run.started_at, run.completed_at)}
        </td>
        <td className="px-4 py-3 max-w-[240px]">
          {run.error ? (
            <span className="text-[12px] text-red-500 truncate block">{run.error}</span>
          ) : (
            <span className="text-[12px] text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {/* Open workflow */}
            {run.workflow_id && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => router.push(`/builder?workflowId=${run.workflow_id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Open workflow</TooltipContent>
              </Tooltip>
            )}

            {/* Explain — available for any finished run */}
            {isFinished && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      activePanel === "explain"
                        ? "text-violet-600 bg-violet-50"
                        : "text-muted-foreground hover:text-violet-600 hover:bg-violet-50",
                    )}
                    onClick={() => onToggle("explain")}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {activePanel === "explain" ? "Hide execution story" : "Explain this run"}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Self-Heal — only for failed runs */}
            {isFailed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      activePanel === "heal"
                        ? "text-amber-600 bg-amber-50"
                        : "text-muted-foreground hover:text-amber-600 hover:bg-amber-50",
                    )}
                    onClick={() => onToggle("heal")}
                  >
                    {activePanel === "heal"
                      ? <ChevronUp className="h-3.5 w-3.5" />
                      : <Wrench className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {activePanel === "heal" ? "Hide self-heal" : "Self-Heal this run"}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Collapse chevron when a panel is open */}
            {expanded && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onToggle(activePanel!)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Collapse</TooltipContent>
              </Tooltip>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded panel row */}
      {expanded && (
        <tr className="border-b bg-muted/10">
          <td colSpan={6} className="px-5 pb-4 pt-1">
            {activePanel === "explain" && (
              <ExplainPanel runId={run.id} workflowId={run.workflow_id} />
            )}
            {activePanel === "heal" && (
              <HealPanel runId={run.id} workflowId={run.workflow_id} />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function RunsPage() {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedState, setExpandedState] = useState<{ runId: string; panel: ActivePanel } | null>(null)

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam =
        statusFilter === "failed" ? "error"
        : statusFilter === "completed" ? "done"
        : statusFilter !== "all" ? statusFilter
        : undefined
      const params = statusParam ? { status: statusParam } : undefined
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

  function handleToggle(runId: string, panel: ActivePanel) {
    setExpandedState((prev) =>
      prev?.runId === runId && prev?.panel === panel ? null : { runId, panel },
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col gap-4 p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight">Run History</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Past workflow executions</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={fetchRuns}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
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
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
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
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <RunRow
                    key={run.id}
                    run={run}
                    activePanel={
                      expandedState?.runId === run.id ? expandedState.panel : null
                    }
                    onToggle={(panel) => handleToggle(run.id, panel)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
