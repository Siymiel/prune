"use client"

import { useRouter } from "next/navigation"
import { Folder, Settings, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { KnowledgeBase } from "@/lib/knowledge-store"

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(2)} KB`
}

interface Props {
  kb: KnowledgeBase
  onDelete: () => void
}

export function KnowledgeCard({ kb, onDelete }: Props) {
  const router = useRouter()
  const totalBytes = kb.documents.reduce((s, d) => s + d.sizeBytes, 0)
  const subtitle = kb.connection ? `Connected to ${kb.connection}` : "This knowledge base has no connection"

  return (
    <div
      className="relative rounded-xl border border-prune-borderGray bg-white hover:bg-prune-lightGray transition-colors p-4 cursor-pointer h-[160px] flex flex-col justify-between"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick={() => router.push(`/dashboard/knowledge/${kb.id}/documents` as any)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
            <Folder className="h-4 w-4 text-background" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-[500] leading-tight truncate">{kb.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{subtitle}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-[13px]">
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {totalBytes > 0 ? formatBytes(totalBytes) : "0 KB"}
      </p>
    </div>
  )
}
