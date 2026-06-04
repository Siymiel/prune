"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => void
}

export function NewKBDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("")

  function handleCreate() {
    if (!name.trim()) return
    onCreate(name.trim())
    setName("")
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) setName("")
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New Knowledge Base</DialogTitle>
          <DialogDescription>Enter a name for your new knowledge base.</DialogDescription>
        </DialogHeader>
        <div className="px-4 py-4">
          <Input
            autoFocus
            placeholder="Enter knowledge base name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
