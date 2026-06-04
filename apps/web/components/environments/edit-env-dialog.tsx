"use client"

import { useState, useEffect } from "react"
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
  initialName: string
  initialDescription: string
  onSave: (name: string, description: string) => void
}

export function EditEnvDialog({ open, onOpenChange, initialName, initialDescription, onSave }: Props) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setDescription(initialDescription)
    }
  }, [open, initialName, initialDescription])

  function handleSave() {
    if (!name.trim()) return
    onSave(name.trim(), description.trim())
    onOpenChange(false)
  }

  function handleClose() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Edit Environment</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium">Environment Name</p>
            <Input
              placeholder="Finance Environment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-[13px]"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
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
          <Button size="sm" onClick={handleSave} disabled={!name.trim()} className="text-[13px]">
            Update Environment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
