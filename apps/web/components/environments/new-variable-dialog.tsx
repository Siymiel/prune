"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (data: { key: string; devValue: string; stagingValue: string; prodValue: string }) => void
}

function SecretInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] font-medium">
        {label} <span className="text-destructive">*</span>
      </p>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-[13px] pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

export function NewVariableDialog({ open, onOpenChange, onAdd }: Props) {
  const [key, setKey] = useState("")
  const [devValue, setDevValue] = useState("")
  const [stagingValue, setStagingValue] = useState("")
  const [prodValue, setProdValue] = useState("")

  function reset() {
    setKey("")
    setDevValue("")
    setStagingValue("")
    setProdValue("")
  }

  function handleAdd() {
    if (!key.trim()) return
    onAdd({ key: key.trim(), devValue, stagingValue, prodValue })
    reset()
    onOpenChange(false)
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  const valid = key.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">New Variable</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium">
              Variable Key <span className="text-destructive">*</span>
            </p>
            <Input
              placeholder="API_KEY"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="text-[13px] font-mono"
              autoFocus
            />
          </div>
          <SecretInput
            label="Development Value"
            placeholder="sk-dev-abc123"
            value={devValue}
            onChange={setDevValue}
          />
          <SecretInput
            label="Staging Value"
            placeholder="sk-stg-abc123"
            value={stagingValue}
            onChange={setStagingValue}
          />
          <SecretInput
            label="Production Value"
            placeholder="sk-prod-abc123"
            value={prodValue}
            onChange={setProdValue}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} className="text-[13px]">
            Cancel
          </Button>
          <Button size="sm" onClick={handleAdd} disabled={!valid} className="text-[13px]">
            Add Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
