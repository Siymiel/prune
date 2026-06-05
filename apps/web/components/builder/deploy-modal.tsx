"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Globe,
  MessageCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Rocket,
  Code2,
  LayoutTemplate,
  Webhook,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import { api, type DeploymentOut, type DeploymentType } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DeployModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  workflowName: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

type Tab = "publish" | "manage" | "whatsapp"

interface DeploymentTypeOption {
  id: DeploymentType
  label: string
  description: string
  icon: React.ReactNode
  urlPreview: (workflowId: string) => string
}

const DEPLOYMENT_TYPES: DeploymentTypeOption[] = [
  {
    id: "chat",
    label: "Chat Interface",
    description: "Conversational chat UI accessible via public URL",
    icon: <Globe className="h-4 w-4" />,
    urlPreview: (id) => `${APP_URL}/chat/${id}`,
  },
  {
    id: "form",
    label: "Form Interface",
    description: "Structured form UI for collecting input before running",
    icon: <LayoutTemplate className="h-4 w-4" />,
    urlPreview: (id) => `${APP_URL}/form/${id}`,
  },
  {
    id: "api",
    label: "REST API Endpoint",
    description: "Trigger workflow programmatically via HTTP POST",
    icon: <Webhook className="h-4 w-4" />,
    urlPreview: (id) => `${API_URL}/v1/run/${id}`,
  },
  {
    id: "widget",
    label: "Embedded Widget",
    description: "Embed this workflow into any website via script tag",
    icon: <Code2 className="h-4 w-4" />,
    urlPreview: (id) => `${APP_URL}/chat/${id}`,
  },
]

function statusBadge(status: string) {
  if (status === "active")
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />Active</span>
  if (status === "inactive")
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />Inactive</span>
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" />Archived</span>
}

export function DeployModal({ open, onOpenChange, workflowId, workflowName }: DeployModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("publish")
  const [copied, setCopied] = useState<string | null>(null)

  // Publish tab state
  const [selectedType, setSelectedType] = useState<DeploymentType>("chat")
  const [customSlug, setCustomSlug] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [latestDeployment, setLatestDeployment] = useState<DeploymentOut | null>(null)

  // Manage tab state
  const [deployments, setDeployments] = useState<DeploymentOut[]>([])
  const [loadingDeployments, setLoadingDeployments] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // WhatsApp tab state
  const [phoneNumberId, setPhoneNumberId] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [savingWa, setSavingWa] = useState(false)
  const [savedWa, setSavedWa] = useState(false)
  const [waError, setWaError] = useState<string | null>(null)

  const webhookUrl = `${API_URL}/v1/webhooks/whatsapp`

  const loadDeployments = useCallback(async () => {
    setLoadingDeployments(true)
    try {
      const data = await api.deployments.list({ workflow_id: workflowId })
      setDeployments(data)
    } catch {
      // silently fail — table will show empty
    } finally {
      setLoadingDeployments(false)
    }
  }, [workflowId])

  useEffect(() => {
    if (open && activeTab === "manage") loadDeployments()
  }, [open, activeTab, loadDeployments])

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const deployment = await api.deployments.publish({
        workflow_id: workflowId,
        deployment_type: selectedType,
        slug: customSlug.trim() || undefined,
      })
      setLatestDeployment(deployment)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Publishing failed")
    } finally {
      setPublishing(false)
    }
  }

  async function toggleDeploymentStatus(d: DeploymentOut) {
    setUpdatingId(d.id)
    try {
      const next = d.status === "active" ? "inactive" : "active"
      await api.deployments.update(d.id, { status: next })
      await loadDeployments()
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  async function archiveDeployment(d: DeploymentOut) {
    setUpdatingId(d.id)
    try {
      await api.deployments.archive(d.id)
      await loadDeployments()
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  async function deployWhatsApp() {
    if (!phoneNumberId.trim() || !phoneNumber.trim()) return
    setSavingWa(true)
    setWaError(null)
    try {
      await api.channels.create({
        workflow_id: workflowId,
        channel_type: "whatsapp",
        config: { phone_number_id: phoneNumberId.trim(), phone_number: phoneNumber.trim() },
      })
      setSavedWa(true)
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Failed to save channel")
    } finally {
      setSavingWa(false)
    }
  }

  const selectedTypeOption = DEPLOYMENT_TYPES.find((t) => t.id === selectedType)!
  const previewUrl = latestDeployment?.url ?? selectedTypeOption.urlPreview(workflowId)

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Deploy — {workflowName}</DialogTitle>
          </DialogHeader>

          {/* Tab bar */}
          <div className="flex gap-1 bg-prune-lightGray p-1 rounded-lg mt-1">
            {([
              { id: "publish" as Tab, label: "Publish" },
              { id: "manage" as Tab, label: "Manage" },
              { id: "whatsapp" as Tab, label: "WhatsApp" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                  activeTab === tab.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Publish tab ────────────────────────────────────────────────── */}
          {activeTab === "publish" && (
            <div className="mt-3 space-y-4">
              {latestDeployment ? (
                /* Success state */
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <p className="text-[13px] font-medium text-emerald-800">Published successfully</p>
                    </div>
                    <p className="text-[12px] text-emerald-700">
                      Version {latestDeployment.version_number} · {latestDeployment.deployment_type} deployment
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[12px] font-medium">Deployment URL</p>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={latestDeployment.url ?? previewUrl} className="text-[12px] font-mono h-8 bg-muted/40" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="shrink-0 h-8 gap-1.5 text-[12px]" onClick={() => copyText(latestDeployment.url ?? previewUrl, "url")}>
                            {copied === "url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied === "url" ? "Copied" : "Copy"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy deployment URL</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {latestDeployment.deployment_type !== "api" && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-[13px]" onClick={() => window.open(latestDeployment.url ?? previewUrl, "_blank")}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1.5 text-[13px] text-muted-foreground" onClick={() => { setLatestDeployment(null); setCustomSlug("") }}>
                      Deploy again
                    </Button>
                  </div>
                </div>
              ) : (
                /* Publish form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[12px] font-medium">Deployment type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEPLOYMENT_TYPES.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedType(opt.id)}
                          className={cn(
                            "flex items-start gap-2.5 p-3 rounded-lg border text-left transition-colors",
                            selectedType === opt.id
                              ? "border-primary bg-primary/5"
                              : "border-prune-borderGray hover:bg-prune-lightGray"
                          )}
                        >
                          <span className={cn("mt-0.5 shrink-0", selectedType === opt.id ? "text-primary" : "text-muted-foreground")}>
                            {opt.icon}
                          </span>
                          <span>
                            <span className="block text-[12px] font-[500]">{opt.label}</span>
                            <span className="block text-[11px] text-muted-foreground leading-snug mt-0.5">{opt.description}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[12px] font-medium">Slug <span className="text-muted-foreground font-normal">(optional — auto-generated from workflow name)</span></p>
                    <Input
                      placeholder={`e.g. ${workflowName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      className="text-[13px] h-8 font-mono"
                    />
                  </div>

                  <div className="rounded-lg bg-prune-lightGray px-3 py-2">
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{previewUrl}</p>
                  </div>

                  {publishError && (
                    <div className="flex items-center gap-2 text-[12px] text-destructive">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      {publishError}
                    </div>
                  )}

                  <Button size="sm" className="gap-1.5 text-[13px] w-full" onClick={handlePublish} disabled={publishing}>
                    {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                    {publishing ? "Publishing…" : "Publish workflow"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Manage tab ─────────────────────────────────────────────────── */}
          {activeTab === "manage" && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">Active deployments</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={loadDeployments} disabled={loadingDeployments}>
                      <RefreshCw className={cn("h-3.5 w-3.5", loadingDeployments && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </div>

              {loadingDeployments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : deployments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-prune-borderGray p-6 text-center">
                  <p className="text-[13px] text-muted-foreground">No deployments yet.</p>
                  <button className="mt-1 text-[12px] text-primary hover:underline inline-flex items-center gap-1" onClick={() => setActiveTab("publish")}>
                    Publish now <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {deployments.filter((d) => d.status !== "archived").map((d) => {
                    const typeOpt = DEPLOYMENT_TYPES.find((t) => t.id === d.deployment_type)
                    return (
                      <div key={d.id} className="rounded-lg border border-prune-borderGray p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-muted-foreground">{typeOpt?.icon}</span>
                              <span className="text-[13px] font-medium">{typeOpt?.label}</span>
                              {statusBadge(d.status)}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">{d.url}</p>
                            {d.version_number && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">Version {d.version_number} · {new Date(d.published_at ?? d.created_at).toLocaleDateString()}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={updatingId === d.id}
                                  onClick={() => toggleDeploymentStatus(d)}
                                >
                                  {updatingId === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : d.status === "active" ? "Pause" : "Resume"}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{d.status === "active" ? "Pause this deployment" : "Re-activate this deployment"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive" disabled={updatingId === d.id} onClick={() => archiveDeployment(d)}>
                                  Remove
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Archive deployment</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        {d.url && (
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 text-muted-foreground" onClick={() => copyText(d.url!, `copy-${d.id}`)}>
                                  {copied === `copy-${d.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                  Copy URL
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy deployment URL</TooltipContent>
                            </Tooltip>
                            {d.deployment_type !== "api" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 text-muted-foreground" onClick={() => window.open(d.url!, "_blank")}>
                                    <ExternalLink className="h-3 w-3" />
                                    Open
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open in new tab</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── WhatsApp tab ───────────────────────────────────────────────── */}
          {activeTab === "whatsapp" && (
            <div className="mt-3 space-y-4">
              {savedWa ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-[13px] text-emerald-800">
                  <p className="font-medium mb-1">WhatsApp channel connected!</p>
                  <p className="text-[12px] text-emerald-700">
                    Messages sent to your WhatsApp number will now trigger this workflow.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-muted-foreground">
                    Connect a Meta WhatsApp Business number to trigger this workflow on every inbound message.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-medium">Phone Number ID</p>
                      <Input placeholder="From Meta Business Settings" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="text-[13px] h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-medium">Display Number</p>
                      <Input placeholder="+254 700 000 000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="text-[13px] h-8" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[12px] font-medium text-muted-foreground">Webhook URL (paste into Meta Dashboard)</p>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={webhookUrl} className="text-[11px] font-mono h-8 bg-muted/40" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="shrink-0 h-8 gap-1.5 text-[12px]" onClick={() => copyText(webhookUrl, "webhook")}>
                            {copied === "webhook" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied === "webhook" ? "Copied" : "Copy"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy webhook URL</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {waError && <p className="text-[12px] text-destructive">{waError}</p>}

                  <Button
                    size="sm"
                    className={cn("gap-1.5 text-[13px]", (!phoneNumberId.trim() || !phoneNumber.trim()) && "opacity-50")}
                    disabled={!phoneNumberId.trim() || !phoneNumber.trim() || savingWa}
                    onClick={deployWhatsApp}
                  >
                    {savingWa && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save & connect
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
