"use client"

import { use, useState } from "react"
import { Search, Loader2, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { api, type KnowledgeChunkResult } from "@/lib/api"

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    pct >= 80 ? "bg-emerald-100 text-emerald-700" :
    pct >= 60 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700"
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums", color)}>
      {pct}%
    </span>
  )
}

function ChunkCard({ chunk, index }: { chunk: KnowledgeChunkResult; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const preview = chunk.text.slice(0, 220)
  const isTruncated = chunk.text.length > 220

  return (
    <div className="border border-prune-borderGray rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">#{index + 1}</span>
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[13px] font-[450] truncate">{chunk.filename}</span>
          <span className="text-[11px] text-muted-foreground shrink-0">chunk {chunk.chunk_index}</span>
        </div>
        <ScoreBadge score={chunk.score} />
      </div>

      {chunk.summary && (
        <div className="px-4 py-2.5 border-t bg-blue-50/50">
          <p className="text-[11px] font-semibold text-blue-600 mb-1 uppercase tracking-wide">Summary</p>
          <p className="text-[12px] text-blue-800 leading-relaxed">{chunk.summary}</p>
        </div>
      )}

      <div className="px-4 py-3 border-t">
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Source Text</p>
        <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap">
          {expanded || !isTruncated ? chunk.text : preview + "…"}
        </p>
        {isTruncated && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show more</>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function EvaluatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [query, setQuery] = useState("")
  const [topK, setTopK] = useState(5)
  const [embeddingModel, setEmbeddingModel] = useState("voyage-3")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chunks, setChunks] = useState<KnowledgeChunkResult[] | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  async function handleExecute() {
    if (!query.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.knowledgeBases.query(id, query.trim(), topK, embeddingModel)
      setChunks(result.chunks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed")
      setChunks(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-[15px] font-semibold">Evaluate Retrieval</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Test how well your knowledge base retrieves relevant content for a given query.
        </p>
      </div>

      <div className="border border-prune-borderGray rounded-xl overflow-hidden">
        <Textarea
          placeholder="Enter a search query…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-0 rounded-none resize-none min-h-[120px] text-[13px] focus-visible:ring-0"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleExecute()
          }}
        />
        <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] h-7 text-muted-foreground"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            Advanced Settings
          </Button>
          <Button
            size="sm"
            className="text-[12px] h-7 gap-1.5"
            onClick={handleExecute}
            disabled={!query.trim() || loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Execute
            <kbd className="ml-1 text-[10px] opacity-60">⌘↵</kbd>
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="border border-prune-borderGray rounded-xl p-4 flex flex-col gap-4 text-[13px]">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Top K results</label>
              <input
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full px-3 py-1.5 text-[13px] border border-prune-borderGray rounded-md bg-background outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Embedding model</label>
              <select
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-prune-borderGray rounded-md bg-background outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="voyage-3">voyage-3</option>
                <option value="voyage-3-lite">voyage-3-lite</option>
                <option value="text-embedding-3-large">text-embedding-3-large</option>
                <option value="text-embedding-3-small">text-embedding-3-small</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-prune-borderGray p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-[13px]">Searching knowledge base…</span>
        </div>
      )}

      {!loading && chunks !== null && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">
              {chunks.length === 0
                ? "No matching chunks found"
                : `${chunks.length} chunk${chunks.length !== 1 ? "s" : ""} retrieved`}
            </p>
            {chunks.length > 0 && (
              <span className="text-[12px] text-muted-foreground">sorted by relevance score</span>
            )}
          </div>
          {chunks.length === 0 ? (
            <div className="rounded-xl border border-prune-borderGray p-8 flex flex-col items-center justify-center gap-2 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground">
                No indexed documents matched your query. Try a different search term or upload more documents.
              </p>
            </div>
          ) : (
            chunks.map((chunk, i) => <ChunkCard key={`${chunk.doc_id}-${chunk.chunk_index}`} chunk={chunk} index={i} />)
          )}
        </div>
      )}

      {!loading && chunks === null && !error && (
        <div className="rounded-xl border border-prune-borderGray p-8 flex flex-col items-center justify-center gap-2 text-center min-h-[180px]">
          <Search className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-[14px] font-medium">Search for something to see results</p>
          <p className="text-[12px] text-muted-foreground">
            Enter a query above and press Execute. Relevant knowledge base chunks will appear here with their relevance scores.
          </p>
        </div>
      )}
    </div>
  )
}
