"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Share2,
  Play,
  Rocket,
  Loader2,
  Check,
  AlertCircle,
  Cloud,
  CloudOff,
  FlaskConical,
  ChevronDown,
  FolderOpen,
  Pencil,
  SettingsIcon,
  SeparatorVertical,
  SaveIcon,
  EllipsisVerticalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunPhase } from "@/lib/editor-nodes";
import { DeployModal } from "@/components/builder/deploy-modal";

export type EditorTab =
  | "workflow"
  | "export"
  | "analytics"
  | "manager"
  | "evaluator";

const TAB_LABELS: Record<EditorTab, string> = {
  workflow: "Workflow",
  export: "Export",
  analytics: "Analytics",
  manager: "Manager",
  evaluator: "Evaluator",
};

interface ExampleDef {
  label: string;
  onLoad: () => void;
}

interface EditorTopbarProps {
  templateName: string | null;
  templateSlug: string | null;
  workflowId?: string | null;
  saveState?: "idle" | "saving" | "saved" | "error";
  onRun?: () => void;
  runPhase?: RunPhase;
  activeTab?: EditorTab;
  onTabChange?: (tab: EditorTab) => void;
  onUpdateWorkflowName?: (name: string) => void;
  examples?: ExampleDef[];
  workspaceName?: string;
  sidebarPinned?: boolean;
}

export function EditorTopbar({
  templateName,
  templateSlug,
  workflowId,
  saveState = "idle",
  onRun,
  runPhase = "idle",
  activeTab = "workflow",
  onTabChange,
  onUpdateWorkflowName,
  examples,
  workspaceName = "Prune AI",
  sidebarPinned = false,
}: EditorTopbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(
    templateName ?? "Untitled Workflow",
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameSizerRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(140);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const examplesRef = useRef<HTMLDivElement>(null);
  const [deployOpen, setDeployOpen] = useState(false);

  useEffect(() => {
    if (!examplesOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        examplesRef.current &&
        !examplesRef.current.contains(e.target as Node)
      ) {
        setExamplesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [examplesOpen]);

  useEffect(() => {
    setLocalName(templateName ?? "Untitled Workflow");
  }, [templateName]);

  useEffect(() => {
    if (nameSizerRef.current) {
      setInputWidth(Math.min(nameSizerRef.current.offsetWidth + 12, 220));
    }
  }, [localName]);

  function startEditing() {
    setIsEditingName(true);
  }

  function commitName() {
    setIsEditingName(false);
    const name = localName.trim() || "Untitled Workflow";
    setLocalName(name);
    if (name !== templateName) onUpdateWorkflowName?.(name);
  }

  function cancelEditing() {
    setLocalName(templateName ?? "Untitled Workflow");
    setIsEditingName(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backHref: any = templateSlug
    ? `/templates/${templateSlug}`
    : "/dashboard";

  return (
    <header
      className={cn(
        "h-12 border-b bg-background relative flex items-center shrink-0 z-20 min-w-0 pr-3 md:pr-4 font-sans",
        sidebarPinned ? "pl-3 md:pl-2" : "pl-[56px]",
      )}
    >
      {/* Left: Workspace breadcrumb */}
      <div className="flex items-center gap-1 shrink-0 min-w-0 ml-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />

        <Link
          href={backHref}
          className="text-[13px] ml-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 truncate max-w-[100px] lg:max-w-[140px]"
        >
          {workspaceName}
        </Link>

        <span className="text-[13px] text-muted-foreground/40 mx-1 shrink-0 select-none">
          /
        </span>

        {/* Inline-editable project name */}
        <div className="relative flex items-center min-w-0">
          {/* Hidden sizer span — measures text width for the input */}
          <span
            ref={nameSizerRef}
            aria-hidden
            className="absolute invisible whitespace-pre text-[13px] font-[450] px-1 pointer-events-none"
          >
            {localName}
          </span>

          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitName();
                }
                if (e.key === "Escape") {
                  cancelEditing();
                }
              }}
              style={{ width: inputWidth }}
              className="text-[13px] font-[450] text-foreground bg-prune-lightGray rounded-md px-1.5 py-0.5 outline-none border-none min-w-[60px]"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <button
              onClick={startEditing}
              className="group flex items-center gap-1 text-[13px] font-[450] text-foreground hover:bg-muted/60 rounded-md px-1.5 py-0.5 transition-colors cursor-pointer max-w-[200px]"
              title="Click to rename"
            >
              <span className="truncate">{localName}</span>
              <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Save state — sits right after project name */}
        <div className="ml-2 flex items-center shrink-0">
          {saveState === "saving" && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden md:inline">Saving…</span>
            </span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Cloud className="h-3 w-3" />
              <span className="hidden md:inline">Saved</span>
            </span>
          )}
          {saveState === "error" && (
            <span className="flex items-center gap-1 text-[11px] text-destructive">
              <CloudOff className="h-3 w-3" />
              <span className="hidden md:inline">Save failed</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Tabs — absolutely centered in the header */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-prune-lightGray gap-0.5 p-1 rounded-lg pointer-events-auto">
        {(
          [
            "workflow",
            "export",
            "analytics",
            "manager",
            "evaluator",
          ] as EditorTab[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange?.(tab)}
            className={cn(
              "px-2.5 py-1 text-[13px] rounded-md font-medium transition-colors whitespace-nowrap",
              activeTab === tab
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
        {examples && examples.length > 0 && (
          <div className="relative" ref={examplesRef}>
            <button
              onClick={() =>
                examples.length === 1
                  ? examples[0].onLoad()
                  : setExamplesOpen((o) => !o)
              }
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs text-muted-foreground border rounded-md hover:bg-muted hover:text-foreground transition-colors"
              title="Load example workflow"
            >
              <FlaskConical className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Example</span>
              {examples.length > 1 && (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>
            {examplesOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-prune-borderGray rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                {examples.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => {
                      ex.onLoad();
                      setExamplesOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-[450] text-left hover:bg-prune-lightGray transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <SeparatorVertical className="h-5 w-px bg-prune-borderGray" />

        <button className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-foreground rounded-md bg-prune-lightGray hover:bg-muted hover:text-foreground transition-colors">
          <SaveIcon className="h-4 w-4 shrink-0" />
        </button>

        <SeparatorVertical className="h-5 w-px bg-prune-borderGray" />

        <button className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-foreground rounded-md bg-prune-lightGray hover:bg-muted hover:text-foreground transition-colors">
          <SettingsIcon className="h-4 w-4 shrink-0" />
        </button>

        <SeparatorVertical className="h-5 w-px bg-prune-borderGray" />

        <button
          onClick={onRun}
          disabled={runPhase === "running"}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-[14px] font-[450] border rounded-md transition-all duration-200 disabled:cursor-not-allowed",
            runPhase === "running" && "opacity-60",
            runPhase === "done" &&
              "border-green-300 text-green-600 bg-green-50 hover:bg-green-100",
            runPhase === "error" &&
              "border-red-300 text-red-600 hover:bg-red-50",
            runPhase === "idle" && "hover:bg-muted",
          )}
        >
          {runPhase === "running" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : runPhase === "done" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : runPhase === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <Play className="h-4 w-4 shrink-0" fill="currentColor" />
          )}
          <span className="hidden sm:inline">
            {runPhase === "running"
              ? "Running…"
              : runPhase === "done"
                ? "Done"
                : runPhase === "error"
                  ? "Failed"
                  : "Run"}
          </span>
        </button>

        <button
          onClick={() => setDeployOpen(true)}
          className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-[14px] font-[450] bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Rocket className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Deploy</span>
        </button>
      </div>

      <button className="inline-flex ml-1 items-center gap-1.5 px-1 sm:px-2.5 py-2 text-foreground rounded-lg hover:bg-prune-spaceGray hover:text-foreground transition-colors">
        <EllipsisVerticalIcon className="h-4 w-4 shrink-0" />
      </button>

      {workflowId && (
        <DeployModal
          open={deployOpen}
          onOpenChange={setDeployOpen}
          workflowId={workflowId}
          workflowName={localName}
        />
      )}
    </header>
  );
}
