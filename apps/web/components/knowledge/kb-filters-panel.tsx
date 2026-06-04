"use client"

import { useEffect, useRef, useState } from "react"
import { SlidersHorizontal, Database, Plug, Calendar, Clock, Clipboard, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export function KBFiltersPanel() {
  const [open, setOpen] = useState(false)
  const [showEmpty, setShowEmpty] = useState(true)
  const [showNonEmpty, setShowNonEmpty] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => setOpen((v) => !v)}>
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-background border border-prune-borderGray rounded-xl shadow-lg z-50 py-3">
          <p className="px-4 pb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Filter By</p>

          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-[13px]">Show empty KBs</span>
            <Switch checked={showEmpty} onCheckedChange={setShowEmpty} />
          </div>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-[13px]">Show non-empty KBs</span>
            <Switch checked={showNonEmpty} onCheckedChange={setShowNonEmpty} />
          </div>

          <div className="my-2 h-px bg-border" />

          {[
            { icon: Database, label: "Size" },
            { icon: Plug, label: "Connection" },
            { icon: Calendar, label: "Created at" },
            { icon: Clock, label: "Last modified at" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-prune-lightGray transition-colors text-left"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {label}
            </button>
          ))}

          <div className="my-2 h-px bg-border" />

          <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-prune-lightGray transition-colors text-left">
            <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
            Copy URL
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-prune-lightGray transition-colors text-left text-destructive">
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
