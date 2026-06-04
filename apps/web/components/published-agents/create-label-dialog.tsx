"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreate: (name: string) => void
}

export function CreateLabelDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("")

  function handleCreate() {
    if (!name.trim()) return
    onCreate(name.trim())
    setName("")
    onOpenChange(false)
  }

  function handleClose() {
    setName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Create New Label</DialogTitle>
          <DialogDescription className="text-[13px]">
            Create a new label to organize your AI agents.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium">Label Name</p>
            <Input
              placeholder="e.g., Sales, HR, Marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="text-[13px]"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} className="text-[13px]">
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim()} className="text-[13px]">
            Create Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
