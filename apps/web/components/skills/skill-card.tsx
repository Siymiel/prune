"use client"

import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface Skill {
  id: string
  title: string
  description: string
  content: string
  updatedAt: Date
}

interface Props {
  skill: Skill
  onEdit: (skill: Skill) => void
  onDelete: (id: string) => void
}

export function SkillCard({ skill, onEdit, onDelete }: Props) {
  const updatedLabel = skill.updatedAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + " " + skill.updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  function copyToClipboard() {
    navigator.clipboard.writeText(skill.content)
  }

  return (
    <div className="rounded-xl shadow-md border border-prune-borderGray bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-[500] truncate">{skill.title}</p>
          {skill.description && (
            <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">
              {skill.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 text-[13px]">
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit(skill)}>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onDelete(skill.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg bg-prune-lightGray px-2 py-2 text-[14px] font-[450] text-muted-foreground line-clamp-2 min-h-[2.5rem]">
        {skill.content}
      </div>

      <div className="flex items-center justify-between mt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 font-[450] text-[12px]" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy prompt to clipboard</TooltipContent>
        </Tooltip>
        <span className="text-[12px] font-[450] text-muted-foreground">Last updated: {updatedLabel}</span>
      </div>
    </div>
  )
}
