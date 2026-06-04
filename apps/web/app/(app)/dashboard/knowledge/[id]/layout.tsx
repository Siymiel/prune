"use client"

import { use } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Folder, Pencil, FileText, Search, GitFork, Share2, MoreHorizontal, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useKnowledgeStore } from "@/lib/knowledge-store"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "Documents", path: "documents", icon: FileText },
  { label: "Evaluate", path: "evaluate", icon: Search },
  { label: "References", path: "references", icon: GitFork },
]

export default function KBDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const pathname = usePathname()
  const router = useRouter()
  const kb = useKnowledgeStore((s) => s.bases.find((b) => b.id === id))

  const activeTab = NAV.find((n) => pathname.endsWith(n.path))?.label ?? "Documents"

  if (!kb) {
    router.replace("/dashboard/knowledge")
    return null
  }

  return (
    <TooltipProvider>
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 border-r flex flex-col shrink-0">
          <div className="flex items-start justify-between p-4 border-b">
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Folder className="h-5 w-5 text-background" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
          </div>

          <div className="px-4 py-3 border-b">
            <p className="text-[13px] font-semibold leading-tight">{kb.name}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{kb.description}</p>
          </div>

          <nav className="p-2 flex flex-col gap-0.5">
            {NAV.map(({ label, path, icon: Icon }) => {
              const active = pathname.endsWith(path)
              return (
                <Link
                  key={path}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/dashboard/knowledge/${id}/${path}` as any}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b">
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Link href="/dashboard/knowledge" className="hover:text-foreground transition-colors">
                Knowledge Bases
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">{activeTab}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-[13px]">
                  <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
