import {
  Files, Zap, Globe, Mic, ImageIcon,
  Play, Headphones, LayoutTemplate,
  Bot, BookMarked, Leaf, Boxes, Network, UserCheck,
  Terminal, GitBranch, Shuffle, Repeat2,
  StickyNote, Timer, Brain, HardDrive, Table, SearchCode, Webhook, Search,
  CreditCard, MessageSquare, Database,
  PencilLineIcon,
} from 'lucide-react';
import type { IntegrationId, LucideIcon } from '@/lib/types';

export type NodeCategory = 'inputs' | 'outputs' | 'core' | 'apps' | 'logic' | 'utils';
export type NodeBadge = 'Input' | 'Output' | 'Action' | 'Logic' | 'Util' | 'App';

export type NodeKind =
  | 'text-input' | 'files' | 'trigger' | 'url' | 'audio-input' | 'image-input' | 'typeform-trigger'
  | 'output' | 'action' | 'audio-output' | 'template-out' | 'image-output'
  | 'ai-agent' | 'knowledge-base' | 'prune-ai' | 'subflow-tool' | 'workflow' | 'human-in-the-loop'
  | 'whatsapp' | 'mpesa' | 'openai-app' | 'google-calendar-app'
  | 'google-drive-app' | 'gmail-app' | 'slack-app' | 'google-maps-app'
  | 'notion-app' | 'hubspot-app' | 'salesforce-app' | 'airtable-app'
  | 'github-app' | 'jira-app' | 'stripe-app' | 'postgresql-app'
  | 'snowflake-app' | 'zapier-app' | 'typeform-app' | 'linear-app' | 'zendesk-app'
  | 'code' | 'if-else' | 'ai-routing' | 'loop-subflow' | 'python-code'
  | 'sticky-note' | 'default-message' | 'delay' | 'shared-memory'
  | 'vector-store' | 'text-to-sql' | 'search-tables' | 'search-data' | 'custom-api' | 'web-search';

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
  { kind: 'text-input',       label: 'Text Input',       description: 'Accept text from users or upstream nodes',  icon: PencilLineIcon, category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'files',            label: 'Files',            description: 'Upload documents, PDFs, or images',         icon: Files,          category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'trigger',         label: 'Trigger',          description: 'Start the workflow on a specific event',    icon: Zap,            category: 'inputs', badge: 'Input', badgeClass: 'bg-amber-500/10 text-amber-600', iconClass: 'text-amber-500'  },
  { kind: 'url',             label: 'URL',              description: 'Fetch and process content from a URL',      icon: Globe,          category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'audio-input',    label: 'Audio Input',      description: 'Record or upload audio as input',           icon: Mic,            category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'image-input',    label: 'Image Input',      description: 'Upload or reference an image as input',     icon: ImageIcon,      category: 'inputs', badge: 'Input', badgeClass: 'bg-blue-500/10 text-blue-600',   iconClass: 'text-blue-500'   },
  { kind: 'typeform-trigger', label: 'Typeform Trigger', description: 'Trigger a workflow from a Typeform submission', icon: Zap,       category: 'inputs', badge: 'Input', badgeClass: 'bg-amber-500/10 text-amber-600', iconClass: 'text-amber-500', integrationId: 'typeform' },

  // OUTPUTS
  { kind: 'output',       label: 'Output',       description: 'Return a text result to the caller',         icon: PencilLineIcon, category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'action',       label: 'Action',       description: 'Perform a task in another app',              icon: Play,           category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'audio-output', label: 'Audio Output', description: 'Generate audio from text',                   icon: Headphones,     category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'template-out', label: 'Template',     description: 'Render a formatted message template',        icon: LayoutTemplate, category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'image-output', label: 'Image Output', description: 'Generate or return an image as output',      icon: ImageIcon,      category: 'outputs', badge: 'Output', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },

  // CORE
  { kind: 'ai-agent',         label: 'AI Agent',         description: 'Run an LLM with a custom system prompt',                                          icon: Bot,        category: 'core', badge: 'Action', badgeClass: 'bg-violet-500/10 text-violet-600',   iconClass: 'text-violet-500'  },
  { kind: 'knowledge-base',   label: 'Knowledge Base',   description: 'Retrieve context from your documents',                                             icon: BookMarked, category: 'core', badge: 'Action', badgeClass: 'bg-sky-500/10 text-sky-600',         iconClass: 'text-sky-500'     },
  { kind: 'prune-ai',         label: 'PruneAI',          description: 'WhatsApp-native AI workflow engine',                                               icon: Leaf,       category: 'core', badge: 'Action', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500' },
  { kind: 'subflow-tool',     label: 'Subflow Tool',     description: 'A sub-workflow an AI Agent can call as a tool — the agent decides when to invoke it', icon: Boxes,   category: 'core', badge: 'Action', badgeClass: 'bg-violet-500/10 text-violet-600',   iconClass: 'text-violet-500'  },
  { kind: 'workflow',         label: 'Workflow',          description: 'Call another saved PruneAI workflow and use its output in this flow',              icon: Network,    category: 'core', badge: 'Action', badgeClass: 'bg-indigo-500/10 text-indigo-600',   iconClass: 'text-indigo-500'  },
  { kind: 'human-in-the-loop', label: 'Human Review',   description: 'Pause execution and wait for a human to approve or edit the output',               icon: UserCheck,  category: 'core', badge: 'Action', badgeClass: 'bg-amber-500/10 text-amber-600',     iconClass: 'text-amber-500'   },

  // APPS
  { kind: 'whatsapp',            label: 'WhatsApp',       description: 'Send and receive WhatsApp messages',        icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-emerald-500/10 text-emerald-600', iconClass: 'text-emerald-500', integrationId: 'whatsapp'        },
  { kind: 'mpesa',               label: 'M-Pesa',          description: 'Process M-Pesa mobile payments',            icon: CreditCard,    category: 'apps', badge: 'App', badgeClass: 'bg-emerald-500/10 text-emerald-700', iconClass: 'text-emerald-700', integrationId: 'mpesa'           },
  { kind: 'openai-app',          label: 'OpenAI',          description: 'Call OpenAI GPT models directly',           icon: Bot,           category: 'apps', badge: 'App', badgeClass: 'bg-gray-500/10 text-gray-700',       iconClass: 'text-gray-700',    integrationId: 'openai'          },
  { kind: 'google-calendar-app', label: 'Google Calendar', description: 'Create and manage calendar events',        icon: Zap,           category: 'apps', badge: 'App', badgeClass: 'bg-blue-500/10 text-blue-600',       iconClass: 'text-blue-500',    integrationId: 'google-calendar' },
  { kind: 'google-drive-app',    label: 'Google Drive',    description: 'Read and write files in Drive',             icon: Database,      category: 'apps', badge: 'App', badgeClass: 'bg-blue-500/10 text-blue-600',       iconClass: 'text-blue-500',    integrationId: 'google-drive'    },
  { kind: 'gmail-app',           label: 'Gmail',           description: 'Send emails via Gmail',                     icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-red-500/10 text-red-600',         iconClass: 'text-red-500',     integrationId: 'gmail'           },
  { kind: 'slack-app',           label: 'Slack',           description: 'Post messages to Slack channels',           icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-purple-500/10 text-purple-600',   iconClass: 'text-purple-500',  integrationId: 'slack'           },
  { kind: 'google-maps-app',     label: 'Google Maps',     description: 'Look up locations and directions',          icon: Zap,           category: 'apps', badge: 'App', badgeClass: 'bg-red-500/10 text-red-600',         iconClass: 'text-red-500',     integrationId: 'google-maps'     },
  { kind: 'notion-app',          label: 'Notion',          description: 'Read and write Notion pages and databases', icon: Database,      category: 'apps', badge: 'App', badgeClass: 'bg-gray-500/10 text-gray-700',       iconClass: 'text-gray-700',    integrationId: 'notion'          },
  { kind: 'hubspot-app',         label: 'HubSpot',         description: 'Manage contacts, deals, and CRM data',      icon: Database,      category: 'apps', badge: 'App', badgeClass: 'bg-orange-500/10 text-orange-600',   iconClass: 'text-orange-500',  integrationId: 'hubspot'         },
  { kind: 'salesforce-app',      label: 'Salesforce',      description: 'Query and update Salesforce records',       icon: Database,      category: 'apps', badge: 'App', badgeClass: 'bg-blue-500/10 text-blue-600',       iconClass: 'text-blue-500',    integrationId: 'salesforce'      },
  { kind: 'airtable-app',        label: 'Airtable',        description: 'Read and write Airtable bases and tables',  icon: Table,         category: 'apps', badge: 'App', badgeClass: 'bg-teal-500/10 text-teal-600',       iconClass: 'text-teal-500',    integrationId: 'airtable'        },
  { kind: 'github-app',          label: 'GitHub',          description: 'Interact with repos, issues, and PRs',      icon: Network,       category: 'apps', badge: 'App', badgeClass: 'bg-gray-500/10 text-gray-700',       iconClass: 'text-gray-700',    integrationId: 'github'          },
  { kind: 'jira-app',            label: 'Jira',            description: 'Create and update Jira issues and sprints', icon: GitBranch,     category: 'apps', badge: 'App', badgeClass: 'bg-blue-500/10 text-blue-600',       iconClass: 'text-blue-500',    integrationId: 'jira'            },
  { kind: 'stripe-app',          label: 'Stripe',          description: 'Process payments and manage subscriptions', icon: CreditCard,    category: 'apps', badge: 'App', badgeClass: 'bg-violet-500/10 text-violet-600',   iconClass: 'text-violet-500',  integrationId: 'stripe'          },
  { kind: 'postgresql-app',      label: 'PostgreSQL',      description: 'Run queries against a PostgreSQL database', icon: Database,      category: 'apps', badge: 'App', badgeClass: 'bg-blue-500/10 text-blue-600',       iconClass: 'text-blue-500',    integrationId: 'postgresql'      },
  { kind: 'snowflake-app',       label: 'Snowflake',       description: 'Query your Snowflake data warehouse',       icon: Database,      category: 'apps', badge: 'App', badgeClass: 'bg-sky-500/10 text-sky-600',         iconClass: 'text-sky-500',     integrationId: 'snowflake'       },
  { kind: 'zapier-app',          label: 'Zapier',          description: 'Trigger Zapier zaps from your workflow',    icon: Zap,           category: 'apps', badge: 'App', badgeClass: 'bg-orange-500/10 text-orange-600',   iconClass: 'text-orange-500',  integrationId: 'zapier'          },
  { kind: 'typeform-app',        label: 'Typeform',        description: 'Fetch responses from Typeform forms',       icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-indigo-500/10 text-indigo-600',   iconClass: 'text-indigo-500',  integrationId: 'typeform'        },
  { kind: 'linear-app',          label: 'Linear',          description: 'Create and manage Linear issues and cycles', icon: GitBranch,    category: 'apps', badge: 'App', badgeClass: 'bg-violet-500/10 text-violet-600',   iconClass: 'text-violet-500',  integrationId: 'linear'          },
  { kind: 'zendesk-app',         label: 'Zendesk',         description: 'Create and update Zendesk support tickets', icon: MessageSquare, category: 'apps', badge: 'App', badgeClass: 'bg-green-500/10 text-green-600',     iconClass: 'text-green-500',   integrationId: 'zendesk'         },

  // LOGIC
  { kind: 'code',        label: 'Code',        description: 'Run custom JavaScript',                  icon: Terminal,  category: 'logic', badge: 'Logic', badgeClass: 'bg-orange-500/10 text-orange-600', iconClass: 'text-orange-500' },
  { kind: 'python-code', label: 'Python',      description: 'Run custom Python code',                 icon: Terminal,  category: 'logic', badge: 'Logic', badgeClass: 'bg-blue-500/10 text-blue-600',     iconClass: 'text-blue-500'   },
  { kind: 'if-else',     label: 'If / Else',   description: 'Branch the flow based on a condition',  icon: GitBranch, category: 'logic', badge: 'Logic', badgeClass: 'bg-rose-500/10 text-rose-600',     iconClass: 'text-rose-500'   },
  { kind: 'ai-routing',  label: 'AI Routing',  description: 'Route messages using AI classification', icon: Shuffle,   category: 'logic', badge: 'Logic', badgeClass: 'bg-rose-500/10 text-rose-600',     iconClass: 'text-rose-500'   },
  { kind: 'loop-subflow', label: 'Loop Subflow', description: 'Iterate over a list of items',        icon: Repeat2,   category: 'logic', badge: 'Logic', badgeClass: 'bg-rose-500/10 text-rose-600',     iconClass: 'text-rose-500'   },

  // UTILS
  { kind: 'sticky-note',    label: 'Sticky Note',          description: 'Annotate your canvas with a note',        icon: StickyNote,    category: 'utils', badge: 'Util', badgeClass: 'bg-yellow-500/10 text-yellow-700', iconClass: 'text-yellow-600' },
  { kind: 'default-message', label: 'Default Message',    description: 'Set a fallback when nothing matches',     icon: MessageSquare, category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'delay',           label: 'Delay',               description: 'Pause workflow execution for a duration', icon: Timer,         category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'shared-memory',  label: 'Shared Memory',        description: 'Persist values across workflow runs',     icon: Brain,         category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'vector-store',   label: 'Dynamic Vector Store', description: 'Embed and search dynamic content',        icon: HardDrive,     category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'text-to-sql',    label: 'Text-to-SQL',          description: 'Convert natural language to SQL',         icon: Database,      category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'search-tables',  label: 'Search Tables',        description: 'Query structured database tables',        icon: Table,         category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'search-data',    label: 'Search Data',          description: 'Full-text search across your data',       icon: SearchCode,    category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'custom-api',     label: 'Custom API',           description: 'Make an HTTP request to any external API', icon: Webhook,      category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
  { kind: 'web-search',     label: 'Web Search',           description: 'Search the web and return live results',   icon: Search,       category: 'utils', badge: 'Util', badgeClass: 'bg-gray-500/10 text-gray-600',     iconClass: 'text-gray-500'   },
];

export function getNodeDef(kind: NodeKind): NodeDef | undefined {
  return NODE_DEFS.find(n => n.kind === kind);
}

export const KIND_PREFIX: Record<string, string> = {
  'text-input':        'in',
  url:                 'url',
  files:               'files',
  trigger:             'trigger',
  'audio-input':       'audio',
  'image-input':       'img-in',
  'typeform-trigger':  'typeform-trig',
  output:              'out',
  action:              'action',
  'audio-output':      'text2audio',
  'template-out':      'template',
  'image-output':      'img-out',
  'ai-agent':          'llm',
  'knowledge-base':    'kb',
  'prune-ai':          'prune',
  'subflow-tool':      'tool',
  workflow:            'wf',
  'human-in-the-loop': 'human',
  whatsapp:            'wa',
  mpesa:               'mpesa',
  'openai-app':        'openai',
  'slack-app':         'slack',
  'gmail-app':         'gmail',
  'google-calendar-app': 'gcal',
  'google-drive-app':  'gdrive',
  'google-maps-app':   'gmaps',
  'notion-app':        'notion',
  'hubspot-app':       'hubspot',
  'salesforce-app':    'sf',
  'airtable-app':      'airtable',
  'github-app':        'gh',
  'jira-app':          'jira',
  'stripe-app':        'stripe',
  'postgresql-app':    'pg',
  'snowflake-app':     'snow',
  'zapier-app':        'zapier',
  'typeform-app':      'typeform',
  'linear-app':        'linear',
  'zendesk-app':       'zendesk',
  'if-else':           'if',
  code:                'code',
  'python-code':       'py',
  'ai-routing':        'router',
  'loop-subflow':      'loop',
  'sticky-note':       'note',
  'default-message':   'msg',
  delay:               'delay',
  'shared-memory':     'mem',
  'vector-store':      'vs',
  'text-to-sql':       'sql',
  'search-tables':     'tbl',
  'search-data':       'search',
  'custom-api':        'api',
  'web-search':        'web',
};

export function getNodeIdentifier(node: CanvasNode, nodes: CanvasNode[]): string {
  const prefix = KIND_PREFIX[node.kind] ?? node.kind.split('-')[0];
  const sameKind = nodes.filter(n => n.kind === node.kind);
  const index = Math.max(0, sameKind.findIndex(n => n.id === node.id));
  return `${prefix}-${index}`;
}

export function getNodesByCategory(category: NodeCategory): NodeDef[] {
  return NODE_DEFS.filter(n => n.category === category);
}

export interface SubflowTool {
  id: string;
  name: string;
  description: string;
}

export interface CanvasNode {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  inputValue?: string;
  systemPrompt?: string;
  model?: string;
  code?: string;
  knowledgeBases?: string[];
  subflowTools?: SubflowTool[];
  stickyNote?: {
    visible: boolean;
    text: string;
    color: string;
  };
  // text-input specific
  outputKey?: string;
  placeholder?: string;
  required?: boolean;
  // files node specific
  exposeAsInput?: boolean;
  enableParsing?: boolean;
  enableOcr?: boolean;
  fileChunkSize?: number;
  fileChunkOverlap?: number;
  fileChunkingMethod?: 'naive' | 'sentence';
  preloadedFiles?: Array<{ id: string; name: string; type: string; text: string; size: number }>;
  // trigger node specific
  triggerType?: 'manual' | 'scheduled' | 'webhook' | 'integration';
  triggerScheduleCron?: string;
  triggerIntegrationId?: string;
  triggerIntegrationEvent?: string;
  triggerSampleInput?: string;
  /** User-configured event filters, e.g. { channel: '#general', contains: 'urgent' } */
  triggerFilters?: Record<string, string>;
  /** Human-readable event label stored for display, e.g. "Message Received" */
  triggerEventLabel?: string;
  // audio-input node specific
  audioSource?: 'url' | 'upload' | 'recording';
  audioSourceUrl?: string;
  audioProvider?: 'deepgram' | 'whisper-1';
  audioModel?: 'nova-2' | 'nova' | 'enhanced' | 'base';
  audioSubmodel?: string;
  audioApiKey?: string;
  // template-out node specific
  templateContent?: string;
  templateContentDoc?: Record<string, unknown>;
  // audio-output (TTS) node specific
  ttsModel?: string;
  ttsVoice?: string;
  ttsApiKey?: string;
  // output node specific
  outputTemplate?: string;
  outputTemplateDoc?: Record<string, unknown>;
  // url node specific
  urlExtractionMode?: 'html' | 'metadata';
  urlEnableSubpageCrawl?: boolean;
  urlEnableAsInput?: boolean;
  urlChunkSize?: number;
  urlChunkOverlapPct?: number;
  urlChunkingMethod?: 'naive' | 'sentence';
  urlEnableOcr?: boolean;
  // workflow call node specific
  workflowCallInputMappings?: Array<{ key: string; value: string }>;
  workflowCallOutputMappings?: Array<{ key: string; outputKey: string }>;
  workflowCallTimeout?: number;
  workflowCallOnError?: 'fail' | 'continue';
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

export function getModelProvider(modelId: string): string {
  const m = modelId.toLowerCase();
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')) return 'openai';
  if (m.startsWith('claude')) return 'anthropic';
  if (m.startsWith('gemini')) return 'google';
  if (m.startsWith('together-')) return 'togetherai';
  if (m.startsWith('cerebras-')) return 'cerebras';
  if (m.startsWith('llama')) return 'meta';
  if (m.startsWith('grok')) return 'xai';
  if (m.startsWith('sonar')) return 'perplexity';
  if (m.startsWith('mistral') || m.startsWith('codestral') || m.startsWith('mixtral')) return 'mistral';
  return 'anthropic';
}

export interface CanvasEdge {
  id: string;
  sourceId: string;
  targetId: string;
}
