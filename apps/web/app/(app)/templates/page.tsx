'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import type { TemplateCategory } from '@/lib/types';
import { TemplateCard } from '@/components/templates/template-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Filter = 'all' | TemplateCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',          label: 'All templates' },
  { value: 'bookings',     label: 'Bookings' },
  { value: 'support',      label: 'Support' },
  { value: 'payments',     label: 'Payments' },
  { value: 'lead-capture', label: 'Lead capture' },
  { value: 'multilingual', label: 'Multilingual' },
];

export default function TemplatesPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const visible =
    filter === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.tags.includes(filter));

  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight">
          Start with a{' '}
          <em className="font-serif italic font-normal">template</em>{' '}
          made for African businesses.
        </h1>
        <p className="text-muted-foreground text-base mt-2 max-w-[640px]">
          Pre-built AI assistants for the real workflows of Kenyan SMEs —
          pre-wired with WhatsApp, M-Pesa, and Swahili. Deploy one in five
          minutes, customize as you grow.
        </p>
      </header>

      <div className="flex items-center gap-2 mt-2 pb-5 border-b flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg border transition-colors',
              filter === f.value
                ? 'bg-gray-300 text-primary border-secondary/30'
                : 'bg-gray-100 border-input text-muted-foreground hover:text-foreground hover:border-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          Sort by
          <span className="text-foreground">Most popular</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {visible.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>

      <div className="mt-10 px-7 py-6 rounded-lg border bg-muted/40 flex items-center gap-5">
        <div>
          <h3 className="text-base font-semibold mb-1">
            Don&apos;t see your use case?
          </h3>
          <p className="text-sm text-muted-foreground max-w-[480px]">
            Start with the closest template and modify in the visual builder —
            or describe what you want and our AI will draft a custom workflow.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline">Describe with AI</Button>
          <Button>Build from scratch</Button>
        </div>
      </div>
    </>
  );
}
