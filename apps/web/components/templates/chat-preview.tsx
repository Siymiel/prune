'use client';

import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, RotateCcw, CheckCheck } from 'lucide-react';
import type { ChatTemplateData, SeedMessage } from '@/lib/types';
import { pickResponse } from '@/lib/templates';
import { cn } from '@/lib/utils';

type DisplayMessage = SeedMessage;

// Pipeline stages that run on every AI response
const PIPELINE: { label: string; ms: number }[] = [
  { label: 'wa.receive',  ms: 12  },
  { label: 'ai.classify', ms: 412 },
  { label: 'kb.retrieve', ms: 89  },
  { label: 'ai.respond',  ms: 894 },
  { label: 'wa.send',     ms: 167 },
];

export function ChatPreview({ template }: { template: ChatTemplateData }) {
  const [messages, setMessages]   = useState<DisplayMessage[]>(template.seedMessages);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [stage, setStage]         = useState<number>(-1);
  const bodyRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(template.seedMessages);
    setStage(-1);
  }, [template]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, typing]);

  function reset() {
    setMessages(template.seedMessages);
    setInput('');
    setStage(-1);
    setTyping(false);
  }

  async function send(text: string) {
    const value = text.trim();
    if (!value) return;
    setInput('');

    const now  = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Customer message (dir: 'in') — appears on RIGHT as "your" message
    setMessages((m) => [...m, { dir: 'in', text: value, time }]);

    setStage(-1);
    await wait(120);
    setStage(0); setTyping(true);
    await wait(420);
    setStage(1);
    await wait(150);
    setStage(2);
    await wait(700);
    setStage(3); setTyping(false);

    const reply = pickResponse(template, value);
    // AI message (dir: 'out') — appears on LEFT as the assistant's response
    setMessages((m) => [...m, { dir: 'out', text: reply, time }]);

    await wait(180);
    setStage(4);
  }

  return (
    <div className="sticky top-[76px] h-[calc(100vh-110px)] flex flex-col rounded-lg overflow-hidden bg-card border">

      {/* Header */}
      <header className="px-4 py-3 border-b flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-semibold text-sm shrink-0">
          {template.avatar}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">{template.business}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            AI assistant active
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
            WhatsApp
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
            Demo
          </span>
          <button
            onClick={reset}
            title="Reset demo"
            className="ml-1 h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* Demo notice */}
      <div className="px-4 py-2 bg-muted/50 border-b text-[11px] text-muted-foreground text-center">
        Type below as a customer — the AI assistant replies with pre-scripted demo responses.
      </div>

      {/* Messages */}
      <div
        ref={bodyRef}
        className="flex-1 px-4 py-3 overflow-y-auto bg-muted/20 chat-bg flex flex-col gap-2"
      >
        {messages.map((m, i) => (
          <Bubble key={i} message={m} avatar={template.avatar} />
        ))}
        {typing && (
          <div className="self-start flex items-end gap-1.5">
            <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-semibold shrink-0">
              {template.avatar}
            </div>
            <div className="flex gap-1 px-3.5 py-2.5 bg-background border rounded-xl rounded-bl-sm animate-msg-in">
              <Dot />
              <Dot delay={150} />
              <Dot delay={300} />
            </div>
          </div>
        )}
      </div>

      {/* Quick-reply suggestions */}
      {messages.length <= template.seedMessages.length + 1 && (
        <div className="px-4 pt-2 flex gap-1.5 flex-wrap border-t">
          <span className="w-full text-[10px] text-muted-foreground/60 uppercase tracking-wider pt-1 pb-0.5">
            Try saying:
          </span>
          {template.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="px-2.5 py-1 rounded-full bg-muted border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* AI pipeline trace */}
      <div className="border-t bg-muted/30 px-4 py-2 flex items-center gap-2 flex-wrap min-h-[34px]">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 shrink-0">
          AI pipeline:
        </span>
        {stage === -1 ? (
          <span className="text-[10px] font-mono text-muted-foreground/50">idle</span>
        ) : (
          PIPELINE.map((p, i) => {
            if (i > stage + 1) return null;
            const done = i <= stage;
            return (
              <span
                key={p.label}
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors',
                  done
                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'
                    : 'bg-muted text-muted-foreground animate-pulse',
                )}
              >
                {p.label}{done ? ` ${p.ms}ms` : '…'}
              </span>
            );
          })
        )}
      </div>

      {/* Input */}
      <form
        className="px-4 py-3 border-t bg-card flex items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <input
          className="flex-1 px-3 py-2 rounded-md bg-background border text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Message the AI assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <SendHorizontal className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

function Bubble({ message, avatar }: { message: DisplayMessage; avatar: string }) {
  // dir: 'in'  = customer sent this → RIGHT, primary bg (like "your" WhatsApp message)
  // dir: 'out' = AI sent this      → LEFT,  light bg  (like "their" WhatsApp message)
  const isCustomer = message.dir === 'in';

  return (
    <div className={cn('flex items-end gap-1.5 animate-msg-in', isCustomer ? 'flex-row-reverse' : 'flex-row')}>
      {/* AI avatar on left messages only */}
      {!isCustomer && (
        <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-semibold shrink-0 mb-0.5">
          {avatar}
        </div>
      )}

      <div className={cn('flex flex-col gap-0.5 max-w-[78%]', isCustomer ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-line',
            isCustomer
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-background border text-foreground rounded-bl-sm',
          )}
        >
          {message.text}
        </div>
        <div className={cn('flex items-center gap-1 text-[10px] text-muted-foreground px-1')}>
          {message.time}
          {isCustomer && <CheckCheck className="h-3 w-3 text-primary/60" />}
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
      style={{ animation: 'typingBounce 1.2s infinite', animationDelay: `${delay}ms` }}
    />
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
