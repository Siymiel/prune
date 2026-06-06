"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight, CheckCircle2, Circle, ExternalLink, Loader2,
  RefreshCw, Sparkles, Wand2,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { api, type GoalGenerateResponse, type GoalNodeSummary } from "@/lib/api"
import { getNodeDef, type NodeKind } from "@/lib/editor-nodes"

// ---------------------------------------------------------------------------
// Example goals
// ---------------------------------------------------------------------------
const EXAMPLES = [
  "When a customer submits a tender document, analyze it, create a compliance report, and notify procurement via Slack",
  "Every morning, summarize overnight support tickets and email the team lead",
  "When a webhook arrives with order data, extract key details and log them to a Google Sheet via Drive",
  "Answer customer WhatsApp questions using our product knowledge base",
  "When a new file is uploaded, extract text, classify it, and save the summary",
]

// ---------------------------------------------------------------------------
// Generating animation steps
// ---------------------------------------------------------------------------
const STEPS = [
  "Analyzing your goal",
  "Designing the workflow",
  "Building nodes and connections",
  "Saving to your workspace",
]

type Stage = "input" | "generating" | "result"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (workflowId: string) => void
}

// ---------------------------------------------------------------------------
// Node kind icon chip
// ---------------------------------------------------------------------------
function NodeChip({ node }: { node: GoalNodeSummary }) {
  const def = getNodeDef(node.kind as NodeKind)
  const Icon = def?.icon

  const bgMap: Record<string, string> = {
    inputs: "bg-blue-50 border-blue-100",
    outputs: "bg-emerald-50 border-emerald-100",
    core: "bg-violet-50 border-violet-100",
    apps: "bg-amber-50 border-amber-100",
    logic: "bg-rose-50 border-rose-100",
    utils: "bg-gray-50 border-gray-100",
  }
  const iconColorMap: Record<string, string> = {
    inputs: "text-blue-500",
    outputs: "text-emerald-500",
    core: "text-violet-500",
    apps: "text-amber-600",
    logic: "text-rose-500",
    utils: "text-gray-500",
  }
  const category = def?.category ?? "utils"
  const bgClass = bgMap[category] ?? "bg-gray-50 border-gray-100"
  const iconClass = iconColorMap[category] ?? "text-gray-500"

  return (
    <div className={cn("rounded-xl border px-3 py-2.5 flex items-start gap-2.5 min-w-0", bgClass)}>
      {Icon && (
        <div className={cn("mt-0.5 shrink-0", iconClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[12px] font-[500] leading-tight truncate">{node.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{node.role}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------
export function GoalDialog({ open, onOpenChange, onCreated }: Props) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>("input")
  const [goal, setGoal] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GoalGenerateResponse | null>(null)
  const [stepsDone, setStepsDone] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const stepsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function resetDialog() {
    setStage("input")
    setGoal("")
    setError(null)
    setResult(null)
    setStepsDone(0)
    if (stepsIntervalRef.current) clearInterval(stepsIntervalRef.current)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetDialog()
    onOpenChange(next)
  }

  useEffect(() => {
    if (open && stage === "input") {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open, stage])

  async function handleGenerate() {
    if (!goal.trim() || stage !== "input") return
    setError(null)
    setStage("generating")
    setStepsDone(0)

    // Animate through the first 3 steps while waiting for the API
    let step = 0
    stepsIntervalRef.current = setInterval(() => {
      step += 1
      if (step < STEPS.length - 1) {
        setStepsDone(step)
      } else {
        if (stepsIntervalRef.current) clearInterval(stepsIntervalRef.current)
      }
    }, 900)

    try {
      const res = await api.goals.generate(goal.trim())
      if (stepsIntervalRef.current) clearInterval(stepsIntervalRef.current)
      setStepsDone(STEPS.length)
      setResult(res)
      setStage("result")
      onCreated?.(res.workflow_id)
    } catch (err) {
      if (stepsIntervalRef.current) clearInterval(stepsIntervalRef.current)
      setStage("input")
      setError(err instanceof Error ? err.message : "Failed to generate workflow")
    }
  }

  function handleOpenBuilder() {
    if (!result) return
    router.push(`/builder?workflowId=${result.workflow_id}`)
    handleOpenChange(false)
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            "p-0 gap-0 overflow-hidden transition-all duration-300",
            stage === "result" ? "sm:max-w-2xl" : "sm:max-w-xl",
          )}
        >
          <DialogTitle className="sr-only">Generate Workflow from Goal</DialogTitle>
          {/* ---------------------------------------------------------------- */}
          {/* Stage: input                                                      */}
          {/* ---------------------------------------------------------------- */}
          {stage === "input" && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-background" />
                  </div>
                  <h2 className="text-[15px] font-semibold">Generate from Goal</h2>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Describe what you want to automate in plain language. Prune AI will design and build the workflow for you.
                </p>
              </div>

              {/* Textarea */}
              <div className="px-6">
                <Textarea
                  ref={textareaRef}
                  placeholder="e.g. When a customer submits a tender document, analyze it, create a compliance report, and notify procurement via Slack"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate()
                  }}
                  className="min-h-[120px] text-[13px] resize-none rounded-xl border-prune-borderGray focus-visible:ring-1"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="px-6 mt-2 text-[12px] text-destructive">{error}</p>
              )}

              {/* Example pills */}
              <div className="px-6 mt-3">
                <p className="text-[11px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">Examples</p>
                <div className="flex flex-col gap-1.5">
                  {EXAMPLES.slice(0, 3).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setGoal(ex)}
                      className="text-left text-[12px] text-muted-foreground hover:text-foreground border border-prune-borderGray rounded-lg px-3 py-2 hover:bg-prune-lightGray transition-colors leading-snug"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 mt-2 flex items-center justify-between border-t">
                <span className="text-[11px] text-muted-foreground">
                  <kbd className="font-mono">⌘↵</kbd> to generate
                </span>
                <Button
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={handleGenerate}
                  disabled={!goal.trim()}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Generate Workflow
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Stage: generating                                                 */}
          {/* ---------------------------------------------------------------- */}
          {stage === "generating" && (
            <div className="px-8 py-10 flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-foreground flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-background animate-pulse" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold">Building your workflow…</h2>
                  <p className="text-[13px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    Prune AI is analyzing your goal and designing a complete workflow.
                  </p>
                </div>
              </div>

              <div className="w-full max-w-xs flex flex-col gap-3">
                {STEPS.map((step, i) => {
                  const done = i < stepsDone
                  const active = i === stepsDone && stepsDone < STEPS.length
                  return (
                    <div key={step} className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 text-foreground animate-spin shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-[13px] transition-colors",
                          done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground/50",
                        )}
                      >
                        {step}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Stage: result                                                     */}
          {/* ---------------------------------------------------------------- */}
          {stage === "result" && result && (
            <div className="flex flex-col">
              {/* Success header */}
              <div className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold truncate">{result.workflow_name}</h2>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {result.nodes_summary.length} node{result.nodes_summary.length !== 1 ? "s" : ""} · Ready to open in Builder
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={resetDialog}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start over</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Explanation bullets */}
              {result.explanation.length > 0 && (
                <div className="px-6 py-4 border-b">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">What was built</p>
                  <ul className="flex flex-col gap-1.5">
                    {result.explanation.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Node grid */}
              <div className="px-6 py-4 border-b">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Nodes</p>
                <div className="grid grid-cols-2 gap-2">
                  {result.nodes_summary.map((node, i) => (
                    <NodeChip key={i} node={node} />
                  ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="px-6 py-4 flex items-center justify-between">
                <button
                  onClick={resetDialog}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Try a different goal
                </button>
                <Button
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={handleOpenBuilder}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Builder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
