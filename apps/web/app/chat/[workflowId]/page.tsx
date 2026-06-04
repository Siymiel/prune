"use client"

import { useState, useRef, useEffect, FormEvent } from "react"
import { Send, Loader2, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatApiResponse {
  reply: string
  conversation_id?: string
}

export default function ChatWidgetPage({
  params,
}: {
  params: { workflowId: string }
}) {
  const { workflowId } = params
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: workflowId,
          conversation_id: conversationId,
          message: text,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `Error ${res.status}`)
      }

      const data: ChatApiResponse = await res.json()
      if (data.conversation_id) setConversationId(data.conversation_id)

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "(no response)",
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background font-sans antialiased">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[14px] font-semibold leading-tight">AI Assistant</p>
          <p className="text-[11px] text-muted-foreground leading-tight">Powered by PruneAI</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[12px] text-muted-foreground">Online</span>
        </div>
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[14px] font-medium text-foreground">How can I help you today?</p>
            <p className="text-[13px] text-muted-foreground max-w-xs">
              Send a message to start the conversation.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-[12px] text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
              {error}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={send}
        className="px-4 py-3 border-t bg-background shrink-0"
      >
        <div className="flex items-end gap-2 rounded-2xl border bg-muted/30 px-3 py-2 focus-within:border-primary/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-[14px] outline-none placeholder:text-muted-foreground max-h-32 disabled:opacity-50"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 text-primary-foreground" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-1.5">
          Powered by{" "}
          <span className="font-medium text-foreground">PruneAI</span>
        </p>
      </form>
    </div>
  )
}
