"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, MessageCircle, Copy, Check, Loader2, ExternalLink } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface DeployModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  workflowName: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

type Tab = "web" | "whatsapp"

export function DeployModal({ open, onOpenChange, workflowId, workflowName }: DeployModalProps) {
  const chatUrl = `${APP_URL}/chat/${workflowId}`
  const webhookUrl = `${API_URL}/v1/webhooks/whatsapp`
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("web")

  // WhatsApp form
  const [phoneNumberId, setPhoneNumberId] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedChannel, setSavedChannel] = useState(false)
  const [waError, setWaError] = useState<string | null>(null)

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function deployWhatsApp() {
    if (!phoneNumberId.trim() || !phoneNumber.trim()) return
    setSaving(true)
    setWaError(null)
    try {
      await api.channels.create({
        workflow_id: workflowId,
        channel_type: "whatsapp",
        config: {
          phone_number_id: phoneNumberId.trim(),
          phone_number: phoneNumber.trim(),
        },
      })
      setSavedChannel(true)
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Failed to save channel")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Deploy — {workflowName}</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 bg-prune-lightGray p-1 rounded-lg mt-1">
          {(["web", "whatsapp"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                activeTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "web" ? <Globe className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
              {tab === "web" ? "Web Chat" : "WhatsApp"}
            </button>
          ))}
        </div>

        {/* Web Chat panel */}
        {activeTab === "web" && (
          <div className="mt-4 space-y-4">
            <p className="text-[13px] text-muted-foreground">
              Share this link to let anyone chat with this workflow. No login required.
            </p>

            <div className="space-y-1.5">
              <p className="text-[12px] font-medium">Chat URL</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={chatUrl}
                  className="text-[12px] font-mono h-8 bg-muted/40"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-8 gap-1.5 text-[12px]"
                  onClick={() => copyText(chatUrl, "chat")}
                >
                  {copied === "chat" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "chat" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[13px]"
              onClick={() => window.open(chatUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open chat
            </Button>
          </div>
        )}

        {/* WhatsApp panel */}
        {activeTab === "whatsapp" && (
          <div className="mt-4 space-y-4">
            {savedChannel ? (
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
                    <Input
                      placeholder="From Meta Business Settings"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      className="text-[13px] h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-medium">Display Number</p>
                    <Input
                      placeholder="+254 700 000 000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-[13px] h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[12px] font-medium text-muted-foreground">
                    Webhook URL (paste into Meta Dashboard)
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={webhookUrl}
                      className="text-[11px] font-mono h-8 bg-muted/40"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8 gap-1.5 text-[12px]"
                      onClick={() => copyText(webhookUrl, "webhook")}
                    >
                      {copied === "webhook" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === "webhook" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                {waError && <p className="text-[12px] text-destructive">{waError}</p>}

                <Button
                  size="sm"
                  className={cn("gap-1.5 text-[13px]", (!phoneNumberId.trim() || !phoneNumber.trim()) && "opacity-50")}
                  disabled={!phoneNumberId.trim() || !phoneNumber.trim() || saving}
                  onClick={deployWhatsApp}
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save & connect
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
