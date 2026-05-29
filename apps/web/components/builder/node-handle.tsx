"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CanvasNode, type NodeDef } from "@/lib/editor-nodes";

const HANDLE_Y_OFFSET = 24;

export interface NodeHandleProps {
  type: "input" | "output";
  node: CanvasNode;
  def: NodeDef;
  isConnecting: boolean;
  connectingSourceId: string | null;
  onStartConnect: (nodeId: string) => void;
  onCompleteConnect: (nodeId: string) => void;
  onOpenPicker?: (
    nodeId: string,
    screenX: number,
    screenY: number,
    side: "input" | "output",
  ) => void;
}

export function NodeHandle({
  type,
  node,
  def,
  isConnecting,
  connectingSourceId,
  onStartConnect,
  onCompleteConnect,
  onOpenPicker,
}: NodeHandleProps) {
  const dragMoved = useRef(false);
  const dragCleanup = useRef<(() => void) | null>(null);
  const isSource = connectingSourceId === node.id;

  if (type === "input" && node.kind === "trigger") return null;
  if (type === "output" && def.kind === "output") return null;

  if (type === "input") {
    return (
      <button
        style={{ top: HANDLE_Y_OFFSET - 10, left: -22 }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (isConnecting) return;
          dragMoved.current = false;
          const startX = e.clientX;
          const startY = e.clientY;
          const onMove = (me: MouseEvent) => {
            if (
              !dragMoved.current &&
              Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY) > 6
            ) {
              dragMoved.current = true;
              document.removeEventListener("mousemove", onMove);
              dragCleanup.current = null;
            }
          };
          dragCleanup.current = () =>
            document.removeEventListener("mousemove", onMove);
          document.addEventListener("mousemove", onMove);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          dragCleanup.current?.();
          dragCleanup.current = null;
          if (isConnecting && !isSource) {
            onCompleteConnect(node.id);
          } else if (!isConnecting && !dragMoved.current) {
            onOpenPicker?.(node.id, e.clientX, e.clientY, "input");
          }
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
          <Plus className="h-3 w-3 text-black opacity-0 transition-all duration-200 group-hover/node:opacity-100 hover:text-white" />
        )}
      </button>
    );
  }

  return (
    <button
      style={{ top: HANDLE_Y_OFFSET - 10, right: -22 }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (isConnecting) return;
        dragMoved.current = false;
        const startX = e.clientX;
        const startY = e.clientY;
        const onMove = (me: MouseEvent) => {
          if (
            !dragMoved.current &&
            Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY) > 6
          ) {
            dragMoved.current = true;
            document.removeEventListener("mousemove", onMove);
            dragCleanup.current = null;
            onStartConnect(node.id);
          }
        };
        dragCleanup.current = () =>
          document.removeEventListener("mousemove", onMove);
        document.addEventListener("mousemove", onMove);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        dragCleanup.current?.();
        dragCleanup.current = null;
        if (isConnecting) {
          onCompleteConnect(node.id);
        } else if (!dragMoved.current) {
          onOpenPicker?.(node.id, e.clientX, e.clientY, "output");
        }
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
        <Plus className="h-3 w-3 text-black opacity-0 transition-all duration-200 group-hover/node:opacity-100 hover:text-white" />
      ) : null}
    </button>
  );
}
