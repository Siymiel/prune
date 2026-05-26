import Link from 'next/link';
import { Timer } from 'lucide-react';
import type { Template } from '@/lib/types';
import { TONE_CLASSES } from '@/lib/tones';
import { IntegrationLogo } from '@/components/templates/integration-logo';
import { cn } from '@/lib/utils';

export function TemplateCard({ template }: { template: Template }) {
  const Icon = template.icon;
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={`/templates/${template.slug}` as any}
      className={cn(
        'group relative flex flex-col rounded-lg overflow-hidden',
        'bg-card border hover:border-foreground/20 hover:shadow-md',
        'transition-all hover:-translate-y-0.5',
      )}
    >
      <div className="p-5 pb-3 flex items-start gap-3.5">
        <div
          className={cn(
            'h-11 w-11 rounded-[10px] flex items-center justify-center shrink-0',
            TONE_CLASSES[template.tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold tracking-tight">
            {template.name}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-0.5">
            {template.vertical}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {template.shortDesc}
        </p>
      </div>

      <div className="px-5 py-3 border-t flex items-center gap-1.5">
        {template.integrations.map((id) => (
          <IntegrationLogo key={id} id={id} />
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-2.5 w-2.5" />
          5 min
        </span>
      </div>
    </Link>
  );
}
