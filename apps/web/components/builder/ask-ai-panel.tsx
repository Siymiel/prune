'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Mic, ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat } from '@/lib/api';
import { getNodeDef, getNodeIdentifier, type CanvasNode, type CanvasEdge } from '@/lib/editor-nodes';
import { renderIntegrationIcon } from '@/components/templates/integration-logo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface AskAIPanelProps {
  open: boolean;
  onClose: () => void;
  workflowName?: string;
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
}

const SUGGESTIONS = [
  'Give me an overview of how this flow works.',
  'What actions could be added to this workflow?',
  'Use your generate workflow tool to generate a workflow that receives an email and sends an email with the content LLM-generated.',
];

function BlocksLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="13" height="13" rx="3" fill="#1a1a1a" />
      <rect x="19" y="4" width="13" height="13" rx="3" fill="#3d3d3d" />
      <rect x="4" y="19" width="13" height="13" rx="3" fill="#3d3d3d" />
      <rect x="19" y="19" width="13" height="13" rx="3" fill="#6b6b6b" />
    </svg>
  );
}

function MiniBlocksIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="#1a1a1a" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="#3d3d3d" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="#3d3d3d" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="#6b6b6b" />
    </svg>
  );
}

export function AskAIPanel({ open, onClose, workflowName, nodes = [], edges = [] }: AskAIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  // 'workflow' = Entire Workflow; string = nodeId
  const [contextItems, setContextItems] = useState<Array<'workflow' | string>>(['workflow']);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handle = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [pickerOpen]);

  const removeContext = useCallback((item: string) => {
    setContextItems(prev => prev.filter(i => i !== item));
  }, []);

  const addContext = useCallback((item: 'workflow' | string) => {
    setContextItems(prev => [...prev, item]);
    setPickerOpen(false);
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;
    setInput('');

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg: Message = { role: 'user', content };
    const assistantMsg: Message = { role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    abortRef.current = false;

    // Serialize selected context into a structured description for the model
    const name = workflowName ?? 'Untitled Workflow';
    let contextStr = '';

    const includesWorkflow = contextItems.includes('workflow');
    const selectedNodeIds = contextItems.filter(i => i !== 'workflow');
    const targetNodes = includesWorkflow ? nodes : nodes.filter(n => selectedNodeIds.includes(n.id));

    if (targetNodes.length > 0) {
      contextStr += `\n\n## Workflow: "${name}"\n\n### Nodes:\n`;
      targetNodes.forEach(node => {
        const def = getNodeDef(node.kind);
        const id = getNodeIdentifier(node, nodes);
        contextStr += `- [${id}] ${node.label} (type: ${def?.kind ?? node.kind})`;
        if (node.model) contextStr += ` | model: ${node.model}`;
        contextStr += '\n';
        if (node.systemPrompt) {
          const truncated = node.systemPrompt.length > 300 ? node.systemPrompt.slice(0, 300) + '…' : node.systemPrompt;
          contextStr += `  instructions: ${truncated}\n`;
        }
        if (node.inputValue) {
          const truncated = node.inputValue.length > 300 ? node.inputValue.slice(0, 300) + '…' : node.inputValue;
          contextStr += `  prompt/input: ${truncated}\n`;
        }
      });

      if (includesWorkflow && edges.length > 0) {
        contextStr += '\n### Connections:\n';
        edges.forEach(edge => {
          const src = nodes.find(n => n.id === edge.sourceId);
          const tgt = nodes.find(n => n.id === edge.targetId);
          if (src && tgt) {
            contextStr += `- [${getNodeIdentifier(src, nodes)}] ${src.label} → [${getNodeIdentifier(tgt, nodes)}] ${tgt.label}\n`;
          }
        });
      }
    }

    const systemPrompt = `You are a helpful workflow building assistant for Prune AI. You help non-technical users understand and build automation workflows. Keep responses concise and practical.${contextStr}`;

    try {
      for await (const token of streamChat(content, { systemPrompt, history })) {
        if (abortRef.current) break;
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: m.content + token } : m,
        ));
        scrollToBottom();
      }
    } catch {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1
          ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false }
          : m,
      ));
    } finally {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, streaming: false } : m,
      ));
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, workflowName, nodes, edges, contextItems, scrollToBottom]);

  // Items available to add (not yet selected)
  const pickerOptions: Array<{ type: 'workflow' } | { type: 'node'; node: CanvasNode }> = [
    ...(!contextItems.includes('workflow') ? [{ type: 'workflow' as const }] : []),
    ...nodes
      .filter(n => !contextItems.includes(n.id))
      .map(n => ({ type: 'node' as const, node: n })),
  ];

  return (
    <div
      className={cn(
        'absolute left-[52px] top-0 bottom-0 w-[560px] bg-white border-r flex flex-col z-40 shadow-sm',
        'transition-[transform,opacity] duration-200 ease-in-out',
        open
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : '-translate-x-full opacity-0 pointer-events-none',
      )}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <div className="flex items-start justify-between mb-4">
          <BlocksLogo />
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 mb-1">
          <h2 className="text-[18px] font-semibold leading-tight text-gray-900">Workflow AI</h2>
          <span className="text-[11px] font-[500] px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 leading-none">
            Beta
          </span>
        </div>
        <p className="text-[14px] font-[450] text-gray-500 leading-snug">
          Ask me any question about this workflow
        </p>
      </div>

      {/* Context chip row */}
      <div className="px-4 pb-3 shrink-0 flex items-center gap-2 flex-wrap">
        {contextItems.map(item => {
          if (item === 'workflow') {
            return (
              <div key="workflow" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[13px] font-[450] text-gray-700 border border-gray-200">
                <MiniBlocksIcon />
                Entire Workflow
                <button
                  onClick={() => removeContext('workflow')}
                  className="ml-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          }
          const node = nodes.find(n => n.id === item);
          if (!node) return null;
          const def = getNodeDef(node.kind);
          const identifier = getNodeIdentifier(node, nodes);
          const Icon = def?.icon;
          return (
            <div key={item} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[13px] font-[450] text-gray-700 border border-gray-200">
              {def?.integrationId
                ? renderIntegrationIcon(def.integrationId, 12)
                : Icon && <Icon className={cn('h-3 w-3 shrink-0', def?.iconClass)} />
              }
              {node.label}
              <span className="text-gray-400 text-[11px]">({identifier})</span>
              <button
                onClick={() => removeContext(item)}
                className="ml-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          );
        })}

        {/* + Add context trigger */}
        <div ref={pickerRef} className="relative">
          <button
            onClick={() => setPickerOpen(o => !o)}
            className="flex items-center gap-1 text-[14px] font-[450] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add context
          </button>

          {pickerOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {/* Popup header */}
              <div className="px-3.5 py-1.5 border-b border-prune-borderGray">
                <span className="text-[14px] font-medium text-gray-800">Add context</span>
              </div>

              {pickerOptions.length === 0 ? (
                <p className="px-3.5 py-3 text-[14px] font-[450] text-gray-400">
                  All context added
                </p>
              ) : (
                pickerOptions.map((opt, idx) => {
                  if (opt.type === 'workflow') {
                    return (
                      <button
                        key="workflow"
                        onClick={() => addContext('workflow')}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left transition-colors',
                          idx < pickerOptions.length - 1 && 'border-b border-gray-200',
                        )}
                      >
                        <MiniBlocksIcon />
                        <span className="text-[14px] font-[450] text-gray-700">Entire Workflow</span>
                      </button>
                    );
                  }
                  const { node } = opt;
                  const def = getNodeDef(node.kind);
                  const identifier = getNodeIdentifier(node, nodes);
                  const Icon = def?.icon;
                  return (
                    <div className="px-2 py-1 rounded-md" key={node.id}>
                      <button
                      onClick={() => addContext(node.id)}
                      className={cn(
                        'w-full flex items-center rounded-md border border-prune-borderGray gap-2.5 px-3.5 py-1 hover:bg-prune-lightGray text-left transition-colors',
                        idx < pickerOptions.length - 1 && 'border-b border-prune-borderGray',
                      )}
                    >
                      <div className="h-[15px] w-[15px] flex items-center justify-center shrink-0">
                        {def?.integrationId
                          ? renderIntegrationIcon(def.integrationId, 14)
                          : Icon
                            ? <Icon className={cn('h-[15px] w-[15px]', def?.iconClass)} />
                            : null
                        }
                      </div>
                      <span className="text-[14px] font-[450] text-gray-700 min-w-0 truncate">
                        {node.label}{' '}
                        <span className="text-gray-400">({identifier})</span>
                      </span>
                    </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-gray-100 shrink-0" />

      {/* Empty state: centered input + suggestions below */}
      {messages.length === 0 ? (
        <div className="flex flex-col flex-1 justify-center gap-4 px-4 pb-6 pt-2 overflow-y-auto">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden focus-within:border-gray-300 focus-within:shadow-[0_1px_6px_rgba(0,0,0,0.10)] transition-all">
            <textarea
              ref={inputRef}
              rows={3}
              className="w-full resize-none bg-transparent text-[14px] font-[450] outline-none placeholder:text-gray-400 leading-relaxed px-4 pt-3.5 pb-1"
              placeholder="Write a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isStreaming}
            />
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Voice input (coming soon)">
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150',
                  input.trim() && !isStreaming
                    ? 'bg-gray-900 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                )}
              >
                {isStreaming
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <ArrowUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="w-full text-left flex items-start gap-3 px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-[450] text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <ArrowUp className="h-[14px] w-[14px] mt-0.5 shrink-0 text-gray-400" />
                <span className="leading-snug">{s}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] font-[450] leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md',
                  )}>
                    {msg.content}
                    {msg.streaming && msg.content === '' && (
                      <span className="inline-flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" />
                      </span>
                    )}
                    {msg.streaming && msg.content !== '' && (
                      <span className="inline-block w-0.5 h-[14px] bg-current ml-0.5 animate-pulse rounded-full align-middle" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4 pt-3 shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden focus-within:border-gray-300 focus-within:shadow-[0_1px_6px_rgba(0,0,0,0.10)] transition-all">
              <textarea
                ref={inputRef}
                rows={3}
                className="w-full resize-none bg-transparent text-[14px] font-[450] outline-none placeholder:text-gray-400 leading-relaxed px-4 pt-3.5 pb-1"
                placeholder="Write a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isStreaming}
              />
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Voice input (coming soon)">
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150',
                    input.trim() && !isStreaming
                      ? 'bg-gray-900 text-white hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                  )}
                >
                  {isStreaming
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ArrowUp className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
