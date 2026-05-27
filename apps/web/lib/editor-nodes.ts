import {
  Type, Files, Zap, Globe, Mic,
  Send, Cpu, Headphones, LayoutTemplate,
  Bot, BookMarked, Leaf,
  Terminal, GitBranch, Shuffle, Repeat2,
  StickyNote, Timer, Brain, HardDrive, Table, SearchCode,
  CreditCard, MessageSquare, Database,
} from 'lucide-react';
import type { IntegrationId, LucideIcon } from '@/lib/types';

export type NodeCategory = 'inputs' | 'outputs' | 'core' | 'apps' | 'logic' | 'utils';
export type NodeBadge = 'Input' | 'Output' | 'Action' | 'Logic' | 'Util' | 'App';

export type NodeKind =
  | 'text-input' | 'files' | 'trigger' | 'url' | 'audio-input'
  | 'output' | 'action' | 'audio-output' | 'template-out'
  | 'ai-agent' | 'knowledge-base' | 'prune-ai'
  | 'whatsapp' | 'mpesa' | 'openai-app' | 'google-calendar-app'
  | 'google-drive-app' | 'gmail-app' | 'slack-app' | 'google-maps-app'
  | 'code' | 'if-else' | 'ai-routing' | 'loop-subflow'
  | 'sticky-note' | 'default-message' | 'delay' | 'shared-memory'
  | 'vector-store' | 'text-to-sql' | 'search-tables' | 'search-data';

export interface NodeDef {
  kind: NodeKind;
  label: string;
  description: string;
  category: NodeCategory;
  badge: NodeBadge;
  badgeClass: string;
  icon: LucideIcon;
  iconClass: string;
  integrationId?: IntegrationId;
}

export const SIDEBAR_CATEGORIES: { id: NodeCategory; label: string }[] = [
  { id: 'inputs',  label: 'Inputs'     },
  { id: 'outputs', label: 'Outputs'    },
  { id: 'core',    label: 'Core Nodes' },
  { id: 'apps',    label: 'Apps'       },
  { id: 'logic',   label: 'Logic'      },
  { id: 'utils',   label: 'Utils'      },
];

export const NODE_DEFS: NodeDef[] = [
  // INPUTS
  { kind: 'text-input',  label: 'Text Input', description: 'Accept text from users or upstream nodes', icon: Type,     category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'files',        label: 'Files',       description: 'Upload documents, PDFs, or images',        icon: Files,    category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'trigger',      label: 'Trigger',     description: 'Start the workflow on a specific event',   icon: Zap,      category: 'inputs', badge: 'Input', badgeClass: 'bg-amber-500/10 text-amber-600', iconClass: 'text-amber-500'  },
  { kind: 'url',          label: 'URL',          description: 'Fetch and process content from a URL',    icon: Globe,    category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'audio-input', label: 'Audio',        description: 'Record or upload audio as input',           icon: Mic,      category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },

  // OUTPUTS
  { kind: 'output',        label: 'Output',       description: 'Return a text result to the caller',       icon: Send,           category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'action',        label: 'Action',        description: 'Execute an action and surface the result', icon: Cpu,            category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'audio-output', label: 'Audio Output', description: 'Convert a text response into speech',      icon: Headphones,     category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'template-out', label: 'Template',      description: 'Render a formatted message template',     icon: LayoutTemplate, category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },

  // CORE
  { kind: 'ai-agent',       label: 'AI Agent',       description: 'Run an LLM with a custom system prompt',  icon: Bot,        category: 'core', badge: 'Action', badgeClass: 'bg-violet-500/10 text-violet-600', iconClass: 'text-violet-500'  },
  { kind: 'knowledge-base', label: 'Knowledge Base', description: 'Retrieve context from your documents',   icon: BookMarked, category: 'core', badge: 'Action', badgeClass: 'bg-sky-500/10 text-sky-600',       iconClass: 'text-sky-500'     },
  { kind: 'prune-ai',       label: 'PruneAI',         description: 'WhatsApp-native AI workflow engine',      icon: Leaf,       category: 'core', badge: 'Action', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },

  // APPS
  { kind: 'whatsapp',            label: 'WhatsApp',        description: 'Send and receive WhatsApp messages',  icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500', integrationId: 'whatsapp'         },
  { kind: 'mpesa',               label: 'M-Pesa',           description: 'Process M-Pesa mobile payments',      icon: CreditCard,    category: 'apps', badge: 'App', badgeClass: 'bg-emerald-500/10 text-emerald-700', iconClass: 'text-emerald-700', integrationId: 'mpesa'            },
  { kind: 'openai-app',          label: 'OpenAI',           description: 'Call OpenAI GPT models directly',     icon: Bot,           category: 'apps', badge: 'App', badgeClass: 'bg-gray-500/10 text-gray-700',       iconClass: 'text-gray-700',    integrationId: 'openai'           },
  { kind: 'google-calendar-app', label: 'Google Calendar', description: 'Create and manage calendar events',   icon: Zap,           category: 'apps', badge: 'App', badgeClass: 'bg-blue-500/10 text-blue-600',       iconClass: 'text-blue-500',    integrationId: 'google-calendar'  },
  { kind: 'google-drive-app',    label: 'Google Drive',    description: 'Read and write files in Drive',        icon: Database,      category: 'apps', badge: 'App', badgeClass: 'bg-blue-500/10 text-blue-600',       iconClass: 'text-blue-500',    integrationId: 'google-drive'     },
  { kind: 'gmail-app',           label: 'Gmail',            description: 'Send emails via Gmail',               icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-red-500/10 text-red-600',         iconClass: 'text-red-500',     integrationId: 'gmail'            },
  { kind: 'slack-app',           label: 'Slack',            description: 'Post messages to Slack channels',     icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-purple-500/10 text-purple-600',   iconClass: 'text-purple-500',  integrationId: 'slack'            },
  { kind: 'google-maps-app',     label: 'Google Maps',      description: 'Look up locations and directions',    icon: Zap,           category: 'apps', badge: 'App', badgeClass: 'bg-red-500/10 text-red-600',         iconClass: 'text-red-500',     integrationId: 'google-maps'      },

  // LOGIC
  { kind: 'code',         label: 'Code',         description: 'Run custom JavaScript or Python',         icon: Terminal,  category: 'logic', badge: 'Logic', badgeClass: 'bg-orange-500/10 text-orange-600', iconClass: 'text-orange-500' },
  { kind: 'if-else',      label: 'If / Else',    description: 'Branch the flow based on a condition',   icon: GitBranch, category: 'logic', badge: 'Logic', badgeClass: 'bg-rose-500/10 text-rose-600',     iconClass: 'text-rose-500'   },
  { kind: 'ai-routing',   label: 'AI Routing',   description: 'Route messages using AI classification', icon: Shuffle,   category: 'logic', badge: 'Logic', badgeClass: 'bg-rose-500/10 text-rose-600',     iconClass: 'text-rose-500'   },
  { kind: 'loop-subflow', label: 'Loop Subflow', description: 'Iterate over a list of items',           icon: Repeat2,   category: 'logic', badge: 'Logic', badgeClass: 'bg-rose-500/10 text-rose-600',     iconClass: 'text-rose-500'   },

  // UTILS
  { kind: 'sticky-note',    label: 'Sticky Note',         description: 'Annotate your canvas with a note',        icon: StickyNote,    category: 'utils', badge: 'Util', badgeClass: 'bg-yellow-500/10 text-yellow-700', iconClass: 'text-yellow-600' },
  { kind: 'default-message', label: 'Default Message',   description: 'Set a fallback when nothing matches',     icon: MessageSquare, category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'delay',           label: 'Delay',              description: 'Pause workflow execution for a duration', icon: Timer,         category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'shared-memory',  label: 'Shared Memory',       description: 'Persist values across workflow runs',     icon: Brain,         category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'vector-store',   label: 'Dynamic Vector Store', description: 'Embed and search dynamic content',      icon: HardDrive,     category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'text-to-sql',    label: 'Text-to-SQL',          description: 'Convert natural language to SQL',        icon: Database,      category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'search-tables',  label: 'Search Tables',        description: 'Query structured database tables',       icon: Table,         category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'search-data',    label: 'Search Data',          description: 'Full-text search across your data',      icon: SearchCode,    category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
];

export function getNodeDef(kind: NodeKind): NodeDef | undefined {
  return NODE_DEFS.find(n => n.kind === kind);
}

export function getNodesByCategory(category: NodeCategory): NodeDef[] {
  return NODE_DEFS.filter(n => n.category === category);
}

export interface CanvasNode {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  inputValue?: string;
  model?: string;
  stickyNote?: {
    visible: boolean;
    text: string;
    color: string;
  };
}

export const LLM_MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' as const },
  { id: 'claude-opus-4',     label: 'Claude Opus 4',     provider: 'anthropic' as const },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  provider: 'anthropic' as const },
  { id: 'gpt-4o',            label: 'GPT-4o',            provider: 'openai'    as const },
  { id: 'gpt-4o-mini',       label: 'GPT-4o mini',       provider: 'openai'    as const },
  { id: 'gpt-5',             label: 'GPT-5',             provider: 'openai'    as const },
  { id: 'o3',                label: 'o3',                provider: 'openai'    as const },
];

export type NodeRunStatus = 'pending' | 'running' | 'done' | 'error';
export type RunPhase = 'idle' | 'running' | 'done' | 'error';

export function getModelProvider(modelId: string): 'anthropic' | 'openai' {
  const m = modelId.toLowerCase();
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')) return 'openai';
  return 'anthropic';
}

export interface CanvasEdge {
  id: string;
  sourceId: string;
  targetId: string;
}
