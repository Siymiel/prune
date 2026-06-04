"use client"

import { use, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Globe, Pencil, KeyRound, Shield, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEnvironmentStore } from "@/lib/environment-store"
import { EditEnvDialog } from "@/components/environments/edit-env-dialog"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "Variables", path: "variables", icon: KeyRound },
  { label: "Permissions", path: "permissions", icon: Shield },
]

export default function EnvironmentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const pathname = usePathname()
  const router = useRouter()
  const env = useEnvironmentStore((s) => s.environments.find((e) => e.id === id))
  const updateEnvironment = useEnvironmentStore((s) => s.updateEnvironment)
  const [editOpen, setEditOpen] = useState(false)

  const activeLabel = NAV.find((n) => pathname.endsWith(n.path))?.label ?? "Variables"

  if (!env) {
    router.replace("/dashboard/environments")
    return null
  }

  return (
    <TooltipProvider>
      <EditEnvDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialName={env.name}
        initialDescription={env.description}
        onSave={(name, description) => updateEnvironment(id, name, description)}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 border-r flex flex-col shrink-0">
          <div className="flex items-start justify-between p-4 border-b">
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-background" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
          </div>

          <div className="px-4 py-3 border-b">
            <p className="text-[13px] font-semibold leading-tight">{env.name}</p>
            {env.description && (
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {env.description}
              </p>
            )}
          </div>

          <nav className="p-2 flex flex-col gap-0.5">
            {NAV.map(({ label, path, icon: Icon }) => {
              const active = pathname.endsWith(path)
              return (
                <Link
                  key={path}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/dashboard/environments/${id}/${path}` as any}
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
          {/* Breadcrumb */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b">
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <Link href="/dashboard/environments" className="hover:text-foreground transition-colors">
                Environments
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">{env.name}</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
