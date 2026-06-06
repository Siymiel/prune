"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, Bot, BrainCircuit, ChevronDown, ChevronUp,
  Clock, Code2, Database, ExternalLink, GitBranch,
  Loader2, MessageSquare, Play, Workflow, XCircle, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type StoryBeat, type ExplainResponse } from "@/lib/api"

// ---------------------------------------------------------------------------
// Icon + color palette per node category
// ---------------------------------------------------------------------------

type IconMeta = { icon: React.ReactNode; bg: string; border: string; text: string }

const ICON_META: Record<string, IconMeta> = {
  input:     { icon: <Play className="h-3.5 w-3.5" />,         bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-600"    },
  ai:        { icon: <Bot className="h-3.5 w-3.5" />,          bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-600"  },
  logic:     { icon: <GitBranch className="h-3.5 w-3.5" />,    bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-600"   },
  output:    { icon: <MessageSquare className="h-3.5 w-3.5" />, bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-600" },
  action:    { icon: <Zap className="h-3.5 w-3.5" />,           bg: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-600"    },
  knowledge: { icon: <Database className="h-3.5 w-3.5" />,     bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-600"  },
  flow:      { icon: <Workflow className="h-3.5 w-3.5" />,      bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-600"    },
  unknown:   { icon: <Code2 className="h-3.5 w-3.5" />,         bg: "bg-muted",      border: "border-border",     text: "text-muted-foreground" },
}

const AI_REPLY_SKIP_KEYS = new Set(["reply", "message", "response", "text"])

// ---------------------------------------------------------------------------
// BeatCard — one step in the execution story
// ---------------------------------------------------------------------------

function BeatCard({ beat, isLast }: { beat: StoryBeat; isLast: boolean }) {
  const [aiExpanded, setAiExpanded] = useState(false)
  const meta = ICON_META[beat.icon_type] ?? ICON_META.unknown
  const isFailed = beat.status === "error"

  const extraOutputs = Object.entries(beat.key_outputs).filter(
    ([k]) => !AI_REPLY_SKIP_KEYS.has(k),
  )

  return (
    <div className="flex gap-3">
      {/* Left connector column */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
            isFailed
              ? "bg-red-50 border-red-300 text-red-600"
              : `${meta.bg} ${meta.border} ${meta.text}`,
          )}
        >
          {isFailed ? <XCircle className="h-3.5 w-3.5" /> : meta.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[12px]" />}
      </div>

      {/* Step content */}
      <div className={cn("flex-1 min-w-0", isLast ? "pb-1" : "pb-4")}>
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[13px] font-semibold text-foreground">{beat.node_label}</span>
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded border",
              isFailed
                ? "bg-red-50 border-red-200 text-red-600"
                : `${meta.bg} ${meta.border} ${meta.text}`,
            )}
          >
            {beat.node_kind}
          </span>
          {beat.duration_ms > 0 && (
            <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              {beat.duration_ms < 1000
                ? `${beat.duration_ms}ms`
                : `${(beat.duration_ms / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>

        {/* One-line summary */}
        <p className="text-[13px] text-muted-foreground mb-2 leading-relaxed">
          {beat.summary}
        </p>

        {/* Error callout */}
        {isFailed && beat.error && (
          <div className="mb-2 flex items-start gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 font-mono leading-relaxed break-all">
              {beat.error}
            </p>
          </div>
        )}

        {/* Key output chips (non-AI nodes) */}
        {!beat.ai_reply && Object.keys(beat.key_outputs).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Object.entries(beat.key_outputs).map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px]"
              >
                <span className="text-muted-foreground font-medium">{k}:</span>
                <span className="font-mono text-foreground truncate max-w-[180px]">{v}</span>
              </span>
            ))}
          </div>
        )}

        {/* AI reply box */}
        {beat.ai_reply && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/40 overflow-hidden mb-2">
            <div
              className={cn(
                "px-3 py-2 text-[12px] text-violet-900 leading-relaxed whitespace-pre-wrap",
                !aiExpanded && "line-clamp-3",
              )}
            >
              {beat.ai_reply}
            </div>
            {beat.ai_reply.length > 180 && (
              <button
                onClick={() => setAiExpanded((v) => !v)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-violet-600 hover:bg-violet-100/60 border-t border-violet-200 transition-colors"
              >
                {aiExpanded ? (
                  <><ChevronUp className="h-3 w-3" /> Show less</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> Show full response</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Extra output chips for AI nodes (everything except the reply itself) */}
        {beat.ai_reply && extraOutputs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {extraOutputs.map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px]"
              >
                <span className="text-muted-foreground font-medium">{k}:</span>
                <span className="font-mono text-foreground truncate max-w-[180px]">{v}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExplainPanel
// ---------------------------------------------------------------------------

interface Props {
  runId: string
  workflowId: string | null
}

export function ExplainPanel({ runId, workflowId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ExplainResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setFetchError(null)
    api.runs
      .explain(runId)
      .then(setData)
      .catch((e: unknown) => setFetchError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [runId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-[13px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading execution story…
      </div>
    )
  }

  if (fetchError || !data) {
    return (
      <div className="flex items-center gap-2 py-3 text-[13px] text-destructive">
        <XCircle className="h-4 w-4" />
        {fetchError ?? "Failed to load execution story"}
      </div>
    )
  }

  const totalMs = data.beats.reduce((sum, b) => sum + b.duration_ms, 0)
  const hasFailure = data.status === "error"

  return (
    <div className="mt-3 rounded-xl border border-prune-borderGray bg-white/60 p-4">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-violet-500" />
          <span className="text-[13px] font-semibold">Execution Story</span>
          <span className="text-[12px] text-muted-foreground">· {data.workflow_name}</span>
        </div>
        <div className="flex items-center gap-2">
          {totalMs > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {totalMs < 1000 ? `${totalMs}ms total` : `${(totalMs / 1000).toFixed(1)}s total`}
            </span>
          )}
          <span
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border",
              hasFailure
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-emerald-50 border-emerald-200 text-emerald-600",
            )}
          >
            {hasFailure ? "Failed" : "Completed"}
          </span>
          {workflowId && (
            <button
              onClick={() => router.push(`/builder?workflowId=${workflowId}`)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open in Builder
            </button>
          )}
        </div>
      </div>

      {/* Beat timeline */}
      {data.beats.length === 0 ? (
        <p className="text-[13px] text-muted-foreground text-center py-4">
          No steps were recorded for this run.
        </p>
      ) : (
        <div>
          {data.beats.map((beat, idx) => (
            <BeatCard
              key={`${beat.node_id}-${idx}`}
              beat={beat}
              isLast={idx === data.beats.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
