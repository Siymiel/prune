"use client";

import { ChevronDown, MoreHorizontal, X, Plus, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNodeDef, type CanvasNode, type NodeDef } from "@/lib/editor-nodes";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";

export const NODE_WIDTH = 260;
export const HANDLE_Y_OFFSET = 24;
export const HANDLE_SIDE_OFFSET = 16;

function NodeContent({
  node,
  def,
  onUpdateValue,
}: {
  node: CanvasNode;
  def: NodeDef;
  onUpdateValue: (id: string, value: string) => void;
}) {
  const textareaClass =
    "w-full px-2 py-1.5 text-xs bg-gray-100 border rounded text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-ring font-mono";

  if (def.kind === "text-input") {
    return (
      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
          Value
        </div>
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Enter value or leave blank for user input…"
          value={node.inputValue ?? ""}
          onChange={(e) => onUpdateValue(node.id, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  if (def.kind === "ai-agent" || def.kind === "prune-ai") {
    return (
      <div className="px-3 pb-3 space-y-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
            Prompt
          </div>
          <textarea
            className={textareaClass}
            rows={3}
            placeholder="You are a helpful assistant that…"
            value={node.inputValue ?? ""}
            onChange={(e) => onUpdateValue(node.id, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/40 border text-[10px] text-muted-foreground">
          <span className="h-3 w-3 rounded-sm bg-primary/20 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          claude-sonnet-4-6
        </div>
      </div>
    );
  }

  if (def.kind === "openai-app") {
    return (
      <div className="px-3 pb-3 space-y-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
            Prompt
          </div>
          <textarea
            className={textareaClass}
            rows={3}
            placeholder="Enter your prompt…"
            value={node.inputValue ?? ""}
            onChange={(e) => onUpdateValue(node.id, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/40 border text-[10px] text-muted-foreground">
          <span className="h-3 w-3 rounded-sm bg-muted-foreground/20 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          </span>
          gpt-4o
        </div>
      </div>
    );
  }

  if (def.kind === "knowledge-base") {
    return (
      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
          Source
        </div>
        <div
          className="w-full px-2 py-1.5 text-xs bg-muted/30 border rounded text-muted-foreground/50"
          onMouseDown={(e) => e.stopPropagation()}
        >
          Select a knowledge base…
        </div>
      </div>
    );
  }

  if (def.kind === "trigger") {
    return (
      <div className="px-3 pb-3">
        <div className="px-2 py-2 bg-muted/30 border rounded text-[10px] text-muted-foreground">
          Event:{" "}
          <span className="text-foreground font-medium">
            WhatsApp message received
          </span>
        </div>
      </div>
    );
  }

  if (def.badge === "Output") {
    return (
      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 font-medium">
          Value
        </div>
        <div className="px-2 py-1.5 text-xs bg-muted/30 border rounded text-muted-foreground/50 font-mono">
          {"{{result}}"}
        </div>
      </div>
    );
  }

  if (def.badge === "App") {
    return (
      <div className="px-3 pb-3">
        <div className="px-2 py-2 bg-muted/30 border rounded text-[10px] text-muted-foreground leading-relaxed">
          {def.description}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3">
      <textarea
        className={textareaClass}
        rows={2}
        placeholder={def.description}
        value={node.inputValue ?? ""}
        onChange={(e) => onUpdateValue(node.id, e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

interface NodeCardProps {
  node: CanvasNode;
  isConnecting: boolean;
  connectingSourceId: string | null;
  isSelected?: boolean;
  onStartDrag: (e: React.MouseEvent) => void;
  onUpdateValue: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onStartConnect: (nodeId: string) => void;
  onCompleteConnect: (nodeId: string) => void;
  onSelect?: (nodeId: string) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export function NodeCard({
  node,
  isConnecting,
  connectingSourceId,
  isSelected,
  onStartDrag,
  onUpdateValue,
  onRemove,
  onStartConnect,
  onCompleteConnect,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: NodeCardProps) {
  const def = getNodeDef(node.kind);
  if (!def) return null;

  const Icon = def.icon;
  const isSource = connectingSourceId === node.id;

  return (
    <div
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      className={cn(
        "absolute group/node bg-card rounded-xl shadow-sm select-none border transition-colors",
        isSelected ? "border-gray-400" : "border-border",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if ((e.target as HTMLElement).closest("button")) return;
        onSelect?.(node.id);
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* Run button — appears on node hover, wrapper always pointer-events-none to avoid blocking handles */}
      <div className="absolute -top-8 left-0 right-0 pb-1 flex justify-start pointer-events-none opacity-0 group-hover/node:opacity-100 transition-opacity z-30">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-md bg-background border shadow-sm text-[10px] font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
        >
          <Play className="h-3 w-3" />
          Run
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </div>

      {/* INPUT handle — left edge, hidden for trigger nodes (no incoming connections) */}
      {node.kind !== "trigger" && (
        <button
          style={{ top: HANDLE_Y_OFFSET - 10, left: -22 }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => {
            e.stopPropagation();
            if (isConnecting && !isSource) onCompleteConnect(node.id);
          }}
          className={cn(
            "absolute w-4 h-4 rounded-md border z-20 flex items-center justify-center transition-all duration-200 ease-out",
            "group-hover/node:scale-125 hover:scale-125",
            "hover:bg-black hover:border-black",
            isConnecting && !isSource
              ? "bg-primary/20 border-primary cursor-pointer animate-pulse"
              : "bg-background border-muted-foreground/30",
          )}
        >
          {!isConnecting && (
            <Plus
              className="
            h-3 w-3
            text-black
            opacity-0
            transition-all duration-200
            group-hover/node:opacity-100
            hover:text-white
          "
            />
          )}
        </button>
      )}

      {/* OUTPUT handle — right edge, box style, spaced from card */}
      <button
        style={{ top: HANDLE_Y_OFFSET - 10, right: -22 }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (!isConnecting) onStartConnect(node.id);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (isConnecting) onCompleteConnect(node.id); // releasing on source cancels; on other node completes
        }}
        className={cn(
          "absolute w-4 h-4 rounded-md border z-20 flex items-center justify-center transition-all duration-200 ease-out",
          "group-hover/node:scale-125 hover:scale-125",
          "hover:bg-black hover:border-black",
          isSource
            ? "bg-primary border-primary"
            : isConnecting
              ? "bg-background border-muted-foreground/20 opacity-40 cursor-default"
              : "bg-background border-muted-foreground/30 cursor-pointer",
        )}
      >
        {isSource ? (
          <Plus className="h-3 w-3 text-white" />
        ) : !isConnecting ? (
          <Plus
            className="
              h-3 w-3
              text-black
              opacity-0
              transition-all duration-200
              group-hover/node:opacity-100
              hover:text-white
            "
          />
        ) : null}
      </button>

      {/* Header — drag handle with X button */}
      <div className="mb-2.5">
        <div
          className="px-3 pt-2.5 pb-1 flex items-center gap-2 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartDrag(e);
          }}
        >
          <div className="h-7 w-7 rounded-md bg-muted/50 border flex items-center justify-center shrink-0">
            {def.integrationId ? (
              renderIntegrationIcon(def.integrationId, 14)
            ) : (
              <Icon className={cn("h-3.5 w-3.5", def.iconClass)} />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-sm font-medium leading-tight">
              {node.label}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(node.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="px-3 text-[12px] text-muted-foreground line-clamp-1">
          {def.description}
        </div>
      </div>

      {/* Content */}
      <NodeContent node={node} def={def} onUpdateValue={onUpdateValue} />

      {/* Footer — grayed background */}
      <div className="px-3 py-2 border-t flex items-center gap-2 text-[10px] text-muted-foreground bg-gray-100 rounded-b-xl">
        <button
          className="flex items-center gap-0.5 hover:text-foreground transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ChevronDown className="h-3 w-3" />
          view results
        </button>
        <span className="ml-auto">0 tokens</span>
        <span className="flex items-center gap-0.5">
          <MoreHorizontal className="h-3 w-3 rotate-90 opacity-40" />
          0.0 sec
        </span>
      </div>
    </div>
  );
}
