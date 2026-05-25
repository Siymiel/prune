// Shared TypeScript types across the Prune AI frontend.

// Matches Lucide React icon components (and any other icon component library).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LucideIcon = (props: { className?: string; size?: number; color?: string; strokeWidth?: number; [key: string]: any }) => any;

export type TemplateCategory =
  | 'bookings'
  | 'support'
  | 'payments'
  | 'lead-capture'
  | 'multilingual';

export type IconTone =
  | 'amber'
  | 'green'
  | 'rose'
  | 'blue'
  | 'violet'
  | 'teal';

export type NodeType = 'trigger' | 'ai' | 'data' | 'payment' | 'logic';

export type IntegrationId =
  | 'whatsapp'
  | 'mpesa'
  | 'openai'
  | 'google-calendar'
  | 'google-drive'
  | 'gmail'
  | 'slack'
  | 'google-maps';

export interface WorkflowNodePreview {
  type: NodeType;
  icon: LucideIcon;
  label: string;
}

export interface TemplateCapability {
  title: string;
  desc: string;
}

export interface SeedMessage {
  dir: 'in' | 'out';
  text: string;
  time: string;
}

export interface Template {
  slug: string;
  name: string;
  icon: LucideIcon;
  tone: IconTone;
  vertical: string;
  /** Business name used in chat preview header */
  business: string;
  avatar: string;
  description: string;
  /** Short description shown on template cards */
  shortDesc: string;
  tags: TemplateCategory[];
  capabilities: TemplateCapability[];
  /** Linear workflow preview (left → right) */
  workflow: WorkflowNodePreview[];
  /** Suggested prompts for the chat preview */
  suggestions: string[];
  /** Initial messages displayed in the chat preview */
  seedMessages: SeedMessage[];
  /** Keyword-routed mock responses for the demo */
  responses: Record<string, string>;
  /** Third-party integration logos shown on the card */
  integrations: IntegrationId[];
}

/** Serializable subset of Template passed to Client Components. */
export type ChatTemplateData = Pick<Template, 'slug' | 'avatar' | 'business' | 'seedMessages' | 'suggestions' | 'responses'>;

export interface Conversation {
  id: string;
  contactName: string;
  contactInitials: string;
  preview: string;
  time: string;
  handledBy: 'ai' | 'human';
  paid?: { amountKes: number };
}

export interface DashboardStat {
  label: string;
  value: string;
  unit?: string;
  delta: { dir: 'up' | 'down'; text: string };
}
