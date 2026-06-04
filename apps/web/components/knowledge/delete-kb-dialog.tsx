"use client"

import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  kbName: string
  onConfirm: () => void
}

export function DeleteKBDialog({ open, onOpenChange, kbName, onConfirm }: Props) {
  const [value, setValue] = useState("")

  function handleOpenChange(next: boolean) {
    if (!next) setValue("")
    onOpenChange(next)
  }

  function handleDelete() {
    onConfirm()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-destructive shrink-0" />
            Delete Knowledge Base
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this knowledge base? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 py-4 flex flex-col gap-3">
          <p className="text-[13px] font-semibold">{kbName}</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-muted-foreground">Type delete to confirm deletion:</label>
            <Input
              autoFocus
              placeholder="delete"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && value === "delete" && handleDelete()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={value !== "delete"}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
