"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api, type KnowledgeBaseOut } from "@/lib/api"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (kb: KnowledgeBaseOut) => void
}

export function NewKBDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const kb = await api.knowledgeBases.create(name.trim(), description.trim() || undefined)
      onCreated(kb)
      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create knowledge base")
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("")
      setDescription("")
      setError(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New Knowledge Base</DialogTitle>
          <DialogDescription>
            Give your knowledge base a name and optional description.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 py-4 flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="Knowledge base name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          {error && (
            <p className="text-[12px] text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
