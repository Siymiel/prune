"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreate: (name: string, description: string) => void
}

export function NewEnvDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  function handleCreate() {
    if (!name.trim()) return
    onCreate(name.trim(), description.trim())
    setName("")
    setDescription("")
    onOpenChange(false)
  }

  function handleClose() {
    setName("")
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">New Environment</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium">Environment Name</p>
            <Input
              placeholder="Finance Environment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-[13px]"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium">Environment Description</p>
            <Textarea
              placeholder="API keys and secrets for the finance team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px] resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} className="text-[13px]">
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim()} className="text-[13px]">
            Create Environment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
