"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CanvasNode } from "@/lib/editor-nodes";
import { NodesTab, VariablesTab } from "./output-panel";

function insertChipIntoEditor(id: string, label: string) {
  const el = document.querySelector("[data-template-editor]") as
    | (HTMLElement & { __insertChip?: (id: string, label: string) => void })
    | null;
  el?.__insertChip?.(id, label);
}

export function TemplatePickerPanel({
  nodes,
  currentNodeId,
  onClose,
}: {
  nodes: CanvasNode[];
  currentNodeId: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"nodes" | "variables">("nodes");

  return (
    <div className="w-full h-full bg-background border-r border-prune-borderGray flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-prune-borderGray shrink-0">
        <span className="flex-1 text-[13px] font-[450] text-foreground">Insert into Template</span>
        <button
          onClick={onClose}
          title="Close picker"
          className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 border-b border-prune-borderGray shrink-0">
        <div className="flex items-center p-0.5 bg-muted/30 border border-prune-borderGray rounded-md w-fit">
          {(["Nodes", "Variables"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t.toLowerCase() as "nodes" | "variables")}
              className={cn(
                "px-3 py-0.5 text-[11px] rounded transition-colors",
                tab === t.toLowerCase()
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted/40",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {tab === "nodes" ? (
          <NodesTab
            nodes={nodes}
            currentNodeId={currentNodeId}
            onInsert={insertChipIntoEditor}
          />
        ) : (
          <VariablesTab onInsert={insertChipIntoEditor} />
        )}
      </div>
    </div>
  );
}
