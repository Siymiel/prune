"use client";

import {
  SiWhatsapp, SiOpenai, SiAnthropic, SiGoogle,
  SiMistralai, SiPerplexity, SiGooglecalendar,
  SiGoogledrive, SiGmail, SiGooglemaps, SiSlack,
  SiNotion, SiHubspot, SiSalesforce, SiAirtable,
  SiGithub, SiJira, SiStripe, SiPostgresql,
  SiSnowflake, SiZapier, SiTypeform, SiLinear, SiZendesk,
  SiMeta
} from 'react-icons/si';
import { Box } from 'lucide-react';
import type { IntegrationId } from '@/lib/types';
import { useBrandIcons } from '@/hooks/use-brand-icons';

type IntegrationMeta = {
  label: string;
  color: string;
  render: (size: number, color?: string) => React.ReactNode;
};

// Forces fill: currentColor via CSS on both SVG root + all descendant paths
function withColor(
  icon: React.ReactNode,
  color: string | undefined,
  defaultColor: string,
): React.ReactNode {
  return (
    <span
      className="inline-flex force-icon-color"
      style={{ color: color ?? defaultColor }}
    >
      {icon}
    </span>
  );
}

function MpesaLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="M-Pesa">
      <path fillRule="evenodd" d="M2 21V3h20v18H2zM5 3l7 10 7-10z" />
    </svg>
  );
}

// Fallback react-icons map used when Brandfetch URL isn't available yet
const INTEGRATIONS: Partial<Record<IntegrationId, IntegrationMeta>> = {
  whatsapp:          { label: 'WhatsApp',       color: '#25D366', render: (s, c) => withColor(<SiWhatsapp size={s} />,        c, '#25D366') },
  mpesa:             { label: 'M-Pesa',          color: '#00A550', render: (s, c) => withColor(<MpesaLogo size={s} />,         c, '#00A550') },
  openai:            { label: 'OpenAI',          color: '#000000', render: (s, c) => withColor(<SiOpenai size={s} />,          c, '#000000') },
  anthropic:         { label: 'Anthropic',       color: '#C96442', render: (s, c) => withColor(<SiAnthropic size={s} />,       c, '#C96442') },
  google:            { label: 'Google',          color: '#4285F4', render: (s, c) => withColor(<SiGoogle size={s} />,          c, '#4285F4') },
  mistral:           { label: 'Mistral',         color: '#FF6B35', render: (s, c) => withColor(<SiMistralai size={s} />,       c, '#FF6B35') },
  perplexity:        { label: 'Perplexity',      color: '#20b2aa', render: (s, c) => withColor(<SiPerplexity size={s} />,      c, '#20b2aa') },
  'google-calendar': { label: 'Google Calendar', color: '#4285F4', render: (s, c) => withColor(<SiGooglecalendar size={s} />, c, '#4285F4') },
  'google-drive':    { label: 'Google Drive',    color: '#4285F4', render: (s, c) => withColor(<SiGoogledrive size={s} />,    c, '#4285F4') },
  gmail:             { label: 'Gmail',           color: '#EA4335', render: (s, c) => withColor(<SiGmail size={s} />,          c, '#EA4335') },
  slack:             { label: 'Slack',           color: '#4A154B', render: (s, c) => withColor(<SiSlack size={s} />,          c, '#4A154B') },
  'google-maps':     { label: 'Google Maps',     color: '#EA4335', render: (s, c) => withColor(<SiGooglemaps size={s} />,     c, '#EA4335') },
  notion:            { label: 'Notion',          color: '#000000', render: (s, c) => withColor(<SiNotion size={s} />,         c, '#000000') },
  hubspot:           { label: 'HubSpot',         color: '#FF7A59', render: (s, c) => withColor(<SiHubspot size={s} />,        c, '#FF7A59') },
  salesforce:        { label: 'Salesforce',      color: '#00A1E0', render: (s, c) => withColor(<SiSalesforce size={s} />,     c, '#00A1E0') },
  airtable:          { label: 'Airtable',        color: '#18BFFF', render: (s, c) => withColor(<SiAirtable size={s} />,       c, '#18BFFF') },
  github:            { label: 'GitHub',          color: '#181717', render: (s, c) => withColor(<SiGithub size={s} />,         c, '#181717') },
  jira:              { label: 'Jira',            color: '#0052CC', render: (s, c) => withColor(<SiJira size={s} />,           c, '#0052CC') },
  stripe:            { label: 'Stripe',          color: '#635BFF', render: (s, c) => withColor(<SiStripe size={s} />,         c, '#635BFF') },
  postgresql:        { label: 'PostgreSQL',      color: '#4169E1', render: (s, c) => withColor(<SiPostgresql size={s} />,     c, '#4169E1') },
  snowflake:         { label: 'Snowflake',       color: '#29B5E8', render: (s, c) => withColor(<SiSnowflake size={s} />,      c, '#29B5E8') },
  zapier:            { label: 'Zapier',          color: '#FF4A00', render: (s, c) => withColor(<SiZapier size={s} />,         c, '#FF4A00') },
  typeform:          { label: 'Typeform',        color: '#262627', render: (s, c) => withColor(<SiTypeform size={s} />,       c, '#262627') },
  linear:            { label: 'Linear',          color: '#5E6AD2', render: (s, c) => withColor(<SiLinear size={s} />,         c, '#5E6AD2') },
  zendesk:           { label: 'Zendesk',         color: '#03363D', render: (s, c) => withColor(<SiZendesk size={s} />,        c, '#03363D') },
  meta:              { label: 'Meta',            color: '#000000', render: (s, c) => withColor(<SiMeta size={s} />,           c, '#1877F2') },
};

// Renders a brand icon: Brandfetch image when available, react-icons fallback otherwise
function BrandIcon({ id, size, color }: { id: string; size: number; color?: string }) {
  const icons = useBrandIcons();
  const url = icons[id];

  if (url) {
    return (
      <img
        src={url}
        width={size}
        height={size}
        alt={id}
        style={{ objectFit: "contain", display: "block" }}
      />
    );
  }

  const fallback = INTEGRATIONS[id as IntegrationId]?.render(size, color);
  if (fallback) return <>{fallback}</>;

  return (
    <span className="inline-flex items-center justify-center rounded bg-muted/40" style={{ width: size, height: size }}>
      <Box style={{ width: size * 0.65, height: size * 0.65 }} className="text-muted-foreground" />
    </span>
  );
}

export function renderIntegrationIcon(id: string, size: number, color?: string): React.ReactNode {
  return <BrandIcon id={id} size={size} color={color} />;
}

export function IntegrationLogo({ id, color }: { id: IntegrationId; color?: string }) {
  const meta = INTEGRATIONS[id];
  if (!meta) return null;
  return (
    <span title={meta.label} className="inline-flex items-center justify-center h-6 w-6 rounded bg-background">
      <BrandIcon id={id} size={18} color={color} />
    </span>
  );
}

export function IntegrationBadge({ id, color }: { id: IntegrationId; color?: string }) {
  const meta = INTEGRATIONS[id];
  if (!meta) return null;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border text-sm">
      <BrandIcon id={id} size={15} color={color} />
      <span>{meta.label}</span>
    </div>
  );
}
