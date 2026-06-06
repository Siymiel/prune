"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Workflow, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, type WorkflowReferenceOut } from "@/lib/api"

export default function ReferencesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [refs, setRefs] = useState<WorkflowReferenceOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.knowledgeBases.references(id)
      .then(setRefs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Deduplicate by workflow_id for the list display (a workflow may have multiple nodes using this KB)
  const byWorkflow = Object.values(
    refs.reduce<Record<string, { workflow_id: string; workflow_name: string; nodes: WorkflowReferenceOut[] }>>((acc, r) => {
      if (!acc[r.workflow_id]) acc[r.workflow_id] = { workflow_id: r.workflow_id, workflow_name: r.workflow_name, nodes: [] }
      acc[r.workflow_id].nodes.push(r)
      return acc
    }, {})
  )

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-[15px] font-semibold">Workflow References</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Workflows that are using this knowledge base.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-[13px]">Loading references…</span>
        </div>
      ) : byWorkflow.length === 0 ? (
        <div className="rounded-xl border border-prune-borderGray p-8 text-center text-[13px] text-muted-foreground">
          No workflows are referencing this knowledge base yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {byWorkflow.map((wf) => (
            <div key={wf.workflow_id} className="rounded-xl border border-prune-borderGray px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-[450] truncate">{wf.workflow_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {wf.nodes.length} node{wf.nodes.length !== 1 ? "s" : ""} referencing this KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[12px] gap-1.5 shrink-0 ml-4"
                  onClick={() => router.push(`/dashboard?workflow=${wf.workflow_id}` as never)}
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Button>
              </div>
              {wf.nodes.length > 1 && (
                <div className="mt-2.5 pl-10 flex flex-col gap-1">
                  {wf.nodes.map((n) => (
                    <div key={n.node_id} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span>{n.node_label}</span>
                      <span className="font-mono text-[10px] opacity-50">{n.node_id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
