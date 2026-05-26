'use client';

import { useState, useCallback, useEffect } from 'react';
import { getTemplate } from '@/lib/templates';
import { EditorTopbar } from './editor-topbar';
import { EditorSidebar } from './editor-sidebar';
import { EditorCanvas } from './editor-canvas';
import { NodeDetailPanel } from './node-detail-panel';
import { getNodeDef, type CanvasNode, type CanvasEdge, type NodeKind } from '@/lib/editor-nodes';
import { cn } from '@/lib/utils';
import type { NodeType } from '@/lib/types';

interface BuilderEditorProps {
  templateSlug: string | null;
}

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

export function BuilderEditor({ templateSlug }: BuilderEditorProps) {
  const template = templateSlug ? getTemplate(templateSlug) : null;
  const init = buildInitialState(templateSlug);

  const [nodes, setNodes] = useState<CanvasNode[]>(init.nodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(init.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const addNode = useCallback((kind: NodeKind, x: number, y: number) => {
    const def = getNodeDef(kind);
    setNodes(prev => [
      ...prev,
      { id: `n-${Date.now()}`, kind, label: def?.label ?? kind, x, y },
    ]);
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, x, y } : n)));
  }, []);

  const updateValue = useCallback((id: string, value: string) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, inputValue: value } : n)));
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.sourceId !== id && e.targetId !== id));
    setSelectedNodeId(prev => (prev === id ? null : prev));
  }, []);

  const selectNode = useCallback((id: string) => setSelectedNodeId(id), []);

  // Keep panel content alive during the slide-out animation.
  // panelNodeId only updates when a node IS selected, never on deselect,
  // so the panel has content to render while it slides away.
  const [panelNodeId, setPanelNodeId] = useState<string | null>(null);
  useEffect(() => {
    if (selectedNodeId) setPanelNodeId(selectedNodeId);
  }, [selectedNodeId]);
  const panelNode = panelNodeId ? nodes.find(n => n.id === panelNodeId) ?? null : null;
  const isPanelOpen = !!selectedNodeId && !!nodes.find(n => n.id === selectedNodeId);

  const addEdge = useCallback((sourceId: string, targetId: string) => {
    setEdges(prev => {
      if (prev.some(e => e.sourceId === sourceId && e.targetId === targetId)) return prev;
      return [...prev, { id: `e-${Date.now()}`, sourceId, targetId }];
    });
  }, []);

  const removeEdge = useCallback((id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <>
      <EditorTopbar
        templateName={template?.name ?? null}
        templateSlug={templateSlug}
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
        />
        <div
          className={cn(
            'absolute right-3 top-3 bottom-3 w-72 z-10 transition-all duration-300 ease-in-out',
            isPanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+12px)] opacity-0',
          )}
          style={{ pointerEvents: isPanelOpen ? 'auto' : 'none' }}
        >
          {panelNode && (
            <NodeDetailPanel
              node={panelNode}
              nodes={nodes}
              onClose={() => setSelectedNodeId(null)}
              onUpdateValue={updateValue}
            />
          )}
        </div>
      </div>
    </>
  );
}
