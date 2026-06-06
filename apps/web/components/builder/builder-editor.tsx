'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, ListChecks } from 'lucide-react';
import { getTemplate } from '@/lib/templates';
import { api, type KnowledgeBaseOut } from '@/lib/api';
import { EditorTopbar, type EditorTab } from './editor-topbar';
import { ExportView } from './export-view';
import { EditorSidebar } from './editor-sidebar';
import { EditorCanvas } from './editor-canvas';
import { NodeDetailPanel } from './panels';
import { ChecklistModal } from './checklist-modal';
import { getNodeDef, type CanvasNode, type CanvasEdge, type NodeKind, type NodeRunStatus, type RunPhase } from '@/lib/editor-nodes';
import { AskAIPanel } from './ask-ai-panel';
import { RunProgressPanel } from './run-progress-panel';
import { cn } from '@/lib/utils';
import type { RunOut, KnowledgeSource } from '@/lib/api';
import { streamRun } from '@/lib/api';
import type { NodeType } from '@/lib/types';
import { useAuthStore } from '@/lib/auth-store';
import { useWorkspaceVariablesStore } from '@/lib/workspace-variables-store';

const MAX_HISTORY = 50;

const EXAMPLE_NODES: CanvasNode[] = [
  { id: 'ex-in-1',   kind: 'text-input', label: 'Text Input',      x: 80,  y: 220, inputValue: 'Hello from Prune!' },
  { id: 'ex-code-1', kind: 'code',       label: 'Format Message',  x: 360, y: 220, code: 'msg = state.get("message", "")\noutput["result"] = msg.upper()\noutput["word_count"] = len(msg.split())\noutput["char_count"] = len(msg)' },
  { id: 'ex-out-1',  kind: 'output',     label: 'Output',          x: 640, y: 220 },
];
const EXAMPLE_EDGES: CanvasEdge[] = [
  { id: 'ex-e-1', sourceId: 'ex-in-1',   targetId: 'ex-code-1' },
  { id: 'ex-e-2', sourceId: 'ex-code-1', targetId: 'ex-out-1'  },
];

const LLM_EXAMPLE_NODES: CanvasNode[] = [
  { id: 'llm-in-1',    kind: 'text-input', label: 'User Question', x: 80,  y: 220, inputValue: 'Explain quantum computing in simple terms.' },
  { id: 'llm-agent-1', kind: 'ai-agent',   label: 'AI Assistant',  x: 360, y: 220, model: 'claude-sonnet-4-6', systemPrompt: "You are a helpful AI assistant. Answer the user's question clearly and concisely. Keep responses easy to understand." },
  { id: 'llm-out-1',   kind: 'output',     label: 'Response',      x: 640, y: 220 },
];
const LLM_EXAMPLE_EDGES: CanvasEdge[] = [
  { id: 'llm-e-1', sourceId: 'llm-in-1',    targetId: 'llm-agent-1' },
  { id: 'llm-e-2', sourceId: 'llm-agent-1', targetId: 'llm-out-1'  },
];

function buildKbExampleNodes(kbId?: string): CanvasNode[] {
  return [
    { id: 'kb-in-1',    kind: 'text-input', label: 'User Question',  x: 80,  y: 220, inputValue: 'What information do you have?' },
    {
      id: 'kb-agent-1', kind: 'ai-agent',   label: 'KB Q&A Agent',   x: 360, y: 220,
      model: 'claude-sonnet-4-6',
      systemPrompt: "You are a knowledgeable document assistant. Answer questions using only the provided knowledge base. Be concise and accurate. If the answer is not in the knowledge base, clearly state that you don't have that information — do not speculate or fabricate an answer.",
      inputValue: "Search the connected knowledge base for relevant context, then answer the user's question. Quote directly from the source when helpful, and always indicate which document the information came from.",
      knowledgeBases: kbId ? [kbId] : [],
    },
    { id: 'kb-out-1',   kind: 'output',     label: 'Answer',          x: 640, y: 220 },
  ];
}
const KB_EXAMPLE_EDGES: CanvasEdge[] = [
  { id: 'kb-e-1', sourceId: 'kb-in-1',    targetId: 'kb-agent-1' },
  { id: 'kb-e-2', sourceId: 'kb-agent-1', targetId: 'kb-out-1'  },
];

const STICKY_COLORS = [
  '#FEF9C3', '#FCE7F3', '#DBEAFE', '#D1FAE5',
  '#EDE9FE', '#FFEDD5', '#E0F2FE', '#FEE2E2',
];
function randomStickyColor() {
  return STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
}

interface BuilderEditorProps {
  templateSlug: string | null;
  workflowId?: string | null;
}

type Snapshot = { nodes: CanvasNode[]; edges: CanvasEdge[] };

function workflowTypeToKind(type: NodeType, label: string): NodeKind {
  const lo = label.toLowerCase();
  if (type === 'trigger') return 'trigger';
  if (type === 'payment') return 'mpesa';
  if (type === 'data') return 'knowledge-base';
  if (type === 'logic') return 'if-else';
  if (type === 'ai') {
    if (lo.includes('classif') || lo.includes('rout')) return 'ai-routing';
    if (lo.includes('respond') || lo.includes('reply') || lo.includes('generat')) return 'ai-agent';
    return 'ai-agent';
  }
  return 'output';
}

function buildInitialState(slug: string | null): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  if (!slug) return { nodes: [], edges: [] };
  const template = getTemplate(slug);
  if (!template) return { nodes: [], edges: [] };

  const SPACING = 340;
  const START_X = 80;
  const START_Y = 180;

  const nodes: CanvasNode[] = template.workflow.map((wn, i) => ({
    id: `wn-${i}`,
    kind: workflowTypeToKind(wn.type, wn.label),
    label: wn.label,
    x: START_X + i * SPACING,
    y: START_Y,
  }));

  const edges: CanvasEdge[] = nodes.slice(0, -1).map((n, i) => ({
    id: `we-${i}`,
    sourceId: n.id,
    targetId: nodes[i + 1].id,
  }));

  return { nodes, edges };
}

interface RunState {
  phase: RunPhase;
  nodeStatuses: Record<string, NodeRunStatus>;
  startedAt: number;
  currentNodeLabel?: string;
  errorMessage?: string;
}

function topoSort(nodes: CanvasNode[], edges: CanvasEdge[]): string[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  const outEdges: Record<string, string[]> = {};
  const indegree: Record<string, number> = {};
  nodes.forEach(n => { outEdges[n.id] = []; indegree[n.id] = 0; });
  edges.forEach(e => {
    if (nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)) {
      outEdges[e.sourceId].push(e.targetId);
      indegree[e.targetId]++;
    }
  });
  const queue = nodes.filter(n => indegree[n.id] === 0).map(n => n.id);
  const result: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    result.push(id);
    for (const t of outEdges[id]) { if (--indegree[t] === 0) queue.push(t); }
  }
  nodes.forEach(n => { if (!result.includes(n.id)) result.push(n.id); });
  return result;
}

function getDefaultPanelWidth() {
  if (typeof window === 'undefined') return 460;
  const vw = window.innerWidth;
  if (vw < 1024) return Math.max(280, Math.floor(vw * 0.36));
  if (vw < 1280) return Math.max(360, Math.floor(vw * 0.32));
  return 460;
}

function getMinPanelWidth() {
  if (typeof window === 'undefined') return 360;
  return Math.max(260, Math.floor(window.innerWidth * 0.22));
}

export function BuilderEditor({ templateSlug, workflowId = null }: BuilderEditorProps) {
  const template = templateSlug ? getTemplate(templateSlug) : null;
  const init = buildInitialState(templateSlug);

  const { user } = useAuthStore();
  const { variables: workspaceVariables } = useWorkspaceVariablesStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as EditorTab | null;
  const [activeTab, setActiveTab] = useState<EditorTab>(tabParam ?? 'workflow');

  const handleTabChange = useCallback((tab: EditorTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'workflow') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
  const [nodes, setNodes] = useState<CanvasNode[]>(init.nodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(init.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailSection, setDetailSection] = useState<{ section: "tools" | "knowledge-sources"; trigger: number } | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string; at: number } | null>(null);
  const [panelWidth, setPanelWidth] = useState(460);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(460);

  // Set panel width once on mount to match the actual viewport
  useEffect(() => {
    const w = getDefaultPanelWidth();
    setPanelWidth(w);
    dragStartWidthRef.current = w;
  }, []);

  // ── API workflow persistence ──────────────────────────────────────────────
  const [apiWorkflowId, setApiWorkflowId] = useState<string | null>(workflowId);
  const apiWorkflowIdRef = useRef<string | null>(workflowId);
  const [workflowName, setWorkflowName] = useState<string>(template?.name ?? 'Untitled Workflow');
  const workflowNameRef = useRef<string>(template?.name ?? 'Untitled Workflow');
  useEffect(() => { workflowNameRef.current = workflowName; }, [workflowName]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load existing workflow from API on mount
  useEffect(() => {
    if (!workflowId) return;
    api.workflows.get(workflowId).then(wf => {
      setNodes(wf.graph?.nodes as CanvasNode[] ?? []);
      setEdges(wf.graph?.edges as CanvasEdge[] ?? []);
      setWorkflowName(wf.name);
    }).catch(() => { /* not found or offline — keep blank canvas */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autosave to API (falls back to localStorage when API unavailable) ─────
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True only when a real content edit happened (not just a position drag).
  const hasContentChangeRef = useRef(false);

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (!hasContentChangeRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!hasContentChangeRef.current) return;
      hasContentChangeRef.current = false;
      setSaveState('saving');
      const graph = { nodes, edges };
      try {
        if (apiWorkflowIdRef.current) {
          await api.workflows.update(apiWorkflowIdRef.current, { graph, name: workflowNameRef.current });
        } else {
          const wf = await api.workflows.create({ name: workflowNameRef.current, graph });
          apiWorkflowIdRef.current = wf.id;
          setApiWorkflowId(wf.id);
          const params = new URLSearchParams(searchParams.toString());
          params.set('workflowId', wf.id);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
        setSaveState('saved');
        setLastSavedAt(Date.now());
      } catch {
        setSaveState('error');
        try {
          localStorage.setItem(`prune-draft-${templateSlug ?? 'untitled'}`, JSON.stringify(graph));
        } catch { /* storage full — ignore */ }
      }
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Hide the autosave pill 20 s after the last save
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = setTimeout(() => setLastSavedAt(null), 60_000);
    return () => clearTimeout(id);
  }, [lastSavedAt]);

  // ── Run workflow ──────────────────────────────────────────────────────────
  const [runState, setRunState] = useState<RunState>({ phase: 'idle', nodeStatuses: {}, startedAt: 0 });
  const [runResult, setRunResult] = useState<RunOut | null>(null);
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, string>>({});
  const [runSources, setRunSources] = useState<KnowledgeSource[]>([]);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const runIdRef = useRef(0);
  // Simulation state: incrementing simCancelRef invalidates all in-flight timer callbacks.
  const simCancelRef = useRef(0);
  const simTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up simulation timers on unmount.
  useEffect(() => () => { simTimersRef.current.forEach(clearTimeout); }, []);

  const runWorkflow = useCallback(async () => {
    if (runState.phase === 'running' || nodes.length === 0) return;
    const runId = ++runIdRef.current;
    const order = topoSort(nodes, edges);

    // Cancel any in-flight simulation from a prior run.
    simTimersRef.current.forEach(clearTimeout);
    simTimersRef.current = [];

    setRunResult(null);
    setShowRunPanel(true);
    setSelectedNodeId(null);
    setDetailSection(null);
    setRunState({
      phase: 'running',
      nodeStatuses: {
        ...Object.fromEntries(nodes.map(n => [n.id, 'pending' as NodeRunStatus])),
        ...(order[0] ? { [order[0]]: 'running' as NodeRunStatus } : {}),
      },
      startedAt: Date.now(),
      currentNodeLabel: nodes.find(n => n.id === order[0])?.label,
    });

    const cancelSim = () => {
      simCancelRef.current++;          // invalidates any queued callbacks
      simTimersRef.current.forEach(clearTimeout);
      simTimersRef.current = [];
    };

    // Always sync current graph to the backend before running so the runner
    // always executes the latest canvas state (not a stale saved version).
    let wfId = apiWorkflowIdRef.current;
    try {
      setSaveState('saving');
      if (wfId) {
        await api.workflows.update(wfId, { graph: { nodes, edges }, name: workflowName });
      } else {
        const wf = await api.workflows.create({ name: workflowName, graph: { nodes, edges } });
        wfId = wf.id;
        apiWorkflowIdRef.current = wf.id;
        setApiWorkflowId(wf.id);
        const params = new URLSearchParams(searchParams.toString());
        params.set('workflowId', wf.id);
        router.replace(`?${params.toString()}`, { scroll: false });
      }
      setSaveState('saved');
    } catch (err) {
      cancelSim();
      setSaveState('error');
      setRunState({ phase: 'error', nodeStatuses: {}, startedAt: 0, errorMessage: err instanceof Error ? err.message : 'Failed to save workflow before running' });
      return;
    }

    // Collect inputs from any text-input node
    const textInputNode = nodes.find(n => n.kind === 'text-input');
    const inputs: Record<string, unknown> = {
      message: textInputNode?.inputValue ?? '',
      __user__: {
        id:    user?.id    ?? '',
        email: user?.email ?? '',
        name:  (user?.user_metadata?.['full_name'] as string | undefined) ?? (user?.user_metadata?.['name'] as string | undefined) ?? '',
      },
      __vars__: Object.fromEntries(workspaceVariables.map((v) => [v.key, v.value])),
    };

    try {
      const initialRun = await api.runs.trigger({ workflow_id: wfId, inputs });
      cancelSim();
      if (runIdRef.current !== runId) return;

      // Stream real node updates — each "step" event fires as a node completes
      for await (const event of streamRun(initialRun.id)) {
        if (runIdRef.current !== runId) break;

        if (event.event === 'step') {
          setRunState(prev => {
            const updated = { ...prev.nodeStatuses };
            updated[event.node] = event.status === 'ok' ? 'done' : 'error';
            // Advance the "running" highlight to the next pending node
            const idx = order.indexOf(event.node);
            let nextLabel: string | undefined;
            if (idx !== -1 && idx + 1 < order.length) {
              const nextId = order[idx + 1];
              if (updated[nextId] === 'pending') {
                updated[nextId] = 'running';
                nextLabel = nodes.find(n => n.id === nextId)?.label;
              }
            }
            return { ...prev, nodeStatuses: updated, currentNodeLabel: nextLabel ?? prev.currentNodeLabel };
          });

        } else if (event.event === 'done') {
          // Fetch the full run for trace details and sources
          try {
            const result = await api.runs.get(initialRun.id);
            const traceMap = Object.fromEntries(result.trace.map(s => [s.node, s.status]));
            const finalStatuses = Object.fromEntries(
              nodes.map(n => [n.id, (traceMap[n.id] === 'ok' ? 'done' : traceMap[n.id] ? 'error' : 'pending') as NodeRunStatus])
            );
            const outputs: Record<string, string> = {};
            for (const step of result.trace) {
              const stepNode = nodes.find(n => n.id === step.node);
              if (stepNode?.kind === 'output' && step.output) {
                const o = step.output as Record<string, unknown>;
                outputs[step.node] = typeof o.reply === 'string' ? o.reply
                  : typeof o.result === 'string' ? o.result
                  : JSON.stringify(o, null, 2);
              }
            }
            setNodeOutputs(outputs);
            setRunSources((result.state?.sources as KnowledgeSource[]) ?? []);
            setRunResult(result);
            setRunState(prev => ({
              ...prev,
              phase: event.status === 'done' ? 'done' : 'error',
              nodeStatuses: finalStatuses,
              currentNodeLabel: undefined,
              errorMessage: event.status !== 'done' ? (event.error ?? 'Workflow failed') : undefined,
            }));
          } catch {
            setRunState(prev => ({
              ...prev,
              phase: event.status === 'done' ? 'done' : 'error',
              currentNodeLabel: undefined,
              errorMessage: event.status !== 'done' ? (event.error ?? 'Workflow failed') : undefined,
            }));
          }
        }
      }
    } catch (err) {
      cancelSim();
      if (runIdRef.current !== runId) return;
      setRunState(prev => ({ ...prev, phase: 'error', currentNodeLabel: undefined, errorMessage: err instanceof Error ? err.message : 'Network error — check the API server is running' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, runState.phase, workflowName]);

  const loadExample = useCallback(() => {
    setNodes(EXAMPLE_NODES);
    setEdges(EXAMPLE_EDGES);
  }, []);

  const loadLLMExample = useCallback(() => {
    setNodes(LLM_EXAMPLE_NODES);
    setEdges(LLM_EXAMPLE_EDGES);
  }, []);

  const loadKBExample = useCallback(async () => {
    const kbs = await api.knowledgeBases.list().catch(() => [] as KnowledgeBaseOut[]);
    setNodes(buildKbExampleNodes(kbs[0]?.id));
    setEdges(KB_EXAMPLE_EDGES);
  }, []);

  // ── History (undo / redo) ─────────────────────────────────────────────────
  const [history, setHistory] = useState<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] });

  // Always-current ref so snapshot closures don't go stale
  const liveRef = useRef<Snapshot>({ nodes, edges });
  useEffect(() => { liveRef.current = { nodes, edges }; }, [nodes, edges]);

  const saveSnapshot = useCallback(() => {
    setHistory(h => ({
      past: [...h.past.slice(-(MAX_HISTORY - 1)), { ...liveRef.current }],
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const snap = h.past[h.past.length - 1];
      setNodes(snap.nodes);
      setEdges(snap.edges);
      return {
        past: h.past.slice(0, -1),
        future: [{ ...liveRef.current }, ...h.future.slice(0, MAX_HISTORY - 1)],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const snap = h.future[0];
      setNodes(snap.nodes);
      setEdges(snap.edges);
      return {
        past: [...h.past.slice(-(MAX_HISTORY - 1)), { ...liveRef.current }],
        future: h.future.slice(1),
      };
    });
  }, []);

  // ── Node / edge mutations (each saves a snapshot first) ───────────────────
  const addNode = useCallback((kind: NodeKind, x: number, y: number) => {
    hasContentChangeRef.current = true;
    saveSnapshot();
    const def = getNodeDef(kind);
    setNodes(prev => [
      ...prev,
      { id: `n-${Date.now()}`, kind, label: def?.label ?? kind, x, y },
    ]);
  }, [saveSnapshot]);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    saveSnapshot();
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, x, y } : n)));
  }, [saveSnapshot]);

  const updateValue = useCallback((id: string, value: string) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, inputValue: value } : n)));
  }, []);

  const updateSystemPrompt = useCallback((id: string, value: string) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, systemPrompt: value } : n)));
  }, []);

  const updateLabel = useCallback((id: string, label: string) => {
    hasContentChangeRef.current = true;
    saveSnapshot();
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, label } : n)));
  }, [saveSnapshot]);

  const updateModel = useCallback((id: string, model: string) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, model } : n)));
  }, []);

  const updateKnowledgeBases = useCallback((id: string, kbIds: string[]) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, knowledgeBases: kbIds } : n)));
  }, []);

  const updateSubflowTools = useCallback((id: string, tools: import('@/lib/editor-nodes').SubflowTool[]) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, subflowTools: tools } : n)));
  }, []);

  const updateNodeFields = useCallback((id: string, fields: Partial<import('@/lib/editor-nodes').CanvasNode>) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, ...fields } : n)));
  }, []);

  const updateWorkflowName = useCallback((name: string) => {
    hasContentChangeRef.current = true;
    setWorkflowName(name);
  }, []);

  const removeNode = useCallback((id: string) => {
    hasContentChangeRef.current = true;
    saveSnapshot();
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.sourceId !== id && e.targetId !== id));
    setSelectedNodeId(prev => (prev === id ? null : prev));
  }, [saveSnapshot]);

  const selectNode = useCallback((id: string) => { setSelectedNodeId(id); setDetailSection(null); setShowRunPanel(false); }, []);

  const addConnectedNode = useCallback((kind: NodeKind, x: number, y: number, anchorId: string, side: 'input' | 'output') => {
    hasContentChangeRef.current = true;
    saveSnapshot();
    const def = getNodeDef(kind);
    const newId = `n-${Date.now()}`;
    setNodes(prev => [...prev, { id: newId, kind, label: def?.label ?? kind, x, y }]);
    setEdges(prev => [...prev, {
      id: `e-${Date.now()}`,
      sourceId: side === 'output' ? anchorId : newId,
      targetId: side === 'output' ? newId : anchorId,
    }]);
  }, [saveSnapshot]);

  const addEdge = useCallback((sourceId: string, targetId: string) => {
    hasContentChangeRef.current = true;
    saveSnapshot();
    setEdges(prev => {
      if (prev.some(e => e.sourceId === sourceId && e.targetId === targetId)) return prev;
      return [...prev, { id: `e-${Date.now()}`, sourceId, targetId }];
    });
  }, [saveSnapshot]);

  const removeEdge = useCallback((id: string) => {
    hasContentChangeRef.current = true;
    saveSnapshot();
    setEdges(prev => prev.filter(e => e.id !== id));
  }, [saveSnapshot]);

  const arrangeNodes = useCallback((positions: { id: string; x: number; y: number }[]) => {
    saveSnapshot();
    const posMap = Object.fromEntries(positions.map(p => [p.id, p]));
    setNodes(prev => prev.map(n => posMap[n.id] ? { ...n, x: posMap[n.id].x, y: posMap[n.id].y } : n));
  }, [saveSnapshot]);

  const toggleStickyNote = useCallback((id: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n;
      if (!n.stickyNote) {
        return { ...n, stickyNote: { visible: true, text: '', color: randomStickyColor() } };
      }
      return { ...n, stickyNote: { ...n.stickyNote, visible: !n.stickyNote.visible } };
    }));
  }, []);

  const updateStickyNote = useCallback((id: string, text: string) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n =>
      n.id === id && n.stickyNote ? { ...n, stickyNote: { ...n.stickyNote, text } } : n
    ));
  }, []);

  const updateStickyNoteColor = useCallback((id: string, color: string) => {
    setNodes(prev => prev.map(n =>
      n.id === id && n.stickyNote ? { ...n, stickyNote: { ...n.stickyNote, color } } : n
    ));
  }, []);

  const toggleAllStickyNotes = useCallback(() => {
    setNodes(prev => {
      const anyHidden = prev.some(n => n.stickyNote && !n.stickyNote.visible);
      const anyExists = prev.some(n => n.stickyNote);
      if (!anyExists) return prev;
      return prev.map(n =>
        n.stickyNote ? { ...n, stickyNote: { ...n.stickyNote, visible: anyHidden ? true : false } } : n
      );
    });
  }, []);

  // ── Panel resize ──────────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = panelWidth;
    setIsDragging(true);
  }, [panelWidth]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current) return;
      const delta = dragStartXRef.current - e.clientX;
      setPanelWidth(Math.min(900, Math.max(getMinPanelWidth(), dragStartWidthRef.current + delta)));
    }
    function onMouseUp() {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    document.body.style.cursor = isDragging ? 'col-resize' : '';
    document.body.style.userSelect = isDragging ? 'none' : '';
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // ── Ask AI panel ──────────────────────────────────────────────────────────
  const [allKbs, setAllKbs] = useState<KnowledgeBaseOut[]>([]);
  useEffect(() => { api.knowledgeBases.list().then(setAllKbs).catch(() => {}); }, []);

  const removeKbFromNode = useCallback((nodeId: string, kbId: string) => {
    hasContentChangeRef.current = true;
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, knowledgeBases: (n.knowledgeBases ?? []).filter(id => id !== kbId) } : n,
    ));
  }, []);

  const [askAIOpen, setAskAIOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  // ── Checklist modal ───────────────────────────────────────────────────────
  const [showChecklist, setShowChecklist] = useState(false);

  // Keep panel content alive during the slide-out animation.
  const [panelNodeId, setPanelNodeId] = useState<string | null>(null);
  useEffect(() => {
    if (selectedNodeId) setPanelNodeId(selectedNodeId);
  }, [selectedNodeId]);
  const panelNode = panelNodeId ? nodes.find(n => n.id === panelNodeId) ?? null : null;
  const isPanelOpen = !!selectedNodeId && !!nodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    document.documentElement.style.setProperty('--panel-width', isPanelOpen ? `${panelWidth}px` : '0px');
  }, [panelWidth, isPanelOpen]);

  return (
    // Outer row: sidebar (full-height) + right column
    <div className="flex flex-1 overflow-hidden relative">
      <EditorSidebar
        pinned={sidebarPinned}
        onTogglePin={() => setSidebarPinned(v => !v)}
      />

      {/* Right column: topbar + content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <EditorTopbar
          templateName={workflowName}
          templateSlug={templateSlug}
          workflowId={apiWorkflowId}
          saveState={saveState}
          onRun={runWorkflow}
          runPhase={runState.phase}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onUpdateWorkflowName={updateWorkflowName}
          sidebarPinned={sidebarPinned}
          examples={[
            { label: 'Code example',   onLoad: loadExample },
            { label: 'LLM example',    onLoad: loadLLMExample },
            { label: 'KB Q&A example', onLoad: loadKBExample },
          ]}
        />

        {activeTab === 'export' ? (
          <ExportView workflowId={apiWorkflowId} />
        ) : (
          <div className="flex flex-1 overflow-hidden relative">
            <AskAIPanel
              open={askAIOpen}
              onClose={() => setAskAIOpen(false)}
              workflowName={workflowName}
              nodes={nodes}
              edges={edges}
            />
            <RunProgressPanel
              open={showRunPanel}
              onClose={() => setShowRunPanel(false)}
              nodes={nodes}
              edges={edges}
              runPhase={runState.phase}
              runResult={runResult}
              nodeRunStatuses={runState.nodeStatuses}
              runError={runState.errorMessage}
            />
            <EditorCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onAddNode={addNode}
              onMoveNode={moveNode}
              onUpdateValue={updateValue}
              onRemoveNode={removeNode}
              onAddEdge={addEdge}
              onRemoveEdge={removeEdge}
              onSelectNode={selectNode}
              onDeselect={() => { setSelectedNodeId(null); setDetailSection(null); }}
              onOpenDetail={(nodeId, section) => { setSelectedNodeId(nodeId); setDetailSection({ section, trigger: Date.now() }); setShowRunPanel(false); }}
              onAddConnectedNode={addConnectedNode}
              onUpdateLabel={updateLabel}
              onArrangeNodes={arrangeNodes}
              onUndo={undo}
              onRedo={redo}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
              onToggleStickyNote={toggleStickyNote}
              onUpdateStickyNote={updateStickyNote}
              onUpdateStickyNoteColor={updateStickyNoteColor}
              onToggleAllStickyNotes={toggleAllStickyNotes}
              nodeRunStatuses={runState.nodeStatuses}
              nodeOutputs={nodeOutputs}
              runPhase={runState.phase}
              runCurrentNodeLabel={runState.currentNodeLabel}
              lastSavedAt={lastSavedAt}
              focusRequest={focusRequest}
              onAskAI={() => setAskAIOpen(o => !o)}
              allKbs={allKbs}
              onRemoveKbFromNode={removeKbFromNode}
            />
            {/* Bottom-right: Run History + Checklist */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => { setShowChecklist(false); setShowRunPanel(true); setSelectedNodeId(null); setDetailSection(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-[450] bg-prune-lightGray border border-prune-borderGray rounded-full hover:bg-white transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                Run history
              </button>
              <button
                onClick={() => setShowChecklist(v => !v)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-[450] bg-prune-lightGray border border-prune-borderGray rounded-full hover:bg-white transition-colors"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Checklist
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-400 border border-white" />
              </button>
            </div>

            <ChecklistModal
              open={showChecklist}
              onClose={() => setShowChecklist(false)}
            />

            <div
              className={cn(
                'absolute right-3 top-3 bottom-3 z-10',
                !isDragging && 'transition-[transform,opacity] duration-300 ease-in-out',
                isPanelOpen
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-[calc(100%+12px)] opacity-0',
              )}
              style={{ width: panelWidth, pointerEvents: isPanelOpen ? 'auto' : 'none' }}
            >
              {panelNode && (
                <NodeDetailPanel
                  node={panelNode}
                  nodes={nodes}
                  onClose={() => { setSelectedNodeId(null); setDetailSection(null); }}
                  onUpdateValue={updateValue}
                  onUpdateSystemPrompt={updateSystemPrompt}
                  onUpdateLabel={updateLabel}
                  onUpdateModel={updateModel}
                  onUpdateKnowledgeBases={updateKnowledgeBases}
                  onUpdateSubflowTools={updateSubflowTools}
                  onUpdateNode={updateNodeFields}
                  onRemoveNode={removeNode}
                  onFocusNode={(id) => setFocusRequest({ id, at: Date.now() })}
                  onResizeMouseDown={handleResizeMouseDown}
                  scrollToSection={detailSection}
                  runOutput={nodeOutputs[panelNode.id]}
                  runSources={runSources.length > 0 ? runSources : undefined}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
