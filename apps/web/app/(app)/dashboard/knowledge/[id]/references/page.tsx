"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useKnowledgeStore } from "@/lib/knowledge-store"

export default function ReferencesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const kb = useKnowledgeStore((s) => s.bases.find((b) => b.id === id))

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-[15px] font-semibold">Workflow References</h2>
        <p className="text-[13px] text-muted-foreground mt-1">List of projects that are using this knowledge base</p>
      </div>

      {kb?.documents.length === 0 ? (
        <div className="rounded-xl border border-prune-borderGray p-8 text-center text-[13px] text-muted-foreground">
          No workflows are referencing this knowledge base yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-xl border border-prune-borderGray px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
                <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-[13px] font-[450]">{kb?.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => router.push("/dashboard")}
            >
              View Project
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
