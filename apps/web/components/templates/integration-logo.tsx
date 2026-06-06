"use client";

import {
  SiWhatsapp, SiOpenai, SiAnthropic, SiGoogle,
  SiMistralai, SiPerplexity, SiGooglecalendar,
  SiGoogledrive, SiGmail, SiGooglemaps, SiSlack,
} from 'react-icons/si';
import type { IntegrationId } from '@/lib/types';

type IntegrationMeta = {
  label: string;
  color: string;
  render: (size: number, color?: string) => React.ReactNode;
};

// Forces fill: currentColor via CSS on both SVG root + all descendant paths
// CSS class (specificity 10) beats SVG presentation attributes (specificity 0)
function withColor(
  icon: React.ReactNode,
  color: string | undefined,
  defaultColor: string,
): React.ReactNode {
  return (
    <span
      className="inline-flex force-icon-color"  // ← swap Tailwind variant for global class
      style={{ color: color ?? defaultColor }}
    >
      {icon}
    </span>
  );
}

// Simplified — no fill prop needed; withColor handles it
function MpesaLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="M-Pesa">
      <path fillRule="evenodd" d="M2 21V3h20v18H2zM5 3l7 10 7-10z" />
    </svg>
  );
}

const INTEGRATIONS: Partial<Record<IntegrationId, IntegrationMeta>> = {
  whatsapp:         { label: 'WhatsApp',        color: '#25D366', render: (s, c) => withColor(<SiWhatsapp size={s} />,        c, '#25D366') },
  mpesa:            { label: 'M-Pesa',           color: '#00A550', render: (s, c) => withColor(<MpesaLogo size={s} />,         c, '#00A550') },
  openai:           { label: 'OpenAI',           color: '#000000', render: (s, c) => withColor(<SiOpenai size={s} />,          c, '#000000') },
  anthropic:        { label: 'Anthropic',        color: '#C96442', render: (s, c) => withColor(<SiAnthropic size={s} />,       c, '#C96442') },
  google:           { label: 'Google',           color: '#4285F4', render: (s, c) => withColor(<SiGoogle size={s} />,          c, '#4285F4') },
  mistral:          { label: 'Mistral',          color: '#FF6B35', render: (s, c) => withColor(<SiMistralai size={s} />,       c, '#FF6B35') },
  perplexity:       { label: 'Perplexity',       color: '#20b2aa', render: (s, c) => withColor(<SiPerplexity size={s} />,      c, '#20b2aa') },
  'google-calendar':{ label: 'Google Calendar',  color: '#4285F4', render: (s, c) => withColor(<SiGooglecalendar size={s} />, c, '#4285F4') },
  'google-drive':   { label: 'Google Drive',     color: '#4285F4', render: (s, c) => withColor(<SiGoogledrive size={s} />,    c, '#4285F4') },
  gmail:            { label: 'Gmail',            color: '#EA4335', render: (s, c) => withColor(<SiGmail size={s} />,          c, '#EA4335') },
  slack:            { label: 'Slack',            color: '#4A154B', render: (s, c) => withColor(<SiSlack size={s} />,          c, '#4A154B') },
  'google-maps':    { label: 'Google Maps',      color: '#EA4335', render: (s, c) => withColor(<SiGooglemaps size={s} />,     c, '#EA4335') },
};

export function renderIntegrationIcon(id: string, size: number, color?: string): React.ReactNode {
  return INTEGRATIONS[id as IntegrationId]?.render(size, color) ?? null;
}

export function IntegrationLogo({ id, color }: { id: IntegrationId; color?: string }) {
  const meta = INTEGRATIONS[id];
  if (!meta) return null;
  return (
    <span title={meta.label} className="inline-flex items-center justify-center h-6 w-6 rounded bg-background">
      {meta.render(18, color)}
    </span>
  );
}

export function IntegrationBadge({ id, color }: { id: IntegrationId; color?: string }) {
  const meta = INTEGRATIONS[id];
  if (!meta) return null;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border text-sm">
      {meta.render(15, color)}
      <span>{meta.label}</span>
    </div>
  );
}