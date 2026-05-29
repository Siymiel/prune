import { type CanvasNode, type NodeKind, getNodeIdentifier } from '@/lib/editor-nodes';
import { buildChipIconEl, type ChipMeta, type ChipType } from './chip-icons';

export type { ChipType, ChipMeta };

export const TOOL_SUGGESTIONS = [
  { id: 'web-search',      label: 'Web Search'      },
  { id: 'code-execution',  label: 'Code Execution'  },
  { id: 'image-generator', label: 'Image Generator' },
  { id: 'knowledge-base',  label: 'Knowledge Base'  },
  { id: 'calculator',      label: 'Calculator'      },
];

export const VARIABLE_SUGGESTIONS = [
  { id: 'user_message', label: 'User Message' },
  { id: 'session_id',   label: 'Session ID'   },
  { id: 'user_id',      label: 'User ID'      },
  { id: 'timestamp',    label: 'Timestamp'    },
  { id: 'current_date', label: 'Current Date' },
];

export const NODE_XML_TAG: Partial<Record<NodeKind, string>> = {
  'text-input':    'UserMessage',
  url:             'WebSearch',
  files:           'Documents',
  'audio-input':   'AudioInput',
  'knowledge-base':'KnowledgeBase',
  'ai-agent':      'AgentOutput',
  'prune-ai':      'AgentOutput',
  'openai-app':    'AgentOutput',
  output:          'Output',
  trigger:         'TriggerData',
  'shared-memory': 'Memory',
  'vector-store':  'VectorStore',
};

export const TOOL_XML_TAG: Record<string, string> = {
  'web-search':      'WebSearch',
  'code-execution':  'CodeExecution',
  'image-generator': 'ImageGenerator',
  'knowledge-base':  'KnowledgeBase',
  calculator:        'Calculator',
};

export const VARIABLE_XML_TAG: Record<string, string> = {
  user_message: 'UserMessage',
  session_id:   'SessionID',
  user_id:      'UserID',
  timestamp:    'Timestamp',
  current_date: 'CurrentDate',
};

const CHIP_CLASS = [
  'inline-flex items-center align-middle mx-[3px] px-1.5 py-[3px] rounded text-[13px]',
  'font-medium cursor-default select-none whitespace-nowrap',
  'bg-gray-100 border border-gray-200 text-gray-500',
].join(' ');

export function parseValue(raw: string) {
  const segs: Array<{ type: 'text' | ChipType; text?: string; id?: string; label?: string }> = [];
  const re = /\{\{(node|tool|variable):([^|]+)\|([^}]+)\}\}/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) segs.push({ type: 'text', text: raw.slice(last, m.index) });
    segs.push({ type: m[1] as ChipType, id: m[2], label: m[3] });
    last = m.index + m[0].length;
  }
  if (last < raw.length) segs.push({ type: 'text', text: raw.slice(last) });
  return segs;
}

export function buildChip(type: ChipType, id: string, label: string, meta?: ChipMeta): HTMLSpanElement {
  const span = document.createElement('span');
  span.contentEditable = 'false';
  span.dataset.mentionType = type;
  span.dataset.id = id;
  span.dataset.label = label;
  span.className = CHIP_CLASS;
  span.appendChild(buildChipIconEl(type, meta));
  span.appendChild(document.createTextNode(type === 'variable' ? `{${label}}` : label));
  return span;
}

export function mountValue(el: HTMLDivElement, raw: string, nodes: CanvasNode[]) {
  el.innerHTML = '';
  for (const seg of parseValue(raw)) {
    if (seg.type === 'text') {
      (seg.text ?? '').split('\n').forEach((line, i, arr) => {
        if (line) el.appendChild(document.createTextNode(line));
        if (i < arr.length - 1) el.appendChild(document.createElement('br'));
      });
    } else {
      let meta: ChipMeta | undefined;
      if (seg.type === 'node') {
        const node = nodes.find(n => getNodeIdentifier(n, nodes) === seg.id);
        if (node) meta = { kind: node.kind as NodeKind, model: node.model };
      }
      el.appendChild(buildChip(seg.type, seg.id!, seg.label!, meta));
    }
  }
}

export function readValue(el: HTMLDivElement): string {
  function walk(n: ChildNode): string {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? '';
    if (!(n instanceof HTMLElement)) return '';
    const t = n.dataset.mentionType as ChipType | undefined;
    if (t) return `{{${t}:${n.dataset.id}|${n.dataset.label}}}`;
    if (n.tagName === 'BR') return '\n';
    return Array.from(n.childNodes).map(walk).join('');
  }
  return Array.from(el.childNodes).map(walk).join('');
}
