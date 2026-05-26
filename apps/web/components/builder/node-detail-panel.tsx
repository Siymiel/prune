'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Link2, Settings2, Cpu, Database, Zap, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNodeDef, type CanvasNode, type NodeDef } from '@/lib/editor-nodes';
import { renderIntegrationIcon } from '@/components/templates/integration-logo';

const KIND_PREFIX: Record<string, string> = {
  'text-input': 'in',
  'url': 'url',
  'files': 'files',
  'trigger': 'trigger',
  'audio-input': 'audio',
  'output': 'out',
  'action': 'action',
  'audio-output': 'audio-out',
  'template-output': 'tpl',
  'ai-agent': 'ai',
  'knowledge-base': 'kb',
  'prune-ai': 'prune',
  'whatsapp-app': 'wa',
  'mpesa': 'mpesa',
  'openai-app': 'openai',
  'slack-app': 'slack',
  'gmail-app': 'gmail',
  'sheets-app': 'sheets',
  'calendar-app': 'cal',
  'notion-app': 'notion',
  'airtable-app': 'airtable',
  'if-else': 'if',
  'code': 'code',
  'loop': 'loop',
  'ai-routing': 'router',
  'sticky-note': 'note',
  'default-message': 'msg',
  'delay': 'delay',
  'shared-memory': 'mem',
  'vector-store': 'vs',
  'text-to-sql': 'sql',
  'search-tables': 'tbl',
  'search-data': 'search',
};

function getNodeIdentifier(node: CanvasNode, nodes: CanvasNode[]): string {
  const prefix = KIND_PREFIX[node.kind] ?? node.kind.split('-')[0];
  const sameKind = nodes.filter(n => n.kind === node.kind);
  const index = Math.max(0, sameKind.findIndex(n => n.id === node.id));
  return `${prefix}-${index}`;
}

function Section({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <span className="flex-1 text-left text-sm font-medium">{title}</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring';
const textareaClass = `${inputClass} resize-none font-mono`;

function PanelSections({
  node,
  def,
  onUpdateValue,
}: {
  node: CanvasNode;
  def: NodeDef;
  onUpdateValue: (id: string, value: string) => void;
}) {
  if (def.kind === 'url') {
    return (
      <>
        <Section title="Test URL" icon={<Link2 className="h-3.5 w-3.5" />} defaultOpen>
          <FieldLabel>Website URL</FieldLabel>
          <input
            type="url"
            className={inputClass}
            placeholder="https://example.com"
            value={node.inputValue ?? ''}
            onChange={e => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">No options configured.</p>
        </Section>
        <Section title="Chunking Settings" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">Using default chunking settings.</p>
        </Section>
      </>
    );
  }

  if (def.kind === 'text-input') {
    return (
      <>
        <Section title="Value" icon={<AlignLeft className="h-3.5 w-3.5" />} defaultOpen>
          <FieldLabel>Default value</FieldLabel>
          <textarea
            className={textareaClass}
            rows={4}
            placeholder="Enter value or leave blank for user input…"
            value={node.inputValue ?? ''}
            onChange={e => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">No options configured.</p>
        </Section>
      </>
    );
  }

  if (def.kind === 'ai-agent' || def.kind === 'prune-ai') {
    return (
      <>
        <Section title="Prompt" icon={<Cpu className="h-3.5 w-3.5" />} defaultOpen>
          <FieldLabel>System prompt</FieldLabel>
          <textarea
            className={textareaClass}
            rows={5}
            placeholder="You are a helpful assistant that…"
            value={node.inputValue ?? ''}
            onChange={e => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Model" icon={<Cpu className="h-3.5 w-3.5" />}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded-sm bg-primary/20 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            claude-sonnet-4-6
          </div>
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">No options configured.</p>
        </Section>
      </>
    );
  }

  if (def.kind === 'knowledge-base') {
    return (
      <>
        <Section title="Source" icon={<Database className="h-3.5 w-3.5" />} defaultOpen>
          <FieldLabel>Knowledge base</FieldLabel>
          <div className="w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-muted-foreground/50">
            Select a knowledge base…
          </div>
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">No options configured.</p>
        </Section>
      </>
    );
  }

  if (def.kind === 'trigger') {
    return (
      <>
        <Section title="Event" icon={<Zap className="h-3.5 w-3.5" />} defaultOpen>
          <div className="px-3 py-2 bg-muted/30 border rounded-md text-xs text-muted-foreground">
            Event: <span className="text-foreground font-medium">WhatsApp message received</span>
          </div>
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">No options configured.</p>
        </Section>
      </>
    );
  }

  return (
    <>
      <Section title="Configuration" icon={<Settings2 className="h-3.5 w-3.5" />} defaultOpen>
        {def.badge === 'App' ? (
          <div className="px-3 py-2 bg-muted/30 border rounded-md text-xs text-muted-foreground leading-relaxed">
            {def.description}
          </div>
        ) : def.badge === 'Output' ? (
          <>
            <FieldLabel>Output value</FieldLabel>
            <div className="px-3 py-1.5 text-xs bg-muted/30 border rounded-md text-muted-foreground/50 font-mono">
              {'{{result}}'}
            </div>
          </>
        ) : (
          <>
            <FieldLabel>Value</FieldLabel>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder={def.description}
              value={node.inputValue ?? ''}
              onChange={e => onUpdateValue(node.id, e.target.value)}
            />
          </>
        )}
      </Section>
      <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground">No options configured.</p>
      </Section>
    </>
  );
}

interface NodeDetailPanelProps {
  node: CanvasNode;
  nodes: CanvasNode[];
  onClose: () => void;
  onUpdateValue: (id: string, value: string) => void;
}

export function NodeDetailPanel({ node, nodes, onClose, onUpdateValue }: NodeDetailPanelProps) {
  const def = getNodeDef(node.kind);
  if (!def) return null;

  const Icon = def.icon;
  const identifier = getNodeIdentifier(node, nodes);

  return (
    <div className="w-full h-full bg-background rounded-xl border shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <div className="h-7 w-7 rounded-md bg-muted/50 border flex items-center justify-center shrink-0">
          {def.integrationId
            ? renderIntegrationIcon(def.integrationId, 14)
            : <Icon className={cn('h-3.5 w-3.5', def.iconClass)} />}
        </div>
        <span className="text-sm font-semibold flex-1 truncate">{node.label}</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border text-muted-foreground shrink-0">
          {identifier}
        </span>
        <button
          onClick={onClose}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-0.5 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b shrink-0">
        <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-[3px]">
        <PanelSections node={node} def={def} onUpdateValue={onUpdateValue} />
      </div>
    </div>
  );
}
