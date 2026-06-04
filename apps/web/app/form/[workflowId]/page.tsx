"use client"

import { useState, FormEvent } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface ChatResponse {
  reply: string
  conversation_id?: string
}

export default function FormPage({ params }: { params: { workflowId: string } }) {
  const { workflowId } = params
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${API_URL}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: workflowId, message: text }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `Error ${res.status}`)
      }

      const data: ChatResponse = await res.json()
      setResult(data.reply ?? "(no response)")
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setInput("")
    setResult(null)
    setError(null)
    setSubmitted(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-gray-50/80 to-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-[18px] font-semibold tracking-tight text-gray-900">
                Submit a Request
              </h1>
            </div>
            <p className="text-[13px] text-gray-500 mt-1">
              Fill in the form below and we&apos;ll get back to you with a response.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {submitted && result ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-emerald-800 mb-1">Response received</p>
                    <p className="text-[14px] text-emerald-900 leading-relaxed whitespace-pre-wrap">{result}</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl border text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700">
                    Your message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what you need help with…"
                    rows={5}
                    required
                    disabled={loading}
                    className={cn(
                      "w-full resize-none rounded-xl border bg-gray-50 px-3.5 py-3 text-[14px] leading-relaxed outline-none transition-colors",
                      "placeholder:text-gray-400 disabled:opacity-50",
                      "focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10"
                    )}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-[13px]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-[14px] font-semibold transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-4">
          Powered by <span className="font-medium text-gray-500">PruneAI</span>
        </p>
      </div>
    </div>
  )
}
