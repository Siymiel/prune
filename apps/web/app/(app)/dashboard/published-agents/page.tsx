"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Globe,
  Webhook,
  LayoutTemplate,
  Code2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  XCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, type DeploymentOut, type DeploymentType } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type FilterStatus = "all" | "active" | "inactive"

const TYPE_META: Record<DeploymentType, { label: string; icon: React.ReactNode }> = {
  chat:   { label: "Chat Interface",    icon: <Globe className="h-3.5 w-3.5" /> },
  form:   { label: "Form Interface",    icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
  api:    { label: "REST API Endpoint", icon: <Webhook className="h-3.5 w-3.5" /> },
  widget: { label: "Embedded Widget",   icon: <Code2 className="h-3.5 w-3.5" /> },
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active")
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />Active</span>
  if (status === "inactive")
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />Paused</span>
  return null
}

export default function PublishedAgentsPage() {
  const [deployments, setDeployments] = useState<DeploymentOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [copied, setCopied] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.deployments.list()
      setDeployments(data.filter((d) => d.status !== "archived"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deployments")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function toggleStatus(d: DeploymentOut) {
    setUpdatingId(d.id)
    try {
      const next = d.status === "active" ? "inactive" : "active"
      await api.deployments.update(d.id, { status: next })
      await load()
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  async function archiveDeployment(d: DeploymentOut) {
    if (!confirm(`Archive "${d.slug}"? This will remove it from this list.`)) return
    setUpdatingId(d.id)
    try {
      await api.deployments.archive(d.id)
      await load()
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = deployments.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false
    if (search && !d.slug.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
          <div>
            <h1 className="text-[15px] font-semibold">Published Agents</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">All live deployments across your workflows</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-[13px] h-8" onClick={load} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload deployments</TooltipContent>
          </Tooltip>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b bg-background shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-[13px] h-8"
            />
          </div>
          <div className="flex items-center gap-0.5 bg-prune-lightGray p-0.5 rounded-lg">
            {(["all", "active", "inactive"] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-2.5 py-1 text-[12px] font-medium rounded-md capitalize transition-colors",
                  filterStatus === s ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "all" ? "All" : s === "active" ? "Active" : "Paused"}
              </button>
            ))}
          </div>
          <span className="text-[12px] text-muted-foreground ml-auto">{filtered.length} deployment{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-[13px] text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-2 text-[12px]" onClick={load}>Try again</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="h-10 w-10 rounded-full bg-prune-lightGray flex items-center justify-center">
                <Rocket className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[14px] font-medium">{deployments.length === 0 ? "No deployments yet" : "No results"}</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {deployments.length === 0
                    ? "Open a workflow in the builder and click Deploy to publish it."
                    : "Try adjusting your search or filter."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => {
                const meta = TYPE_META[d.deployment_type as DeploymentType] ?? TYPE_META.chat
                return (
                  <div key={d.id} className="rounded-xl border border-prune-borderGray bg-background p-4 space-y-3 hover:shadow-sm transition-shadow">
                    {/* Type + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {meta.icon}
                        <span className="text-[12px] font-medium text-foreground">{meta.label}</span>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>

                    {/* Slug + version */}
                    <div>
                      <p className="text-[13px] font-[500] font-mono truncate">{d.slug}</p>
                      {d.version_number != null && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          v{d.version_number} · {new Date(d.published_at ?? d.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* URL pill */}
                    {d.url && (
                      <p className="text-[11px] text-muted-foreground font-mono truncate bg-prune-lightGray rounded px-2 py-1">{d.url}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-1 border-t border-prune-borderGray">
                      {d.url && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-[11px] text-muted-foreground" onClick={() => copyText(d.url!, `copy-${d.id}`)}>
                                {copied === `copy-${d.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                Copy
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy URL</TooltipContent>
                          </Tooltip>
                          {d.deployment_type !== "api" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-[11px] text-muted-foreground" onClick={() => window.open(d.url!, "_blank")}>
                                  <ExternalLink className="h-3 w-3" />
                                  Open
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open in new tab</TooltipContent>
                            </Tooltip>
                          )}
                        </>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground"
                              disabled={updatingId === d.id}
                              onClick={() => toggleStatus(d)}
                            >
                              {updatingId === d.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : d.status === "active"
                                ? <PauseCircle className="h-3.5 w-3.5" />
                                : <PlayCircle className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{d.status === "active" ? "Pause deployment" : "Resume deployment"}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              disabled={updatingId === d.id}
                              onClick={() => archiveDeployment(d)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Archive deployment</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
