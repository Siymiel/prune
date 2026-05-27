'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  ZoomIn, ZoomOut, Undo2, Redo2,
  Sparkles, Plus, MousePointer2, Scan, LayoutGrid, Map as MapIcon, Camera,
  Fullscreen,
  SquareArrowOutUpRightIcon,
} from 'lucide-react';
import { type CanvasNode, type CanvasEdge, type NodeKind, getNodeDef } from '@/lib/editor-nodes';
import { NodeCard, NODE_WIDTH, HANDLE_Y_OFFSET, HANDLE_SIDE_OFFSET } from './node-card';
import { NodePickerModal } from './node-picker-modal';
import { cn } from '@/lib/utils';

const CANVAS_W = 4000;
const CANVAS_H = 3000;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.5;

// ── Auto-arrange: hierarchical left-to-right layout ──────────────────────────
const NODE_H = 170;  // approximate card height for spacing
const H_STEP = NODE_WIDTH + 140;
const V_STEP = NODE_H + 70;

function autoArrange(nodes: CanvasNode[], edges: CanvasEdge[]): { id: string; x: number; y: number }[] {
  if (nodes.length === 0) return [];

  const nodeIds = new Set(nodes.map(n => n.id));
  const out: Record<string, string[]> = {};
  const inc: Record<string, string[]> = {};
  nodes.forEach(n => { out[n.id] = []; inc[n.id] = []; });
  edges.forEach(e => {
    if (nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)) {
      out[e.sourceId].push(e.targetId);
      inc[e.targetId].push(e.sourceId);
    }
  });

  // Assign layers: longest path from sources (Kahn + relaxation)
  const layer: Record<string, number> = {};
  nodes.forEach(n => { layer[n.id] = 0; });
  const indegree = new Map(nodes.map(n => [n.id, inc[n.id].length] as [string, number]));
  const queue = nodes.filter(n => inc[n.id].length === 0).map(n => n.id);

  while (queue.length) {
    const id = queue.shift()!;
    for (const t of out[id]) {
      layer[t] = Math.max(layer[t], layer[id] + 1);
      indegree.set(t, indegree.get(t)! - 1);
      if (indegree.get(t) === 0) queue.push(t);
    }
  }
  // nodes stuck in cycles get their own column
  const maxL = Math.max(0, ...Object.values(layer));
  indegree.forEach((deg, id) => { if (deg > 0) layer[id] = maxL + 1; });

  // Group into columns
  const numCols = Math.max(...Object.values(layer)) + 1;
  const cols: string[][] = Array.from({ length: numCols }, () => []);
  nodes.forEach(n => cols[layer[n.id]].push(n.id));

  // Barycenter heuristic: order first column by original y, then each
  // subsequent column by average rank of predecessors
  const rank: Record<string, number> = {};
  cols[0].sort((a, b) => {
    const na = nodes.find(n => n.id === a)!;
    const nb = nodes.find(n => n.id === b)!;
    return na.y - nb.y;
  });
  cols[0].forEach((id, i) => { rank[id] = i; });

  for (let l = 1; l < numCols; l++) {
    cols[l].sort((a, b) => {
      const ra = inc[a].length ? inc[a].reduce((s, p) => s + (rank[p] ?? 0), 0) / inc[a].length : 0;
      const rb = inc[b].length ? inc[b].reduce((s, p) => s + (rank[p] ?? 0), 0) / inc[b].length : 0;
      return ra - rb;
    });
    cols[l].forEach((id, i) => { rank[id] = i; });
  }

  // Center all columns around the same vertical midline
  const maxRows = Math.max(...cols.map(c => c.length));
  const midY = 80 + ((maxRows - 1) * V_STEP) / 2;

  const result: { id: string; x: number; y: number }[] = [];
  cols.forEach((col, l) => {
    const x = 80 + l * H_STEP;
    const colH = (col.length - 1) * V_STEP;
    const startY = midY - colH / 2;
    col.forEach((id, i) => result.push({ id, x, y: startY + i * V_STEP }));
  });
  return result;
}

interface EditorCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId?: string | null;
  onAddNode: (kind: NodeKind, x: number, y: number) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onUpdateValue: (id: string, value: string) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (sourceId: string, targetId: string) => void;
  onRemoveEdge?: (id: string) => void;
  onSelectNode?: (id: string) => void;
  onDeselect?: () => void;
  onAddConnectedNode: (kind: NodeKind, x: number, y: number, anchorId: string, side: 'input' | 'output') => void;
  onArrangeNodes?: (positions: { id: string; x: number; y: number }[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleStickyNote?: (id: string) => void;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onUpdateStickyNoteColor?: (id: string, color: string) => void;
  onToggleAllStickyNotes?: () => void;
}

function bezierPath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - sx) * 0.55;
  return `M ${sx} ${sy} C ${sx + dx} ${sy} ${tx - dx} ${ty} ${tx} ${ty}`;
}

export function EditorCanvas({
  nodes,
  edges,
  selectedNodeId,
  onAddNode,
  onMoveNode,
  onUpdateValue,
  onRemoveNode,
  onAddEdge,
  onRemoveEdge,
  onSelectNode,
  onDeselect,
  onAddConnectedNode,
  onArrangeNodes,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleStickyNote,
  onUpdateStickyNote,
  onUpdateStickyNoteColor,
  onToggleAllStickyNotes,
}: EditorCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(1);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ startMX: number; startMY: number; startPX: number; startPY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ sourceId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // ── Wheel zoom (needs passive:false) ─────────────────────────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const z = zoomRef.current;
      const p = panRef.current;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.03 : 0.97;
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
      setPan({ x: cx - (cx - p.x) * (nz / z), y: cy - (cy - p.y) * (nz / z) });
      setZoom(nz);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Coordinate helper ─────────────────────────────────────────────────────
  function toCanvas(clientX: number, clientY: number) {
    const rect = outerRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
    };
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); onUndo?.(); }
      if (e.key === 'z' && e.shiftKey)  { e.preventDefault(); onRedo?.(); }
      if (e.key === 'y')                 { e.preventDefault(); onRedo?.(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onUndo, onRedo]);

  // ── Outer mouse events ────────────────────────────────────────────────────
  function handleOuterMouseDown(e: React.MouseEvent) {
    if (connecting) return; // don't start panning while drawing a connection
    if (dragging) return;
    setPanning({ startMX: e.clientX, startMY: e.clientY, startPX: pan.x, startPY: pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    const c = toCanvas(e.clientX, e.clientY);
    setMousePos(c);

    if (dragging) {
      const x = c.x - dragging.offsetX;
      const y = c.y - dragging.offsetY;
      setLocalPositions(prev => ({ ...prev, [dragging.id]: { x, y } }));
      return;
    }
    if (panning) {
      setPan({ x: panning.startPX + e.clientX - panning.startMX, y: panning.startPY + e.clientY - panning.startMY });
    }
  }

  function handleMouseUp() {
    if (connecting) setConnecting(null);
    if (dragging) {
      const lp = localPositions[dragging.id];
      if (lp) onMoveNode(dragging.id, lp.x, lp.y);
    }
    setLocalPositions({});
    setDragging(null);
    setPanning(null);
  }

  // ── Effective nodes (local position overrides during drag) ───────────────
  const effectiveNodes = useMemo(
    () => nodes.map(n => { const lp = localPositions[n.id]; return lp ? { ...n, ...lp } : n; }),
    [nodes, localPositions],
  );

  // ── Node drag (called by NodeCard) ────────────────────────────────────────
  const startNodeDrag = useCallback((e: React.MouseEvent, node: CanvasNode) => {
    const c = toCanvas(e.clientX, e.clientY);
    setDragging({ id: node.id, offsetX: c.x - node.x, offsetY: c.y - node.y });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connection handlers ───────────────────────────────────────────────────
  const startConnect = useCallback((nodeId: string) => {
    setConnecting({ sourceId: nodeId });
  }, []);

  const completeConnect = useCallback((targetId: string) => {
    if (!connecting || connecting.sourceId === targetId) { setConnecting(null); return; }
    onAddEdge(connecting.sourceId, targetId);
    setConnecting(null);
  }, [connecting, onAddEdge]);

  // ── Node picker (click output handle) ────────────────────────────────────
  const [picker, setPicker] = useState<{ anchorId: string; screenX: number; screenY: number; side: 'input' | 'output' } | null>(null);

  const openPicker = useCallback((anchorId: string, screenX: number, screenY: number, side: 'input' | 'output') => {
    setPicker({ anchorId, screenX, screenY, side });
  }, []);

  const handlePickerSelect = useCallback((kind: NodeKind) => {
    if (!picker) return;
    if (!picker.anchorId) {
      const rect = outerRef.current?.getBoundingClientRect();
      const cx = rect ? (rect.width / 2 - panRef.current.x) / zoomRef.current : 300;
      const cy = rect ? (rect.height / 2 - panRef.current.y) / zoomRef.current : 200;
      onAddNode(kind, Math.max(0, cx - NODE_WIDTH / 2), Math.max(0, cy - 40));
    } else {
      const anchor = nodes.find(n => n.id === picker.anchorId);
      const newX = picker.side === 'output'
        ? (anchor?.x ?? 200) + NODE_WIDTH + 120
        : (anchor?.x ?? 200) - NODE_WIDTH - 120;
      const newY = anchor?.y ?? 200;
      onAddConnectedNode(kind, newX, newY, picker.anchorId, picker.side);
    }
    setPicker(null);
  }, [picker, nodes, onAddConnectedNode, onAddNode]);

  // ── Sidebar drag-and-drop ─────────────────────────────────────────────────
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const kind = e.dataTransfer.getData('text/plain') as NodeKind;
    if (!kind || !getNodeDef(kind)) return;
    const c = toCanvas(e.clientX, e.clientY);
    onAddNode(kind, Math.max(0, c.x - NODE_WIDTH / 2), Math.max(0, c.y - 40));
  }

  // ── Fit view ──────────────────────────────────────────────────────────────
  const fitView = useCallback(() => {
    const rect = outerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (nodes.length === 0) { setZoom(1); setPan({ x: 60, y: 60 }); return; }
    const minX = Math.min(...nodes.map(n => n.x)) - 60;
    const minY = Math.min(...nodes.map(n => n.y)) - 60;
    const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH)) + 60;
    const maxY = Math.max(...nodes.map(n => n.y + 200)) + 60;
    const cw = maxX - minX;
    const ch = maxY - minY;
    const nz = Math.min(MAX_ZOOM, Math.min(rect.width / cw, rect.height / ch) * 0.9);
    setZoom(nz);
    setPan({ x: (rect.width - cw * nz) / 2 - minX * nz, y: (rect.height - ch * nz) / 2 - minY * nz });
  }, [nodes]);

  // Auto-fit to content on first render that has nodes.
  // Double-RAF ensures flex layout has fully settled before measuring.
  const hasAutoFit = useRef(false);
  useEffect(() => {
    if (hasAutoFit.current || nodes.length === 0) return;
    hasAutoFit.current = true;
    let r1 = 0, r2 = 0;
    r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(fitView); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [nodes, fitView]);

  // ── SVG edge data ─────────────────────────────────────────────────────────
  const nodeMap = Object.fromEntries(effectiveNodes.map(n => [n.id, n]));

  const edgeData = edges.flatMap(edge => {
    const src = nodeMap[edge.sourceId];
    const tgt = nodeMap[edge.targetId];
    if (!src || !tgt) return [];
    const sx = src.x + NODE_WIDTH + HANDLE_SIDE_OFFSET;
    const sy = src.y + HANDLE_Y_OFFSET;
    const tx = tgt.x - HANDLE_SIDE_OFFSET;
    const ty = tgt.y + HANDLE_Y_OFFSET;
    const isConnectedToHoveredNode =
      hoveredNodeId &&
      (edge.sourceId === hoveredNodeId ||
      edge.targetId === hoveredNodeId);
    return [{ id: edge.id, d: bezierPath(sx, sy, tx, ty), mx: (sx + tx) / 2, my: (sy + ty) / 2, isConnectedToHoveredNode }];
  });

  const cursorStyle = connecting ? 'crosshair' : panning ? 'grabbing' : 'grab';

  return (
    <div
      ref={outerRef}
      className={cn('flex-1 relative overflow-hidden', dragOver && 'ring-2 ring-primary/20 ring-inset')}
      style={{
        cursor: cursorStyle,
        backgroundColor: '#eff0f0',
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(0 0% 0% / 0.12) 1px, transparent 0)',
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onMouseDown={handleOuterMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onDeselect?.()}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Transformed canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: CANVAS_W,
          height: CANVAS_H,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* SVG connection layer */}
        <svg
          className="absolute inset-0 overflow-visible"
          width={CANVAS_W}
          height={CANVAS_H}
        >
          {/* Existing edges */}
          {edgeData.map(e => (
            <g
              key={e.id}
              onMouseEnter={() => setHoveredEdgeId(e.id)}
              onMouseLeave={() => setHoveredEdgeId(null)}
            >
              {/* Thick transparent hit area for easy hover */}
              <path d={e.d} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor: 'pointer' }} />
              {/* Visible stroke */}
              <path
                d={e.d}
                fill="none"
                stroke={
                  hoveredEdgeId === e.id || e.isConnectedToHoveredNode
                    ? '#4b5563'
                    : '#9ca3af'
                }
                strokeWidth={
                  hoveredEdgeId === e.id || e.isConnectedToHoveredNode
                    ? 2
                    : 1.5
                }
                markerEnd="url(#arrow-end)"
                style={{
                  pointerEvents: 'none',
                  transition: 'all 180ms ease',
                }}
              />
              {/* Delete button above midpoint, box-shaped */}
              {hoveredEdgeId === e.id && (
                <>
                  {/* Transparent bridge so hover isn't lost moving cursor from line to button */}
                  <rect x={e.mx - 9} y={e.my - 20} width={18} height={16} fill="transparent" />
                  <g
                    style={{ cursor: 'pointer' }}
                    onMouseDown={evt => {
                      evt.stopPropagation();
                      onRemoveEdge?.(e.id);
                      setHoveredEdgeId(null);
                    }}
                    transform={`translate(${e.mx}, ${e.my - 22})`}
                  >
                    <rect x={-8} y={-8} width={16} height={16} fill="#ef4444" rx={2} />
                    <line x1={-3} y1={-3} x2={3} y2={3} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
                    <line x1={3} y1={-3} x2={-3} y2={3} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
                  </g>
                </>
              )}
            </g>
          ))}

          {/* In-progress connection line — start point tracks source node live */}
          {(() => {
            if (!connecting) return null;
            const src = effectiveNodes.find(n => n.id === connecting.sourceId);
            if (!src) return null;
            return (
              <path
                d={bezierPath(
                  src.x + NODE_WIDTH + HANDLE_SIDE_OFFSET,
                  src.y + HANDLE_Y_OFFSET,
                  mousePos.x,
                  mousePos.y,
                )}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}
        </svg>

        {/* Nodes */}
        {effectiveNodes.map(node => (
          <NodeCard
            key={node.id}
            node={node}
            isConnecting={!!connecting}
            connectingSourceId={connecting?.sourceId ?? null}
            isSelected={selectedNodeId === node.id}
            onStartDrag={e => startNodeDrag(e, node)}
            onUpdateValue={onUpdateValue}
            onRemove={onRemoveNode}
            onStartConnect={startConnect}
            onCompleteConnect={completeConnect}
            onSelect={onSelectNode}
            onHoverStart={() => setHoveredNodeId(node.id)}
            onHoverEnd={() => setHoveredNodeId(null)}
            onOpenPicker={openPicker}
            onToggleStickyNote={onToggleStickyNote}
            onUpdateStickyNote={onUpdateStickyNote}
            onUpdateStickyNoteColor={onUpdateStickyNoteColor}
          />
        ))}
      </div>

      {/* Node picker modal — outside transform so it uses raw screen coords */}
      {picker && (
        <NodePickerModal
          screenX={picker.screenX}
          screenY={picker.screenY}
          onSelect={handlePickerSelect}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Empty state — outside transform so it's always viewport-centered */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-muted-foreground/60">
            Drag nodes from the panel to start building
          </p>
          <p className="text-xs text-muted-foreground/40">
            Connect inputs → AI → outputs to automate conversations
          </p>
        </div>
      )}

      {/* ── Bottom toolbar ─────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border rounded-md shadow-lg px-1 py-1 z-20 pointer-events-auto">
        {/* Ask AI */}
        <button className="flex items-center gap-1 px-3 py-1 rounded-md border border-violet-300 text-violet-600 text-[14px] font-medium hover:bg-violet-50 transition-colors whitespace-nowrap">
          <Sparkles className="h-4 w-4" />
          Ask AI
        </button>

        {/* Add */}
       <button
        onClick={() => {
          const rect = outerRef.current?.getBoundingClientRect();
          if (!rect) return;
          setPicker({ anchorId: '', screenX: rect.left + rect.width / 2, screenY: rect.top + rect.height / 2, side: 'output' });
        }}
        className="group flex items-center gap-1 px-3 py-1 rounded-md bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap"
      >
        <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
        Add
      </button>

        <Sep />

        <ToolBtn tooltip="Undo" disabled={!canUndo} onClick={onUndo}><Undo2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn tooltip="Redo" disabled={!canRedo} onClick={onRedo}><Redo2 className="h-4 w-4" /></ToolBtn>

        <Sep />

        <ToolBtn tooltip="Zoom in" onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.1))}>
          <ZoomIn className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn tooltip="Zoom out" onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.1))}>
          <ZoomOut className="h-4 w-4" />
        </ToolBtn>

        <Sep />

        <ToolBtn tooltip="Fit view to screen" onClick={fitView}>
          <Fullscreen className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn tooltip="Show node notes" onClick={onToggleAllStickyNotes}>
          <SquareArrowOutUpRightIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn tooltip="Auto arrange nodes" onClick={() => {
          const positions = autoArrange(nodes, edges);
          onArrangeNodes?.(positions);
          requestAnimationFrame(fitView);
        }}>
          <LayoutGrid className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn tooltip="Toggle minimap">
          <MapIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn tooltip="Toggle screenshot mode">
          <Camera className="h-4 w-4" />
        </ToolBtn>
      </div>
    </div>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

function ToolBtn({
  children,
  tooltip,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative group/btn">
      <button
        onClick={onClick}
        disabled={disabled}
        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {children}
      </button>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-gray-600 text-[12px] font-medium rounded-md whitespace-nowrap pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
}
