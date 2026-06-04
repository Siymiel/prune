"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface SkillFormData {
  title: string
  description: string
  content: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: SkillFormData) => void
}

export function NewSkillDialog({ open, onOpenChange, onCreate }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")

  function handleCreate() {
    if (!title.trim() || !content.trim()) return
    onCreate({ title: title.trim(), description: description.trim(), content: content.trim() })
    setTitle("")
    setDescription("")
    setContent("")
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle("")
      setDescription("")
      setContent("")
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Prompt</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Prompt Content <span className="text-destructive">*</span>
            </label>
            <Textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
