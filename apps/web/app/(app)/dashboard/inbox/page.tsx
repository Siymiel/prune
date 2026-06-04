"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { MessageCircle, RefreshCw, Bot, User } from "lucide-react"

interface ConversationSummary {
  id: string
  contact_phone: string | null
  channel: string
  created_at: string
  updated_at: string
  last_message: string | null
  message_count: number
}

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.conversations.list()
      setConversations(data)
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id)
    } catch {
      // silently keep empty state on error
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => { fetchConversations() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedId) return
    setMsgsLoading(true)
    api.conversations.messages(selectedId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setMsgsLoading(false))
  }, [selectedId])

  const selected = conversations.find(c => c.id === selectedId)

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Conversation list */}
      <aside className="w-72 shrink-0 border-r flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-[14px] font-semibold">Inbox</h1>
          <button
            onClick={fetchConversations}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[13px] text-muted-foreground">
              Loading…
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-48 px-4 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full flex flex-col gap-0.5 px-4 py-3 text-left border-b transition-colors",
                  selectedId === conv.id
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-[450] truncate">
                    {conv.contact_phone ?? "Unknown"}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {timeAgo(conv.updated_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize shrink-0">
                    {conv.channel}
                  </span>
                  {conv.last_message && (
                    <span className="text-[12px] text-muted-foreground truncate">
                      {conv.last_message}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Message thread */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-[14px] font-medium">Select a conversation</p>
            <p className="text-[13px] text-muted-foreground">Choose one from the list to view messages.</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-semibold">{selected.contact_phone ?? "Unknown"}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{selected.channel} · {selected.message_count} messages</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {msgsLoading ? (
                <div className="flex items-center justify-center h-32 text-[13px] text-muted-foreground">
                  Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[13px] text-muted-foreground">
                  No messages found.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role !== "user" && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}>
                      {msg.content}
                      <p className="text-[10px] opacity-60 mt-1">{timeAgo(msg.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
