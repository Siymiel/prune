"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Sparkles,
  Plus,
  MousePointer2,
  Scan,
  LayoutGrid,
  Map as MapIcon,
  Camera,
  Fullscreen,
  SquareArrowOutUpRightIcon,
  Loader2,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import {
  type CanvasNode,
  type CanvasEdge,
  type NodeKind,
  getNodeDef,
  type NodeRunStatus,
  type RunPhase,
} from "@/lib/editor-nodes";
import {
  NodeCard,
  NODE_WIDTH,
  HANDLE_Y_OFFSET,
  HANDLE_SIDE_OFFSET,
} from "./node-card";
import { NodePickerModal } from "./node-picker-modal";
import { cn } from "@/lib/utils";

const CANVAS_W = 4000;
const CANVAS_H = 3000;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.5;

// ── Auto-arrange: hierarchical left-to-right layout ──────────────────────────
const NODE_H = 170; // approximate card height for spacing
const H_STEP = NODE_WIDTH + 140;
const V_STEP = NODE_H + 70;

function autoArrange(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): { id: string; x: number; y: number }[] {
  if (nodes.length === 0) return [];

  const nodeIds = new Set(nodes.map((n) => n.id));
  const out: Record<string, string[]> = {};
  const inc: Record<string, string[]> = {};
  nodes.forEach((n) => {
    out[n.id] = [];
    inc[n.id] = [];
  });
  edges.forEach((e) => {
    if (nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)) {
      out[e.sourceId].push(e.targetId);
      inc[e.targetId].push(e.sourceId);
    }
  });

  // Assign layers: longest path from sources (Kahn + relaxation)
  const layer: Record<string, number> = {};
  nodes.forEach((n) => {
    layer[n.id] = 0;
  });
  const indegree = new Map(
    nodes.map((n) => [n.id, inc[n.id].length] as [string, number]),
  );
  const queue = nodes.filter((n) => inc[n.id].length === 0).map((n) => n.id);

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
  indegree.forEach((deg, id) => {
    if (deg > 0) layer[id] = maxL + 1;
  });

  // Group into columns
  const numCols = Math.max(...Object.values(layer)) + 1;
  const cols: string[][] = Array.from({ length: numCols }, () => []);
  nodes.forEach((n) => cols[layer[n.id]].push(n.id));

  // Barycenter heuristic: order first column by original y, then each
  // subsequent column by average rank of predecessors
  const rank: Record<string, number> = {};
  cols[0].sort((a, b) => {
    const na = nodes.find((n) => n.id === a)!;
    const nb = nodes.find((n) => n.id === b)!;
    return na.y - nb.y;
  });
  cols[0].forEach((id, i) => {
    rank[id] = i;
  });

  for (let l = 1; l < numCols; l++) {
    cols[l].sort((a, b) => {
      const ra = inc[a].length
        ? inc[a].reduce((s, p) => s + (rank[p] ?? 0), 0) / inc[a].length
        : 0;
      const rb = inc[b].length
        ? inc[b].reduce((s, p) => s + (rank[p] ?? 0), 0) / inc[b].length
        : 0;
      return ra - rb;
    });
    cols[l].forEach((id, i) => {
      rank[id] = i;
    });
  }

  // Center all columns around the same vertical midline
  const maxRows = Math.max(...cols.map((c) => c.length));
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
  onAddConnectedNode: (
    kind: NodeKind,
    x: number,
    y: number,
    anchorId: string,
    side: "input" | "output",
  ) => void;
  onArrangeNodes?: (positions: { id: string; x: number; y: number }[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleStickyNote?: (id: string) => void;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onUpdateStickyNoteColor?: (id: string, color: string) => void;
  onToggleAllStickyNotes?: () => void;
  nodeRunStatuses?: Record<string, NodeRunStatus>;
  runPhase?: RunPhase;
  runCurrentNodeLabel?: string;
  lastSavedAt?: number | null;
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
  nodeRunStatuses,
  runPhase,
  runCurrentNodeLabel,
  lastSavedAt,
}: EditorCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(1);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [panning, setPanning] = useState<{
    startMX: number;
    startMY: number;
    startPX: number;
    startPY: number;
  } | null>(null);
  const [connecting, setConnecting] = useState<{ sourceId: string } | null>(
    null,
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [showMinimap, setShowMinimap] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 700 });

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () =>
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }
      if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        onRedo?.();
      }
      if (e.key === "y") {
        e.preventDefault();
        onRedo?.();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onUndo, onRedo]);

  // ── Outer mouse events ────────────────────────────────────────────────────
  function handleOuterMouseDown(e: React.MouseEvent) {
    if (connecting) return; // don't start panning while drawing a connection
    if (dragging) return;
    setPanning({
      startMX: e.clientX,
      startMY: e.clientY,
      startPX: pan.x,
      startPY: pan.y,
    });
  }

  function handleMouseMove(e: React.MouseEvent) {
    const c = toCanvas(e.clientX, e.clientY);
    setMousePos(c);

    if (dragging) {
      const x = c.x - dragging.offsetX;
      const y = c.y - dragging.offsetY;
      setLocalPositions((prev) => ({ ...prev, [dragging.id]: { x, y } }));
      return;
    }
    if (panning) {
      setPan({
        x: panning.startPX + e.clientX - panning.startMX,
        y: panning.startPY + e.clientY - panning.startMY,
      });
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
    () =>
      nodes.map((n) => {
        const lp = localPositions[n.id];
        return lp ? { ...n, ...lp } : n;
      }),
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

  const completeConnect = useCallback(
    (targetId: string) => {
      if (!connecting || connecting.sourceId === targetId) {
        setConnecting(null);
        return;
      }
      onAddEdge(connecting.sourceId, targetId);
      setConnecting(null);
    },
    [connecting, onAddEdge],
  );

  // ── Node picker (click output handle) ────────────────────────────────────
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState<{
    anchorId: string;
    screenX: number;
    screenY: number;
    side: "input" | "output";
    popupWidth?: number;
  } | null>(null);

  const openPicker = useCallback(
    (
      anchorId: string,
      screenX: number,
      screenY: number,
      side: "input" | "output",
    ) => {
      setPicker({ anchorId, screenX, screenY, side });
    },
    [],
  );

  const handlePickerSelect = useCallback(
    (kind: NodeKind) => {
      if (!picker) return;
      if (!picker.anchorId) {
        const rect = outerRef.current?.getBoundingClientRect();
        const cx = rect
          ? (rect.width / 2 - panRef.current.x) / zoomRef.current
          : 300;
        const cy = rect
          ? (rect.height / 2 - panRef.current.y) / zoomRef.current
          : 200;
        onAddNode(kind, Math.max(0, cx - NODE_WIDTH / 2), Math.max(0, cy - 40));
      } else {
        const anchor = nodes.find((n) => n.id === picker.anchorId);
        const newX =
          picker.side === "output"
            ? (anchor?.x ?? 200) + NODE_WIDTH + 120
            : (anchor?.x ?? 200) - NODE_WIDTH - 120;
        const newY = anchor?.y ?? 200;
        onAddConnectedNode(kind, newX, newY, picker.anchorId, picker.side);
      }
      setPicker(null);
    },
    [picker, nodes, onAddConnectedNode, onAddNode],
  );

  // ── Sidebar drag-and-drop ─────────────────────────────────────────────────
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const kind = e.dataTransfer.getData("text/plain") as NodeKind;
    if (!kind || !getNodeDef(kind)) return;
    const c = toCanvas(e.clientX, e.clientY);
    onAddNode(kind, Math.max(0, c.x - NODE_WIDTH / 2), Math.max(0, c.y - 40));
  }

  // ── Fit view ──────────────────────────────────────────────────────────────
  const fitView = useCallback(() => {
    const rect = outerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (nodes.length === 0) {
      setZoom(1);
      setPan({ x: 60, y: 60 });
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x)) - 60;
    const minY = Math.min(...nodes.map((n) => n.y)) - 60;
    const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH)) + 60;
    const maxY = Math.max(...nodes.map((n) => n.y + 200)) + 60;
    const cw = maxX - minX;
    const ch = maxY - minY;
    const nz = Math.min(
      MAX_ZOOM,
      Math.min(rect.width / cw, rect.height / ch) * 0.9,
    );
    setZoom(nz);
    setPan({
      x: (rect.width - cw * nz) / 2 - minX * nz,
      y: (rect.height - ch * nz) / 2 - minY * nz,
    });
  }, [nodes]);

  // Auto-fit to content on first render that has nodes.
  // Double-RAF ensures flex layout has fully settled before measuring.
  const hasAutoFit = useRef(false);
  useEffect(() => {
    if (hasAutoFit.current || nodes.length === 0) return;
    hasAutoFit.current = true;
    let r1 = 0,
      r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(fitView);
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [nodes, fitView]);

  // ── SVG edge data ─────────────────────────────────────────────────────────
  const nodeMap = Object.fromEntries(effectiveNodes.map((n) => [n.id, n]));

  const edgeData = edges.flatMap((edge) => {
    const src = nodeMap[edge.sourceId];
    const tgt = nodeMap[edge.targetId];
    if (!src || !tgt) return [];
    const sx = src.x + NODE_WIDTH + HANDLE_SIDE_OFFSET;
    const sy = src.y + HANDLE_Y_OFFSET;
    const tx = tgt.x - HANDLE_SIDE_OFFSET;
    const ty = tgt.y + HANDLE_Y_OFFSET;
    const isConnectedToHoveredNode =
      hoveredNodeId &&
      (edge.sourceId === hoveredNodeId || edge.targetId === hoveredNodeId);
    return [
      {
        id: edge.id,
        d: bezierPath(sx, sy, tx, ty),
        mx: (sx + tx) / 2,
        my: (sy + ty) / 2,
        isConnectedToHoveredNode,
      },
    ];
  });

  const cursorStyle = connecting ? "crosshair" : panning ? "grabbing" : "grab";

  return (
    <div
      ref={outerRef}
      className={cn(
        "flex-1 relative overflow-hidden",
        dragOver && "ring-2 ring-primary/20 ring-inset",
      )}
      style={{
        cursor: cursorStyle,
        backgroundColor: "#eff0f0",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, hsl(0 0% 0% / 0.12) 1px, transparent 0)",
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
          transformOrigin: "0 0",
          width: CANVAS_W,
          height: CANVAS_H,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* SVG node connection line */}
        <svg
          className="absolute inset-0 overflow-visible"
          width={CANVAS_W}
          height={CANVAS_H}
        >
          {/* Existing edges */}
          {edgeData.map((e) => (
            <g
              key={e.id}
              onMouseEnter={() => setHoveredEdgeId(e.id)}
              onMouseLeave={() => setHoveredEdgeId(null)}
            >
              {/* Thick transparent hit area for easy hover */}
              <path
                d={e.d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: "pointer" }}
              />
              {/* Visible stroke */}
              <path
                d={e.d}
                fill="none"
                stroke={
                  hoveredEdgeId === e.id || e.isConnectedToHoveredNode
                    ? "#4b5563"
                    : "#9ca3af"
                }
                strokeWidth={
                  hoveredEdgeId === e.id || e.isConnectedToHoveredNode ? 2 : 1.5
                }
                markerEnd="url(#arrow-end)"
                style={{
                  pointerEvents: "none",
                  transition: "all 180ms ease",
                }}
              />
              {/* Delete button above midpoint, box-shaped */}
              {hoveredEdgeId === e.id && (
                <>
                  {/* Transparent bridge so hover isn't lost moving cursor from line to button */}
                  <rect
                    x={e.mx - 9}
                    y={e.my - 20}
                    width={18}
                    height={16}
                    fill="transparent"
                  />
                  <g
                    style={{ cursor: "pointer" }}
                    onMouseDown={(evt) => {
                      evt.stopPropagation();
                      onRemoveEdge?.(e.id);
                      setHoveredEdgeId(null);
                    }}
                    transform={`translate(${e.mx}, ${e.my - 22})`}
                  >
                    <rect
                      x={-8}
                      y={-8}
                      width={16}
                      height={16}
                      fill="#ef4444"
                      rx={2}
                    />
                    <line
                      x1={-3}
                      y1={-3}
                      x2={3}
                      y2={3}
                      stroke="white"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                    <line
                      x1={3}
                      y1={-3}
                      x2={-3}
                      y2={3}
                      stroke="white"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                  </g>
                </>
              )}
            </g>
          ))}

          {/* In-progress connection line — start point tracks source node live */}
          {(() => {
            if (!connecting) return null;
            const src = effectiveNodes.find(
              (n) => n.id === connecting.sourceId,
            );
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
                style={{ pointerEvents: "none" }}
              />
            );
          })()}
        </svg>

        {/* Nodes */}
        {effectiveNodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            isConnecting={!!connecting}
            connectingSourceId={connecting?.sourceId ?? null}
            isSelected={selectedNodeId === node.id}
            onStartDrag={(e) => startNodeDrag(e, node)}
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
            runStatus={nodeRunStatuses?.[node.id]}
          />
        ))}
      </div>

      {/* Node picker modal — outside transform so it uses raw screen coords */}
      {picker && (
        <NodePickerModal
          screenX={picker.screenX}
          screenY={picker.screenY}
          popupWidth={picker.popupWidth}
          onSelect={handlePickerSelect}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Run status pill */}
      {runPhase && runPhase !== "idle" && (
        <div className="absolute top-3 left-0 right-0 mx-auto w-fit z-30 pointer-events-none">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-md text-xs font-medium whitespace-nowrap",
              runPhase === "running" &&
                "bg-background border-border text-foreground",
              runPhase === "done" &&
                "bg-green-50 border-green-200 text-green-700",
              runPhase === "error" && "bg-red-50 border-red-200 text-red-700",
            )}
          >
            {runPhase === "running" && (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            )}
            {runPhase === "done" && <Check className="h-3.5 w-3.5 shrink-0" />}
            {runPhase === "error" && (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>
              {runPhase === "running"
                ? `Running: ${runCurrentNodeLabel ?? "…"}`
                : runPhase === "done"
                  ? "Workflow completed"
                  : "Workflow failed"}
            </span>
          </div>
        </div>
      )}

      {/* Bottom-left cluster: minimap + autosave pill */}
      {(showMinimap || !!lastSavedAt) && (
        <div className="absolute bottom-4 left-[70px] z-20 flex flex-col gap-2 items-start pointer-events-none">
          {showMinimap && (
            <div className="pointer-events-auto">
              <Minimap
                nodes={effectiveNodes}
                edges={edges}
                pan={pan}
                zoom={zoom}
                containerW={containerSize.w}
                containerH={containerSize.h}
                onClose={() => setShowMinimap(false)}
              />
            </div>
          )}
          {!!lastSavedAt && <AutosavePill savedAt={lastSavedAt} />}
        </div>
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
      {/* Centered with margin-auto (no transform) so position:fixed tooltips stay viewport-relative */}
      <div
        ref={toolbarRef}
        className="absolute bottom-4 left-0 right-0 mx-auto w-fit bg-background border rounded-md shadow-lg z-20 pointer-events-auto max-w-[calc(100%-2rem)]"
      >
        {/* Inner row: scrollable on narrow canvases, scrollbar hidden */}
        <div className="flex items-center gap-1 px-1 py-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {/* Ask AI */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            className="
            flex items-center gap-1
            px-3 py-1
            rounded-md
            border border-violet-300/80
            bg-violet-50/40
            text-violet-600
            text-[14px]
            font-medium
            whitespace-nowrap

            shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_14px_rgba(139,92,246,0.18)]

            hover:border-violet-400
            hover:bg-violet-50
            hover:shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_0_20px_rgba(139,92,246,0.28)]

            transition-all duration-200
          "
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </button>

          <Sep />

          {/* Add — opens NodePickerModal sized and aligned to match the toolbar */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const tbRect = toolbarRef.current?.getBoundingClientRect();
              const btnRect = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              setPicker({
                anchorId: "",
                screenX: tbRect ? tbRect.left : btnRect.left,
                screenY: btnRect.top,
                side: "output",
                popupWidth: tbRect ? tbRect.width : undefined,
              });
            }}
            className="group flex items-center gap-1 px-3 py-1 rounded-md bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            Add
          </button>

          <Sep />

          <ToolBtn tooltip="Undo" disabled={!canUndo} onClick={onUndo}>
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn tooltip="Redo" disabled={!canRedo} onClick={onRedo}>
            <Redo2 className="h-4 w-4" />
          </ToolBtn>

          <Sep />

          <ToolBtn
            tooltip="Zoom in"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            tooltip="Zoom out"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </ToolBtn>

          <Sep />

          <ToolBtn tooltip="Fit view" onClick={fitView}>
            <Fullscreen className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn tooltip="Toggle notes" onClick={onToggleAllStickyNotes}>
            <SquareArrowOutUpRightIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            tooltip="Auto arrange"
            onClick={() => {
              const positions = autoArrange(nodes, edges);
              onArrangeNodes?.(positions);
              requestAnimationFrame(fitView);
            }}
          >
            <LayoutGrid className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            tooltip="Minimap"
            active={showMinimap}
            onClick={() => setShowMinimap((v) => !v)}
          >
            <MapIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn tooltip="Screenshot">
            <Camera className="h-4 w-4" />
          </ToolBtn>
        </div>
      </div>
    </div>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" />;
}

function ToolBtn({
  children,
  tooltip,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });

  return (
    <>
      <button
        ref={btnRef}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          const r = btnRef.current?.getBoundingClientRect();
          if (r) setTipPos({ x: r.left + r.width / 2, y: r.top });
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
          active
            ? "bg-gray-200 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-gray-100",
        )}
      >
        {children}
      </button>
      {hovered && tooltip && (
        <div
          className="fixed px-2 py-1 bg-white border border-gray-100 text-gray-600 text-[12px] font-medium rounded-md whitespace-nowrap pointer-events-none z-[200] shadow-sm"
          style={{
            left: tipPos.x,
            top: tipPos.y,
            transform: "translateX(-50%) translateY(calc(-100% - 8px))",
          }}
        >
          {tooltip}
        </div>
      )}
    </>
  );
}

// ── Minimap ───────────────────────────────────────────────────────────────────

const MM_W = 200;
const MM_H = 128;
const MM_PAD = 14;

function getNodeEstH(kind: NodeKind): number {
  switch (kind) {
    case "ai-agent":
    case "prune-ai":
    case "openai-app":
      return 195;
    case "url":
      return 158;
    case "text-input":
      return 128;
    case "trigger":
    case "files":
    case "audio-input":
      return 84;
    default:
      return 94;
  }
}

function Minimap({
  nodes,
  edges,
  pan,
  zoom,
  containerW,
  containerH,
  onClose,
}: {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  pan: { x: number; y: number };
  zoom: number;
  containerW: number;
  containerH: number;
  onClose: () => void;
}) {
  const hasNodes = nodes.length > 0;

  // Viewport rectangle in canvas coordinates
  const vpCanvasLeft = -pan.x / zoom;
  const vpCanvasTop = -pan.y / zoom;
  const vpCanvasRight = vpCanvasLeft + containerW / zoom;
  const vpCanvasBottom = vpCanvasTop + containerH / zoom;

  // Node bounding box (fall back to viewport when there are no nodes)
  const nodesMinX = hasNodes
    ? Math.min(...nodes.map((n) => n.x))
    : vpCanvasLeft;
  const nodesMinY = hasNodes ? Math.min(...nodes.map((n) => n.y)) : vpCanvasTop;
  const nodesMaxX = hasNodes
    ? Math.max(...nodes.map((n) => n.x + NODE_WIDTH))
    : vpCanvasRight;
  const nodesMaxY = hasNodes
    ? Math.max(...nodes.map((n) => n.y + getNodeEstH(n.kind)))
    : vpCanvasBottom;

  // World = union of nodes + viewport so both are always visible, with padding
  const PAD_C = 80;
  const worldMinX = Math.min(nodesMinX, vpCanvasLeft) - PAD_C;
  const worldMinY = Math.min(nodesMinY, vpCanvasTop) - PAD_C;
  const worldMaxX = Math.max(nodesMaxX, vpCanvasRight) + PAD_C;
  const worldMaxY = Math.max(nodesMaxY, vpCanvasBottom) + PAD_C;

  const contentW = Math.max(1, worldMaxX - worldMinX);
  const contentH = Math.max(1, worldMaxY - worldMinY);

  const scale = Math.min(
    (MM_W - MM_PAD * 2) / contentW,
    (MM_H - MM_PAD * 2) / contentH,
  );

  const offsetX = MM_PAD - worldMinX * scale;
  const offsetY = MM_PAD - worldMinY * scale;

  // Viewport rect — always within minimap bounds because world includes it
  const vpL = vpCanvasLeft * scale + offsetX;
  const vpT = vpCanvasTop * scale + offsetY;
  const vpW = (containerW / zoom) * scale;
  const vpH = (containerH / zoom) * scale;

  return (
    <div className="bg-background border rounded-xl shadow-lg overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1 border-b bg-muted/30">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Minimap
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="h-4 w-4 flex items-center justify-center rounded hover:bg-gray-200 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* SVG map */}
      <svg width={MM_W} height={MM_H} className="block">
        <defs>
          <pattern
            id="mm-dot"
            width={8}
            height={8}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={1} cy={1} r={0.5} fill="hsl(0 0% 0% / 0.09)" />
          </pattern>
        </defs>
        <rect width={MM_W} height={MM_H} fill="url(#mm-dot)" />

        {/* Edges — bezier matching real canvas curves */}
        {edges.map((edge) => {
          const src = nodes.find((n) => n.id === edge.sourceId);
          const tgt = nodes.find((n) => n.id === edge.targetId);
          if (!src || !tgt) return null;
          const sx = (src.x + NODE_WIDTH) * scale + offsetX;
          const sy = (src.y + getNodeEstH(src.kind) / 2) * scale + offsetY;
          const tx = tgt.x * scale + offsetX;
          const ty = (tgt.y + getNodeEstH(tgt.kind) / 2) * scale + offsetY;
          const dx = Math.abs(tx - sx) * 0.55;
          return (
            <path
              key={edge.id}
              d={`M ${sx} ${sy} C ${sx + dx} ${sy} ${tx - dx} ${ty} ${tx} ${ty}`}
              fill="none"
              stroke="#6b7280"
              strokeWidth={1}
            />
          );
        })}

        {/* Nodes — skeleton matching real card shape */}
        {nodes.map((node) => {
          const x = node.x * scale + offsetX;
          const y = node.y * scale + offsetY;
          const w = Math.max(6, NODE_WIDTH * scale);
          const h = Math.max(5, getNodeEstH(node.kind) * scale);
          const hdrH = h * 0.34;
          const iconSz = Math.min(hdrH - 2, 4);
          const labelW = Math.max(0, w - iconSz - 9);
          const lineH = Math.max(1, h * 0.07);
          return (
            <g key={node.id}>
              {/* Card body */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={2}
                fill="#f8fafc"
                stroke="#9ca3af"
                strokeWidth={0.8}
              />
              {/* Header fill */}
              <rect
                x={x + 0.5}
                y={y + 0.5}
                width={w - 1}
                height={hdrH - 0.5}
                rx={1.5}
                fill="#e2e8f0"
              />
              {/* Header / content divider */}
              <line
                x1={x}
                y1={y + hdrH}
                x2={x + w}
                y2={y + hdrH}
                stroke="#cbd5e1"
                strokeWidth={0.6}
              />
              {/* Icon stub */}
              <rect
                x={x + 2}
                y={y + (hdrH - iconSz) / 2}
                width={iconSz}
                height={iconSz}
                rx={1}
                fill="#94a3b8"
              />
              {/* Label stub */}
              <rect
                x={x + iconSz + 4}
                y={y + hdrH / 2 - lineH / 2}
                width={labelW}
                height={lineH}
                rx={0.5}
                fill="#94a3b8"
              />
              {/* Content lines */}
              {h > 11 && (
                <>
                  <rect
                    x={x + 2}
                    y={y + hdrH + 2.5}
                    width={w * 0.68}
                    height={lineH}
                    rx={0.5}
                    fill="#cbd5e1"
                  />
                  <rect
                    x={x + 2}
                    y={y + hdrH + 2.5 + lineH + 2.5}
                    width={w * 0.48}
                    height={lineH}
                    rx={0.5}
                    fill="#cbd5e1"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Viewport indicator — blue rect showing the currently visible area */}
        <rect
          x={vpL}
          y={vpT}
          width={vpW}
          height={vpH}
          fill="hsl(217 91% 60% / 0.10)"
          stroke="hsl(217 91% 50%)"
          strokeWidth={1.2}
          rx={2}
        />
      </svg>

      {!hasNodes && (
        <div className="absolute inset-0 top-7 flex items-center justify-center pointer-events-none">
          <p className="text-[10px] text-muted-foreground/40">
            No nodes on canvas
          </p>
        </div>
      )}
    </div>
  );
}

// ── Autosave pill ─────────────────────────────────────────────────────────────

function AutosavePill({ savedAt }: { savedAt: number }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const secs = Math.floor((Date.now() - savedAt) / 1000);
  const label =
    secs < 5
      ? "just now"
      : secs < 60
        ? `${secs} seconds ago`
        : secs < 3600
          ? `${Math.floor(secs / 60)}m ago`
          : `${Math.floor(secs / 3600)}h ago`;

  return (
    <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 text-[15px] text-muted-foreground whitespace-nowrap select-none font-medium">
      <span className="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black shrink-0" />
      Auto-saved draft <span className="text-gray-700">{label}</span>
    </div>
  );
}
