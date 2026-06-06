"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, Loader2, Wrench, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { api, type HealResponse, type HealPatch } from "@/lib/api"

// ---------------------------------------------------------------------------
// Diff view — shows old vs new value for the patched field
// ---------------------------------------------------------------------------
function PatchDiff({ patch }: { patch: HealPatch }) {
  const [expanded, setExpanded] = useState(false)
  const OLD = patch.old_value || "(empty)"
  const NEW = patch.new_value || "(empty)"
  const shouldTruncate = OLD.length + NEW.length > 300

  const display = (v: string) =>
    shouldTruncate && !expanded ? v.slice(0, 120) + (v.length > 120 ? "…" : "") : v

  return (
    <div className="rounded-lg border border-prune-borderGray overflow-hidden text-[12px] font-mono">
      <div className="px-3 py-2 bg-red-50/60 border-b border-prune-borderGray flex gap-2">
        <span className="text-red-500 shrink-0 select-none">−</span>
        <span className="text-red-700 whitespace-pre-wrap break-all leading-relaxed">{display(OLD)}</span>
      </div>
      <div className="px-3 py-2 bg-emerald-50/60 flex gap-2">
        <span className="text-emerald-500 shrink-0 select-none">+</span>
        <span className="text-emerald-700 whitespace-pre-wrap break-all leading-relaxed">{display(NEW)}</span>
      </div>
      {shouldTruncate && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30 border-t border-prune-borderGray transition-colors"
        >
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show full diff</>}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// HealPanel — 4-state UI: idle / loading / healed / no_fix / error
// ---------------------------------------------------------------------------
type HealStage = "idle" | "loading" | "healed" | "no_fix" | "error"

interface Props {
  runId: string
  workflowId: string | null
}

export function HealPanel({ runId, workflowId }: Props) {
  const router = useRouter()
  const [stage, setStage] = useState<HealStage>("idle")
  const [result, setResult] = useState<HealResponse | null>(null)

  async function handleHeal() {
    setStage("loading")
    try {
      const res = await api.heal.run(runId)
      setResult(res)
      setStage(res.status === "healed" ? "healed" : res.status === "no_fix" ? "no_fix" : "error")
    } catch (err) {
      setResult({
        status: "error",
        diagnosis: err instanceof Error ? err.message : "Heal request failed",
        fix_description: "",
        patch: null,
        applied: false,
        test_run_id: null,
        workflow_updated: false,
      })
      setStage("error")
    }
  }

  // ---- idle ----------------------------------------------------------------
  if (stage === "idle") {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2 mt-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px] gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                onClick={handleHeal}
              >
                <Wrench className="h-3 w-3" />
                Self-Heal
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-center">
              Prune AI will analyze this failure and attempt to repair the workflow automatically.
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  // ---- loading -------------------------------------------------------------
  if (stage === "loading") {
    return (
      <div className="mt-3 rounded-xl border border-prune-borderGray bg-muted/20 px-4 py-4">
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-amber-500" />
          <div>
            <p className="font-medium text-foreground">Analyzing failure…</p>
            <p className="text-[12px] mt-0.5">Reading error trace, identifying root cause, generating fix</p>
          </div>
        </div>
      </div>
    )
  }

  // ---- error (heal service failed) ----------------------------------------
  if (stage === "error" && result) {
    return (
      <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-destructive">Heal service error</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{result.diagnosis}</p>
          </div>
        </div>
        <button
          onClick={() => setStage("idle")}
          className="mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Try again
        </button>
      </div>
    )
  }

  // ---- no_fix (human intervention required) --------------------------------
  if (stage === "no_fix" && result) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
        <div className="flex items-start gap-2.5 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-amber-800">Manual intervention required</p>
            <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">{result.diagnosis}</p>
            {result.fix_description && (
              <p className="text-[12px] text-amber-600 mt-1">{result.fix_description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workflowId && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px] gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => router.push(`/builder?workflowId=${workflowId}`)}
            >
              <ExternalLink className="h-3 w-3" />
              Open in Builder
            </Button>
          )}
          <button
            onClick={() => setStage("idle")}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // ---- healed (success) ----------------------------------------------------
  if (stage === "healed" && result) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">Workflow Healed</p>
            <p className="text-[12px] text-emerald-700 mt-0.5 leading-relaxed">{result.fix_description}</p>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-3 px-3 py-2.5 rounded-lg bg-white/70 border border-emerald-100">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Diagnosis</p>
          <p className="text-[12px] text-foreground leading-relaxed">{result.diagnosis}</p>
        </div>

        {/* Patch details */}
        {result.patch && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Fix Applied</p>
              <span className="text-[11px] text-muted-foreground">
                {result.patch.node_label}
                <span className="mx-1 text-muted-foreground/40">·</span>
                <span className="font-mono">{result.patch.field}</span>
              </span>
            </div>
            <PatchDiff patch={result.patch} />
          </div>
        )}

        {/* CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          {result.test_run_id && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px] gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              onClick={() => router.push(`/dashboard/runs`)}
            >
              <ExternalLink className="h-3 w-3" />
              View Test Run
            </Button>
          )}
          {workflowId && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px] gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              onClick={() => router.push(`/builder?workflowId=${workflowId}`)}
            >
              Open in Builder
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}
