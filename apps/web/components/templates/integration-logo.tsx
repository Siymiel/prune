import {
  SiWhatsapp,
  SiOpenai,
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

// M-Pesa is not in simple-icons — custom SVG using brand green #00A550.
// Shape: filled rectangle with a triangular notch cut from the top (evenodd),
// producing a bold M letterform.
function MpesaLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#00A550" aria-label="M-Pesa">
      <path fillRule="evenodd" d="M2 21V3h20v18H2zM5 3l7 10 7-10z" />
    </svg>
  );
}

const INTEGRATIONS: Record<IntegrationId, IntegrationMeta> = {
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

export function IntegrationLogo({ id }: { id: IntegrationId }) {
  const meta = INTEGRATIONS[id];
  return (
    <span
      title={meta.label}
      className="inline-flex items-center justify-center h-6 w-6 rounded bg-background"
    >
      {meta.render(16)}
    </span>
  );
}
