'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getTemplate } from '@/lib/templates';
import { EditorTopbar } from './editor-topbar';
import { EditorSidebar } from './editor-sidebar';
import { EditorCanvas } from './editor-canvas';
import { NodeDetailPanel } from './node-detail-panel';
import { getNodeDef, type CanvasNode, type CanvasEdge, type NodeKind, type NodeRunStatus, type RunPhase } from '@/lib/editor-nodes';
import { cn } from '@/lib/utils';
import type { NodeType } from '@/lib/types';

const MAX_HISTORY = 50;

const STICKY_COLORS = [
  '#FEF9C3', '#FCE7F3', '#DBEAFE', '#D1FAE5',
  '#EDE9FE', '#FFEDD5', '#E0F2FE', '#FEE2E2',
];
function randomStickyColor() {
  return STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
}

interface BuilderEditorProps {
  templateSlug: string | null;
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

export function BuilderEditor({ templateSlug }: BuilderEditorProps) {
  const template = templateSlug ? getTemplate(templateSlug) : null;
  const init = buildInitialState(templateSlug);

  const [nodes, setNodes] = useState<CanvasNode[]>(init.nodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(init.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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

  // ── Autosave to localStorage ──────────────────────────────────────────────
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const key = `prune-draft-${templateSlug ?? 'untitled'}`;
        localStorage.setItem(key, JSON.stringify({ nodes, edges }));
        setLastSavedAt(Date.now());
      } catch {}
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [nodes, edges, templateSlug]);

  // Hide the autosave pill 20 s after the last save
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = setTimeout(() => setLastSavedAt(null), 60_000);
    return () => clearTimeout(id);
  }, [lastSavedAt]);

  // ── Run workflow ──────────────────────────────────────────────────────────
  const [runState, setRunState] = useState<RunState>({ phase: 'idle', nodeStatuses: {}, startedAt: 0 });
  const runIdRef = useRef(0);

  const runWorkflow = useCallback(() => {
    if (runState.phase === 'running' || nodes.length === 0) return;
    const runId = ++runIdRef.current;
    const order = topoSort(nodes, edges);

    setRunState({
      phase: 'running',
      nodeStatuses: Object.fromEntries(nodes.map(n => [n.id, 'pending' as NodeRunStatus])),
      startedAt: Date.now(),
      currentNodeLabel: nodes.find(n => n.id === order[0])?.label,
    });

    let t = 0;
    const timings = order.map(() => {
      const runAt = t;
      const doneAt = t + 600 + Math.floor(Math.random() * 500);
      t = doneAt + 80;
      return { runAt, doneAt };
    });

    order.forEach((nodeId, i) => {
      const { runAt, doneAt } = timings[i];
      const label = nodes.find(n => n.id === nodeId)?.label;
      setTimeout(() => {
        if (runIdRef.current !== runId) return;
        setRunState(prev => ({ ...prev, nodeStatuses: { ...prev.nodeStatuses, [nodeId]: 'running' }, currentNodeLabel: label }));
      }, runAt);
      setTimeout(() => {
        if (runIdRef.current !== runId) return;
        setRunState(prev => ({ ...prev, nodeStatuses: { ...prev.nodeStatuses, [nodeId]: 'done' } }));
      }, doneAt);
    });

    setTimeout(() => {
      if (runIdRef.current !== runId) return;
      setRunState(prev => ({ ...prev, phase: 'done', currentNodeLabel: undefined }));
      setTimeout(() => {
        if (runIdRef.current !== runId) return;
        setRunState({ phase: 'idle', nodeStatuses: {}, startedAt: 0 });
      }, 3000);
    }, t);
  }, [nodes, edges, runState.phase]);

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
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, inputValue: value } : n)));
  }, []);

  const removeNode = useCallback((id: string) => {
    saveSnapshot();
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.sourceId !== id && e.targetId !== id));
    setSelectedNodeId(prev => (prev === id ? null : prev));
  }, [saveSnapshot]);

  const selectNode = useCallback((id: string) => setSelectedNodeId(id), []);

  const addConnectedNode = useCallback((kind: NodeKind, x: number, y: number, anchorId: string, side: 'input' | 'output') => {
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
    saveSnapshot();
    setEdges(prev => {
      if (prev.some(e => e.sourceId === sourceId && e.targetId === targetId)) return prev;
      return [...prev, { id: `e-${Date.now()}`, sourceId, targetId }];
    });
  }, [saveSnapshot]);

  const removeEdge = useCallback((id: string) => {
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

  // Keep panel content alive during the slide-out animation.
  const [panelNodeId, setPanelNodeId] = useState<string | null>(null);
  useEffect(() => {
    if (selectedNodeId) setPanelNodeId(selectedNodeId);
  }, [selectedNodeId]);
  const panelNode = panelNodeId ? nodes.find(n => n.id === panelNodeId) ?? null : null;
  const isPanelOpen = !!selectedNodeId && !!nodes.find(n => n.id === selectedNodeId);

  return (
    <>
      <EditorTopbar
        templateName={template?.name ?? null}
        templateSlug={templateSlug}
        onRun={runWorkflow}
        runPhase={runState.phase}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <EditorSidebar />
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
          onDeselect={() => setSelectedNodeId(null)}
          onAddConnectedNode={addConnectedNode}
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
          runPhase={runState.phase}
          runCurrentNodeLabel={runState.currentNodeLabel}
          lastSavedAt={lastSavedAt}
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
              onClose={() => setSelectedNodeId(null)}
              onUpdateValue={updateValue}
              onResizeMouseDown={handleResizeMouseDown}
            />
          )}
        </div>
      </div>
    </>
  );
}
