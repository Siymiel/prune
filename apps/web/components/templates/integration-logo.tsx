"use client";

import {
  SiWhatsapp,
  SiOpenai,
  SiAnthropic,
  SiGoogle,
  SiMistralai,
  SiPerplexity,
  SiGooglecalendar,
  SiGoogledrive,
  SiGmail,
  SiGooglemaps,
  SiSlack,
} from 'react-icons/si';
import type { IntegrationId } from '@/lib/types';

type IntegrationMeta = {
  label: string;
  color: string;
  render: (size: number) => React.ReactNode;
};

function MpesaLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#00A550" aria-label="M-Pesa">
      <path fillRule="evenodd" d="M2 21V3h20v18H2zM5 3l7 10 7-10z" />
    </svg>
  );
}

const INTEGRATIONS: Partial<Record<IntegrationId, IntegrationMeta>> = {
  whatsapp: {
    label: 'WhatsApp',
    color: '#25D366',
    render: (s) => <SiWhatsapp size={s} color="#25D366" />,
  },
  mpesa: {
    label: 'M-Pesa',
    color: '#00A550',
    render: (s) => <MpesaLogo size={s} />,
  },
  openai: {
    label: 'OpenAI',
    color: '#000000',
    render: (s) => <SiOpenai size={s} color="#000000" />,
  },
  anthropic: {
    label: 'Anthropic',
    color: '#C96442',
    render: (s) => <SiAnthropic size={s} color="#C96442" />,
  },
  google: {
    label: 'Google',
    color: '#4285F4',
    render: (s) => <SiGoogle size={s} color="#4285F4" />,
  },
  mistral: {
    label: 'Mistral',
    color: '#FF6B35',
    render: (s) => <SiMistralai size={s} color="#FF6B35" />,
  },
  perplexity: {
    label: 'Perplexity',
    color: '#20b2aa',
    render: (s) => <SiPerplexity size={s} color="#20b2aa" />,
  },
  'google-calendar': {
    label: 'Google Calendar',
    color: '#4285F4',
    render: (s) => <SiGooglecalendar size={s} color="#4285F4" />,
  },
  'google-drive': {
    label: 'Google Drive',
    color: '#4285F4',
    render: (s) => <SiGoogledrive size={s} color="#4285F4" />,
  },
  gmail: {
    label: 'Gmail',
    color: '#EA4335',
    render: (s) => <SiGmail size={s} color="#EA4335" />,
  },
  slack: {
    label: 'Slack',
    color: '#4A154B',
    render: (s) => <SiSlack size={s} color="#4A154B" />,
  },
  'google-maps': {
    label: 'Google Maps',
    color: '#EA4335',
    render: (s) => <SiGooglemaps size={s} color="#EA4335" />,
  },
};

/** Render just the brand icon at a given pixel size. Returns null for unknown IDs. */
export function renderIntegrationIcon(id: string, size: number): React.ReactNode {
  return INTEGRATIONS[id as IntegrationId]?.render(size) ?? null;
}

/** Small icon-only badge — used on template cards */
export function IntegrationLogo({ id }: { id: IntegrationId }) {
  const meta = INTEGRATIONS[id];
  if (!meta) return null;
  return (
    <span
      title={meta.label}
      className="inline-flex items-center justify-center h-6 w-6 rounded bg-background"
    >
      {meta.render(18)}
    </span>
  );
}

/** Logo + label pill — used in the template detail page */
export function IntegrationBadge({ id }: { id: IntegrationId }) {
  const meta = INTEGRATIONS[id];
  if (!meta) return null;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border text-sm">
      {meta.render(15)}
      <span>{meta.label}</span>
    </div>
  );
}
