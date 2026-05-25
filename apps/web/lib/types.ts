// Shared TypeScript types across the Prune AI frontend.

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

export interface WorkflowNodePreview {
  type: NodeType;
  icon: string;
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
  icon: string;
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
}

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
