"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronsLeftRight,
  MoreVertical,
  Copy,
  SkipForward,
  Crosshair,
  Trash2,
  Bookmark,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodeDef,
  getModelProvider,
  getNodeIdentifier,
  type CanvasNode,
} from "@/lib/editor-nodes";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import { Textarea } from "@/components/ui/textarea";
import { InlineEditableTextInput } from "../inline-editable-text-input";
import { AIAgentPanelSections } from "./ai-agent-panel";
import { ActionCategoryPicker, parseActionConfig } from "./action-panel";
import { TriggerProviderPicker } from "./trigger-panel";
import { AudioOutputPanelSections } from "./audio-output-panel";
import { TemplatePanelSections } from "./template-panel";
import { UrlPanelSections } from "./url-panel";
import { TextInputPanelSections } from "./text-input-panel";
import { KnowledgeBasePanelSections } from "./knowledge-base-panel";
import { FilesPanelSections } from "./files-panel";
import { OutputPanelSections } from "./output-panel";
import { GenericPanelSections } from "./generic-panel";

export interface NodeDetailPanelProps {
  node: CanvasNode;
  nodes: CanvasNode[];
  onClose: () => void;
  onUpdateValue: (id: string, value: string) => void;
  onUpdateSystemPrompt: (id: string, value: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onRemoveNode: (id: string) => void;
  onFocusNode: (id: string) => void;
  onResizeMouseDown?: (e: React.MouseEvent) => void;
  scrollToSection?: { section: "tools" | "knowledge-sources"; trigger: number } | null;
}

export function NodeDetailPanel({
  node,
  nodes,
  onClose,
  onUpdateValue,
  onUpdateSystemPrompt,
  onUpdateLabel,
  onRemoveNode,
  onFocusNode,
  onResizeMouseDown,
  scrollToSection,
}: NodeDetailPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!isEditingDescription || !textareaRef.current) return;
    const el = textareaRef.current;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [isEditingDescription]);

  const def = getNodeDef(node.kind);
  if (!def) return null;

  const Icon = def.icon;
  const identifier = getNodeIdentifier(node, nodes);

  const descriptionValue =
    def.kind === "trigger"
      ? "Please select an integration for your trigger."
      : def.kind === "action"
        ? (parseActionConfig(node.inputValue)?.toolDescription ??
          "Please select an action for your integration.")
        : def.description;

  return (
    <div className="relative w-full h-full">
      {/* Drag-to-resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        className="group/resizer absolute left-0 top-0 bottom-0 w-4 -translate-x-full z-50 cursor-col-resize select-none"
      >
        <div className="absolute top-2 bottom-2 right-0 w-px opacity-0 group-hover/resizer:opacity-100 transition-opacity duration-200 bg-gradient-to-b from-transparent via-black to-transparent" />
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background border border-transparent shadow-md flex items-center justify-center text-muted-foreground group-hover/resizer:text-foreground group-hover/resizer:border-black group-hover/resizer:scale-105 transition-all duration-150">
          <ChevronsLeftRight className="h-4 w-4" />
        </div>
      </div>

      {/* Panel shell */}
      <div className="w-full h-full bg-background rounded-xl border shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
          <div className="h-8 w-8 rounded-md bg-muted/50 border flex items-center justify-center shrink-0">
            {def.kind === "ai-agent" || def.kind === "prune-ai" || def.kind === "openai-app" ? (
              renderIntegrationIcon(
                getModelProvider(node.model ?? (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6")),
                14,
              )
            ) : def.integrationId ? (
              renderIntegrationIcon(def.integrationId, 14)
            ) : (
              <Icon className={cn("h-4 w-4", def.iconClass)} />
            )}
          </div>

          <div className="flex-1 min-w-0 -ml-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <InlineEditableTextInput
                value={node.label}
                onCommit={(v) => onUpdateLabel(node.id, v)}
              />
              <span className="text-[12px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border text-muted-foreground shrink-0 ml-1">
                {identifier}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Bookmark className="h-3.5 w-3.5" />
            </button>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-background border rounded-xl shadow-lg font-normal overflow-hidden z-50 py-1 px-1">
                  {[
                    { icon: Copy, label: "Copy", onClick: () => setMenuOpen(false) },
                    { icon: SkipForward, label: "Skip", onClick: () => setMenuOpen(false) },
                    { icon: Crosshair, label: "Focus", onClick: () => { setMenuOpen(false); onFocusNode(node.id); } },
                  ].map(({ icon: MenuIcon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[14px] text-gray-800 rounded-md hover:bg-muted transition-colors"
                    >
                      <MenuIcon className="h-4 w-4 text-gray-800 shrink-0" />
                      {label}
                    </button>
                  ))}
                  <div className="mx-2 my-1 h-px bg-border" />
                  <button
                    onClick={() => { setMenuOpen(false); onRemoveNode(node.id); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-red-500 rounded-md font-normal hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Delete
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-prune-lightGray">
          <div className="shrink-0 mx-3 my-2 px-3 py-2 bg-prune-lightGray border-2 border-transparent rounded-md transition-all duration-150 hover:border-gray-300 hover:bg-gray-200/70">
            {isEditingDescription ? (
              <Textarea
                ref={textareaRef}
                defaultValue={descriptionValue}
                onBlur={() => setIsEditingDescription(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setIsEditingDescription(false);
                  }
                }}
                className="!min-h-0 h-[24px] border-0 bg-transparent p-0 text-[14px] font-medium leading-relaxed shadow-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="cursor-text text-[14px] font-medium border-transparent rounded-md leading-relaxed text-muted-foreground whitespace-pre-wrap min-h-[24px] transition-colors"
              >
                {descriptionValue}
              </div>
            )}
          </div>
        </div>

        {/* Per-node-kind content */}
        {def.kind === "trigger" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <TriggerProviderPicker />
          </div>
        ) : def.kind === "ai-agent" || def.kind === "prune-ai" || def.kind === "openai-app" ? (
          <div className="flex-1 overflow-y-auto">
            <AIAgentPanelSections
              node={node}
              def={def}
              identifier={identifier}
              nodes={nodes}
              onUpdateValue={onUpdateValue}
              onUpdateSystemPrompt={onUpdateSystemPrompt}
              scrollToSection={scrollToSection}
            />
          </div>
        ) : def.kind === "action" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <ActionCategoryPicker
              node={node}
              onUpdateValue={onUpdateValue}
              onUpdateLabel={onUpdateLabel}
            />
          </div>
        ) : def.kind === "audio-output" ? (
          <div className="flex-1 overflow-y-auto py-[3px]">
            <AudioOutputPanelSections />
          </div>
        ) : def.kind === "template-out" ? (
          <>
            <div className="flex-1 overflow-y-auto py-[3px]">
              <TemplatePanelSections />
            </div>
            <div className="px-4 py-3 border-t shrink-0">
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border rounded-md text-sm text-foreground hover:bg-muted/30 transition-colors">
                <Upload className="h-4 w-4" />
                Upload Template
              </button>
            </div>
          </>
        ) : def.kind === "output" ? (
          <div className="flex-1 overflow-y-auto py-[3px]">
            <OutputPanelSections />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-[3px]">
            {def.kind === "url" ? (
              <UrlPanelSections node={node} onUpdateValue={onUpdateValue} />
            ) : def.kind === "text-input" ? (
              <TextInputPanelSections node={node} onUpdateValue={onUpdateValue} />
            ) : def.kind === "knowledge-base" ? (
              <KnowledgeBasePanelSections />
            ) : def.kind === "files" ? (
              <FilesPanelSections />
            ) : (
              <GenericPanelSections node={node} def={def} onUpdateValue={onUpdateValue} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
