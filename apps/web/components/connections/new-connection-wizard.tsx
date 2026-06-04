"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, Key, CheckCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PROVIDERS, type Provider, type Connection } from "./provider-data"
import { useAuthStore } from "@/lib/auth-store"

type Step = "pick" | "detail" | "create"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (connection: Connection) => void
}

function ProviderAvatar({ provider, size = "md" }: { provider: Provider; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-8 w-8 text-[12px]" : "h-10 w-10 text-[14px]"
  return (
    <div
      className={`${cls} rounded-lg flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: provider.color }}
    >
      {provider.name[0]}
    </div>
  )
}

export function NewConnectionWizard({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuthStore()
  const [step, setStep] = useState<Step>("pick")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Provider | null>(null)
  const [connectorName, setConnectorName] = useState("")

  const filtered = useMemo(
    () => PROVIDERS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  function reset() {
    setStep("pick")
    setSearch("")
    setSelected(null)
    setConnectorName("")
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function selectProvider(p: Provider) {
    setSelected(p)
    setConnectorName(`${p.name} Connector`)
    setStep("detail")
  }

  function handleCreate() {
    if (!selected || !connectorName.trim()) return
    onCreated({
      id: crypto.randomUUID(),
      provider: selected,
      connectionName: connectorName.trim(),
      createdBy: user?.email?.split("@")[0] ?? "You",
      createdAt: new Date(),
      generalAccess: "Private",
      testStatus: "untested",
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={step === "pick" ? "sm:max-w-2xl p-0" : "sm:max-w-md p-0"}>
        {step === "pick" && (
          <div className="flex flex-col max-h-[600px]">
            <div className="px-5 pt-5 pb-4 border-b">
              <h2 className="text-[15px] font-semibold mb-3">New Connection</h2>
              <div className="relative">
                <Input
                  autoFocus
                  placeholder="Search for a connection"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProvider(p)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-prune-borderGray hover:bg-prune-lightGray transition-colors text-left"
                  >
                    <ProviderAvatar provider={p} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-[500] truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        By PruneAI <CheckCircle className="h-2.5 w-2.5 text-blue-500" />
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "detail" && selected && (
          <div className="p-6 flex flex-col gap-5">
            <button onClick={() => setStep("pick")} className="absolute left-4 top-4 p-1 rounded-md hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex justify-center gap-3 pt-4">
              <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-[18px]">P</div>
              <div className="flex items-center gap-1 text-muted-foreground/40">
                {[...Array(5)].map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-current" />)}
              </div>
              <div className="h-14 w-14 rounded-xl border border-prune-borderGray flex items-center justify-center" style={{ backgroundColor: `${selected.color}18` }}>
                <span className="text-[22px] font-bold" style={{ color: selected.color }}>{selected.name[0]}</span>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-[15px] font-semibold">Connect PruneAI to {selected.name}</h3>
              <p className="text-[13px] text-muted-foreground mt-1">Choose how you&apos;d like to connect your {selected.name} workspace to PruneAI.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-medium">Available Connectors</p>
                <button className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">Manage connectors ↗</button>
              </div>
              <div className="rounded-xl border border-prune-borderGray px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Key className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-[500]">{selected.name}</p>
                  <p className="text-[11px] text-muted-foreground">{selected.authType} Connection</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    {selected.actionsCount} actions enabled
                  </span>
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Button onClick={() => setStep("create")} className="w-full" variant="outline">
              Create Connector
            </Button>
            <button className="text-[12px] text-muted-foreground hover:text-foreground text-center -mt-3">
              View documentation ↗
            </button>
          </div>
        )}

        {step === "create" && selected && (
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ProviderAvatar provider={selected} size="sm" />
              <h3 className="text-[15px] font-semibold">New Connector</h3>
            </div>
            <div className="rounded-xl border border-prune-borderGray px-4 py-3 flex items-center gap-3">
              <input type="radio" defaultChecked readOnly className="accent-primary shrink-0" />
              <span className="flex-1 text-[13px] font-[450]">{selected.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">{selected.authType}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">
                Connector Name <span className="text-destructive">*</span>
              </label>
              <Input
                autoFocus
                value={connectorName}
                onChange={(e) => setConnectorName(e.target.value)}
                placeholder={`${selected.name} Connector`}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setStep("detail")}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!connectorName.trim()}>Create Connector</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
