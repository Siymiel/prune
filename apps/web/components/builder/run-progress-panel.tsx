"use client";

import { useState, useCallback } from "react";
import {
  X,
  History,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CanvasNode,
  type CanvasEdge,
  type RunPhase,
  type NodeRunStatus,
  getNodeDef,
  getNodeIdentifier,
} from "@/lib/editor-nodes";
import type { RunOut, TraceStep } from "@/lib/api";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";

// ── Topological order for display ────────────────────────────────────────────

function topoOrder(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasNode[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const out: Record<string, string[]> = {};
  const indegree: Record<string, number> = {};
  nodes.forEach((n) => {
    out[n.id] = [];
    indegree[n.id] = 0;
  });
  edges.forEach((e) => {
    if (nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)) {
      out[e.sourceId].push(e.targetId);
      indegree[e.targetId]++;
    }
  });
  const queue = nodes.filter((n) => indegree[n.id] === 0).map((n) => n.id);
  const result: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    result.push(id);
    for (const t of out[id]) {
      indegree[t]--;
      if (indegree[t] === 0) queue.push(t);
    }
  }
  nodes.forEach((n) => {
    if (!result.includes(n.id)) result.push(n.id);
  });
  return result.map((id) => nodes.find((n) => n.id === id)!).filter(Boolean);
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── JSON Syntax Highlighter ───────────────────────────────────────────────────

type TokenKind = "key" | "string" | "number" | "bool" | "null" | "punct" | "ws";
interface JToken {
  k: TokenKind;
  v: string;
}

function tokenize(json: string): JToken[] {
  const tokens: JToken[] = [];
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < json.length && /\s/.test(json[j])) j++;
      tokens.push({ k: "ws", v: json.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      while (j < json.length) {
        if (json[j] === "\\") {
          j += 2;
          continue;
        }
        if (json[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      const str = json.slice(i, j);
      let k = j;
      while (k < json.length && json[k] === " ") k++;
      tokens.push({ k: json[k] === ":" ? "key" : "string", v: str });
      i = j;
      continue;
    }
    if (ch === "-" || /\d/.test(ch)) {
      let j = i;
      if (json[j] === "-") j++;
      while (j < json.length && /\d/.test(json[j])) j++;
      if (j < json.length && json[j] === ".") {
        j++;
        while (j < json.length && /\d/.test(json[j])) j++;
      }
      if (j < json.length && /[eE]/.test(json[j])) {
        j++;
        if (/[+\-]/.test(json[j])) j++;
        while (j < json.length && /\d/.test(json[j])) j++;
      }
      tokens.push({ k: "number", v: json.slice(i, j) });
      i = j;
      continue;
    }
    if (json.startsWith("true", i)) {
      tokens.push({ k: "bool", v: "true" });
      i += 4;
      continue;
    }
    if (json.startsWith("false", i)) {
      tokens.push({ k: "bool", v: "false" });
      i += 5;
      continue;
    }
    if (json.startsWith("null", i)) {
      tokens.push({ k: "null", v: "null" });
      i += 4;
      continue;
    }
    tokens.push({ k: "punct", v: ch });
    i++;
  }
  return tokens;
}

const COLORS: Record<TokenKind, string | undefined> = {
  key: "#d19a66",
  string: "#e06c75",
  number: "#98c379",
  bool: "#56b6c2",
  null: "#56b6c2",
  punct: "#6b7280",
  ws: undefined,
};

function JsonHighlighter({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2) ?? "null";
  const tokens = tokenize(json);
  return (
    <pre className="text-[12px] font-mono leading-[1.6] whitespace-pre overflow-auto m-0">
      {tokens.map((t, i) =>
        t.k === "ws" ? (
          t.v
        ) : (
          <span key={i} style={{ color: COLORS[t.k] }}>
            {t.v}
          </span>
        ),
      )}
    </pre>
  );
}

// ── I/O expandable section ────────────────────────────────────────────────────

function IoSection({ label, data }: { label: string; data: unknown }) {
  const [tab, setTab] = useState<"formatted" | "text">("formatted");
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonText = JSON.stringify(data, null, 2) ?? "null";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [jsonText]);

  return (
    <div>
      {/* Label row with controls */}
      <div className="grid mb-1.5 mt-3">
        <p className="text-[14px] font-[450] text-gray-500 flex-1">{label}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-0.5 px-0.5 py-0.5 bg-prune-lightGray border border-prune-borderGray rounded-md">
            {(["formatted", "text"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-2 py-1 text-[13px] font-[500] rounded-md transition-colors",
                  tab === t
                    ? "bg-white text-gray-800 border border-prune-borderGray"
                    : "text-gray-400 hover:text-gray-800",
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "Collapse" : "Expand"}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 p-1 hover:text-gray-600 transition-colors border border-prune-borderGray"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleCopy}
            title="Copy"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 p-1 hover:text-gray-600 transition-colors border border-prune-borderGray"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
          </div>
        </div>
      </div>
      {/* Content only */}
      <div className="border border-prune-borderGray rounded-lg overflow-hidden bg-prune-lightGray">
        <div
          className={cn(
            "overflow-auto px-3 py-2.5 transition-all duration-200",
            fullscreen ? "max-h-[400px]" : "max-h-[160px]",
          )}
        >
          {tab === "formatted" ? (
            <JsonHighlighter data={data} />
          ) : (
            <pre className="text-[12px] font-mono text-gray-800 whitespace-pre leading-[1.6] m-0">
              {jsonText}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Single node row ───────────────────────────────────────────────────────────

function NodeRunRow({
  node,
  nodes,
  traceStep,
  runStatus,
}: {
  node: CanvasNode;
  nodes: CanvasNode[];
  traceStep: TraceStep | undefined;
  runStatus: NodeRunStatus;
}) {
  const [expanded, setExpanded] = useState(false);
  const def = getNodeDef(node.kind);
  const identifier = getNodeIdentifier(node, nodes);
  const Icon = def?.icon;
  const hasData =
    !!traceStep &&
    (traceStep.input != null ||
      traceStep.output != null ||
      traceStep.error != null);

  const statusIcon = (() => {
    switch (runStatus) {
      case "running":
        return (
          <Loader2 className="h-[15px] w-[15px] text-blue-500 animate-spin shrink-0" />
        );
      case "done":
        return (
          <BadgeCheck className="h-[15px] w-[15px] text-emerald-500 shrink-0" />
        );
      case "error":
        return (
          <AlertCircle className="h-[15px] w-[15px] text-red-500 shrink-0" />
        );
      default:
        return (
          <div className="h-[15px] w-[15px] rounded-full border-2 border-gray-300 bg-white shrink-0" />
        );
    }
  })();

  const cardBorder = {
    running: "border-blue-200",
    done: "border-emerald-200",
    error: "border-red-200",
    pending: "border-gray-200",
  }[runStatus];

  return (
    <div className="flex gap-4 px-4 pb-4">
      {/* Left icon */}
      <div className="flex items-start shrink-0 pt-2" style={{ width: 28 }}>
        <div className="h-8 w-8 rounded-full bg-white flex items-center border border-prune-borderGray justify-center shrink-0">
          {def?.integrationId ? (
            renderIntegrationIcon(def.integrationId, 15)
          ) : Icon ? (
            <Icon
              className={cn("h-3.5 w-3.5", def?.iconClass ?? "text-gray-500")}
            />
          ) : null}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "border rounded-xl overflow-hidden bg-white",
            cardBorder,
          )}
        >
          {/* Header */}
          <button
            onClick={() => hasData && setExpanded((e) => !e)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors",
              hasData ? "hover:bg-prune-lightGray cursor-pointer" : "cursor-default",
              expanded && "bg-prune-lightGray",
            )}
          >
            {statusIcon}
            <span className="text-[14px] font-medium font-sans text-gray-900 truncate shrink-0 max-w-[120px]">
              {node.label}
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 border border-gray-400 font-medium rounded-md bg-prune-lightGray text-gray-500 shrink-0">
              {identifier}
            </span>
            <span className="flex-1" />
            {traceStep?.ms != null && traceStep.ms > 0 && (
              <span className="text-[12px] font-[450] text-gray-400 shrink-0 tabular-nums">
                {formatMs(traceStep.ms)}
              </span>
            )}
            {hasData ? (
              expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              )
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-300 shrink-0" />
            )}
          </button>

          {/* Expanded I/O */}
          {expanded && hasData && (
            <div className="border-t border-gray-100 bg-white px-3 pb-3">
              {traceStep?.error != null && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-mono text-red-700 break-all leading-[1.5]">
                    {traceStep.error}
                  </p>
                </div>
              )}
              {traceStep?.input != null && (
                <IoSection label="Inputs" data={traceStep.input} />
              )}
              {traceStep?.output != null && (
                <IoSection label="Outputs" data={traceStep.output} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface RunProgressPanelProps {
  open: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  runPhase: RunPhase;
  runResult: RunOut | null;
  nodeRunStatuses: Record<string, NodeRunStatus>;
  runError?: string;
}

export function RunProgressPanel({
  open,
  onClose,
  nodes,
  edges,
  runPhase,
  runResult,
  nodeRunStatuses,
  runError,
}: RunProgressPanelProps) {
  const [copiedError, setCopiedError] = useState(false);

  const handleCopyError = useCallback(() => {
    if (!runError) return;
    navigator.clipboard.writeText(runError).catch(() => {});
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 1800);
  }, [runError]);

  const orderedNodes = topoOrder(nodes, edges);
  const traceMap = new Map<string, TraceStep>(
    (runResult?.trace ?? []).map((s) => [s.node, s]),
  );

  const totalMs =
    runResult?.trace.reduce((acc, s) => acc + (s.ms ?? 0), 0) ?? 0;

  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 w-[420px] max-h-[calc(100vh-5rem)] bg-[#f9fafb] border border-gray-200 rounded-xl shadow-xl flex flex-col z-40",
        "transition-[transform,opacity] duration-200 ease-in-out",
        open
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-md border-b border-prune-borderGray bg-white shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-gray-900">
              Run progress
            </h2>
            {runPhase === "running" && (
              <span className="flex items-center gap-1 text-[12px] font-[450] text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Running…
              </span>
            )}
            {runPhase === "done" && totalMs > 0 && (
              <span className="text-[12px] font-[450] text-gray-400 tabular-nums">
                {formatMs(totalMs)} total
              </span>
            )}
            {runPhase === "error" && (
              <span className="text-[12px] font-[450] text-red-500">
                Failed
              </span>
            )}
          </div>
        </div>
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title="Run history (coming soon)"
        >
          <History className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Error banner */}
      {runPhase === "error" && runError && (
        <div className="mx-3 mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg shrink-0">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] font-mono text-red-700 break-all leading-[1.5] flex-1">
            {runError}
          </p>
          <button
            onClick={handleCopyError}
            title="Copy error"
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            {copiedError ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      )}

      {/* Node list */}
      <div className="py-3">
        {orderedNodes.length === 0 ? (
          <p className="text-center py-16 text-[14px] font-[450] text-gray-400">
            No nodes in workflow
          </p>
        ) : (
          orderedNodes.map((node) => (
            <NodeRunRow
              key={node.id}
              node={node}
              nodes={nodes}
              traceStep={traceMap.get(node.id)}
              runStatus={nodeRunStatuses[node.id] ?? "pending"}
            />
          ))
        )}
      </div>
    </div>
  );
}
