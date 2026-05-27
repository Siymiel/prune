'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Play, Rocket, Hop, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RunPhase } from '@/lib/editor-nodes';

type Tab = 'workflow' | 'export' | 'analytics' | 'manager';

interface EditorTopbarProps {
  templateName: string | null;
  templateSlug: string | null;
  onRun?: () => void;
  runPhase?: RunPhase;
}

export function EditorTopbar({ templateName, templateSlug, onRun, runPhase = 'idle' }: EditorTopbarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('workflow');

  const backHref = templateSlug ? `/templates/${templateSlug}` : '/templates';

  return (
    <header className="h-12 border-b bg-background flex items-center gap-2 md:gap-3 px-3 md:px-4 shrink-0 z-20 min-w-0">
      {/* Logo */}
      <div className="h-7 w-7 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
        <Hop className="h-4 w-4" />
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Back */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link
        href={backHref as any}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 min-w-0"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline truncate max-w-[120px] lg:max-w-none">
          {templateName ?? 'Templates'}
        </span>
      </Link>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Tabs — scrollable on narrow viewports */}
      <nav className="flex items-center bg-prune-lightGray gap-0.5 sm:gap-1 p-1 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden shrink-0">
        {(['workflow', 'export', 'analytics', 'manager'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-1.5 sm:px-2 py-1 text-[11px] sm:text-[13px] rounded-md font-medium capitalize transition-colors whitespace-nowrap',
              activeTab === tab
                ? 'bg-white text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-prune-lightGray',
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs text-muted-foreground border rounded-md hover:bg-muted hover:text-foreground transition-colors">
          <Share2 className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Share</span>
        </button>
        <button
          onClick={onRun}
          disabled={runPhase === 'running'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs border rounded-md transition-all duration-200 disabled:cursor-not-allowed',
            runPhase === 'running' && 'opacity-60',
            runPhase === 'done' && 'border-green-300 text-green-600 bg-green-50 hover:bg-green-100',
            runPhase === 'error' && 'border-red-300 text-red-600 hover:bg-red-50',
            (runPhase === 'idle') && 'hover:bg-muted',
          )}
        >
          {runPhase === 'running' ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          : runPhase === 'done'    ? <Check className="h-3.5 w-3.5 shrink-0" />
          : runPhase === 'error'   ? <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          : <Play className="h-3.5 w-3.5 shrink-0" fill="currentColor" />}
          <span className="hidden sm:inline">
            {runPhase === 'running' ? 'Running…' : runPhase === 'done' ? 'Done' : runPhase === 'error' ? 'Failed' : 'Run'}
          </span>
        </button>
        <button className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
          <Rocket className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>
    </header>
  );
}
