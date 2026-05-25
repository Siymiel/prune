'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Template, SeedMessage } from '@/lib/types';
import { pickResponse } from '@/lib/templates';
import { cn } from '@/lib/utils';

type DisplayMessage = SeedMessage;

const TRACE_STAGES = [
  { label: 'whatsapp.trigger', durationMs: 12 },
  { label: 'ai.classify',      durationMs: 412 },
  { label: 'kb.retrieve',      durationMs: 89 },
  { label: 'ai.respond',       durationMs: 894 },
  { label: 'whatsapp.send',    durationMs: 167 },
];

export function ChatPreview({ template }: { template: Template }) {
  const [messages, setMessages] = useState<DisplayMessage[]>(template.seedMessages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [trace, setTrace] = useState<number>(-1);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(template.seedMessages);
    setTrace(-1);
  }, [template]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function send(text: string) {
    const value = text.trim();
    if (!value) return;
    setInput('');

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    setMessages((m) => [...m, { dir: 'in', text: value, time }]);

    setTrace(-1);
    await wait(120);
    setTrace(0);
    setTyping(true);
    await wait(420);
    setTrace(1);
    await wait(150);
    setTrace(2);
    await wait(700);
    setTrace(3);
    setTyping(false);

    const reply = pickResponse(template, value);
    setMessages((m) => [...m, { dir: 'out', text: reply, time }]);

    await wait(180);
    setTrace(4);
  }

  return (
    <div className="sticky top-[76px] h-[calc(100vh-110px)] flex flex-col rounded-lg overflow-hidden bg-card border">
      <header className="px-4 py-3.5 border-b flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-semibold text-sm">
          {template.avatar}
        </div>
        <div>
          <div className="text-sm font-semibold">{template.business}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI assistant active
          </div>
        </div>
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
          WhatsApp
        </span>
      </header>

      <div
        ref={bodyRef}
        className="flex-1 p-4 overflow-y-auto bg-muted/20 chat-bg flex flex-col gap-2"
      >
        {messages.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {typing && (
          <div className="self-start flex gap-1 px-3.5 py-2.5 bg-background border rounded-xl rounded-bl-sm animate-msg-in">
            <Dot />
            <Dot delay={150} />
            <Dot delay={300} />
          </div>
        )}
      </div>

      {messages.length <= template.seedMessages.length + 1 && (
        <div className="px-4 pt-2 flex gap-1.5 flex-wrap">
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

      <div className="border-t bg-muted/30 px-4 py-2 flex items-center gap-2.5 flex-wrap min-h-[36px]">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Run trace:
        </span>
        {trace === -1 ? (
          <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            idle
          </span>
        ) : (
          TRACE_STAGES.map((stage, i) => {
            if (i > trace + 1) return null;
            const done = i <= trace;
            return (
              <span
                key={stage.label}
                className={cn(
                  'text-[10.5px] font-mono px-1.5 py-0.5 rounded',
                  done
                    ? 'bg-muted text-emerald-600 border-l-2 border-emerald-500 pl-2'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {stage.label} {done ? `${stage.durationMs}ms` : 'running…'}
              </span>
            );
          })
        )}
      </div>

      <form
        className="px-4 py-3 border-t bg-card flex items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <input
          className="flex-1 px-3 py-2 rounded-md bg-background border text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Type as a customer would…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}

function Bubble({ message }: { message: DisplayMessage }) {
  return (
    <div className={cn('flex flex-col gap-0.5 animate-msg-in', message.dir === 'in' ? 'items-start' : 'items-end')}>
      <div
        className={cn(
          'max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-line',
          message.dir === 'in'
            ? 'bg-background border text-foreground rounded-bl-sm'
            : 'bg-primary text-primary-foreground rounded-br-sm',
        )}
      >
        {message.text}
      </div>
      <div className={cn('text-[10px] text-muted-foreground px-1', message.dir === 'in' ? '' : 'self-end')}>
        {message.time}
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
