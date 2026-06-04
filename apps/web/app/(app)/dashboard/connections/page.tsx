"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NewConnectionWizard } from "@/components/connections/new-connection-wizard"
import { ConnectionsTable } from "@/components/connections/connections-table"
import type { Connection } from "@/components/connections/provider-data"

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [wizardOpen, setWizardOpen] = useState(false)

  function handleCreated(conn: Connection) {
    setConnections((prev) => [conn, ...prev])
  }

  function handleTest(id: string) {
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, testStatus: "success" } : c)),
    )
  }

  return (
    <TooltipProvider>
      <NewConnectionWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={handleCreated} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h1 className="text-[15px] font-semibold">Connections</h1>
          <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            New Connection
          </Button>
        </div>

        <ConnectionsTable connections={connections} onTest={handleTest} />
      </div>
    </TooltipProvider>
  )
}
