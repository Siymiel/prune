'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Play, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'workflow' | 'export' | 'analytics' | 'manager';

interface EditorTopbarProps {
  templateName: string | null;
  templateSlug: string | null;
}

export function EditorTopbar({ templateName, templateSlug }: EditorTopbarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('workflow');

  const backHref = templateSlug ? `/templates/${templateSlug}` : '/templates';

  return (
    <header className="h-12 border-b bg-background flex items-center gap-3 px-4 shrink-0 z-20">
      {/* Logo */}
      <div className="h-7 w-7 shrink-0 rounded-lg bg-primary flex items-center justify-center text-[13px] font-bold text-primary-foreground">
        P
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Back */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link
        href={backHref as any}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {templateName ?? 'Templates'}
      </Link>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Tabs */}
      <nav className="flex items-center bg-gray-100 gap-1 p-1 rounded-lg">
        {(['workflow', 'export', 'analytics', 'manager'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-2 py-1 text-[13px] rounded-md font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-white text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-gray-200',
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border rounded-md hover:bg-muted hover:text-foreground transition-colors">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors">
          <Play className="h-3.5 w-3.5" fill="currentColor" />
          Run
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
          <Rocket className="h-3.5 w-3.5" />
          Publish
        </button>
      </div>
    </header>
  );
}
