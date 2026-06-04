"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function EvaluatePage() {
  const [query, setQuery] = useState("")
  const [hasResults, setHasResults] = useState(false)

  function handleExecute() {
    if (!query.trim()) return
    setHasResults(true)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-[15px] font-semibold">Evaluate Retrieval</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Configure your query for fetch results</p>
      </div>

      <div className="border border-prune-borderGray rounded-xl overflow-hidden">
        <Textarea
          placeholder="Search source text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-0 rounded-none resize-none min-h-[120px] text-[13px] focus-visible:ring-0"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleExecute()
          }}
        />
        <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/30">
          <Button variant="ghost" size="sm" className="text-[12px] h-7 text-muted-foreground">
            Advanced Settings
          </Button>
          <Button size="sm" className="text-[12px] h-7 gap-1.5" onClick={handleExecute} disabled={!query.trim()}>
            Execute
            <kbd className="ml-1 text-[10px] opacity-60">⌘↵</kbd>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-prune-borderGray p-8 flex flex-col items-center justify-center gap-2 text-center min-h-[180px]">
        {hasResults ? (
          <p className="text-[13px] text-muted-foreground">No indexed documents to search. Upload and index documents first.</p>
        ) : (
          <>
            <Search className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-[14px] font-medium">Search for something to see results</p>
            <p className="text-[12px] text-muted-foreground">
              Start by entering a search query above. Relevant knowledge base chunks matching your query will be displayed here.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
