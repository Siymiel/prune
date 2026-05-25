import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, Play } from 'lucide-react';
import { TEMPLATES, getTemplate } from '@/lib/templates';
import { TONE_CLASSES } from '@/lib/tones';
import { Button } from '@/components/ui/button';
import { ChatPreview } from '@/components/templates/chat-preview';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link
        href={"/templates" as any}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to templates
      </Link>

      <div className="grid gap-7 grid-cols-[1fr_440px]">
        <div>
          <div className="flex gap-4 mb-6">
            <div
              className={cn(
                'h-16 w-16 rounded-[14px] flex items-center justify-center text-[32px] shrink-0',
                TONE_CLASSES[template.tone],
              )}
            >
              {template.icon}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                {template.vertical}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                {template.name}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[560px]">
                {template.description}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button>
              <Play className="h-3 w-3" fill="currentColor" />
              Deploy this template
            </Button>
            <Button variant="outline">Open in builder</Button>
            <Button variant="outline">Duplicate</Button>
          </div>

          <section className="mt-7">
            <SectionTitle>What this assistant does</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              {template.capabilities.map((c) => (
                <div
                  key={c.title}
                  className="flex gap-2.5 p-3 rounded-md bg-muted/40 border"
                >
                  <div className="h-[18px] w-[18px] rounded bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </div>
                  <div className="text-sm">
                    {c.title}
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {c.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle>Workflow preview</SectionTitle>
            <div className="relative p-5 rounded-lg bg-muted/40 border overflow-hidden">
              <div className="absolute inset-0 grid-dots pointer-events-none" />
              <div className="relative flex items-center gap-2 flex-wrap">
                {template.workflow.map((n, i) => (
                  <span key={i} className="contents">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border text-xs font-medium">
                      <span
                        className={cn(
                          'text-sm',
                          n.type === 'trigger' && 'text-emerald-600',
                          n.type === 'ai' && 'text-primary',
                          n.type === 'payment' && 'text-emerald-600',
                          n.type === 'data' && 'text-sky-600',
                          n.type === 'logic' && 'text-rose-600',
                        )}
                      >
                        {n.icon}
                      </span>
                      {n.label}
                    </span>
                    {i < template.workflow.length - 1 && (
                      <span className="text-muted-foreground text-xs">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle>Required integrations</SectionTitle>
            <div className="flex gap-2 flex-wrap">
              <Integration label="WhatsApp Business" color="bg-emerald-500" />
              <Integration label="M-Pesa Daraja" color="bg-primary" />
              <Integration label="Google Calendar" color="bg-sky-500" />
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle>What businesses like you achieve</SectionTitle>
            <div className="grid grid-cols-3 gap-2.5">
              <Stat label="Avg. response" value="3.4s" />
              <Stat label="Automation rate" value="87%" />
              <Stat label="Deploy time" value="~5min" />
            </div>
          </section>
        </div>

        <ChatPreview template={template} />
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
      {children}
    </div>
  );
}

function Integration({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border text-sm">
      <span className={cn('h-1.5 w-1.5 rounded-full', color)} />
      {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3.5 rounded-md bg-muted/40 border">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold mt-1 font-mono text-foreground">
        {value}
      </div>
    </div>
  );
}
