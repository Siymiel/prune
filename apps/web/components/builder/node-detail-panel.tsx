"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Mic,
  Settings2,
  ChevronsUpDown,
  PencilLineIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Link2,
  AlignLeft,
  Database,
  LayoutTemplate,
  Plus,
  Upload,
  FileText,
  ChevronsLeftRight,
  MoreVertical,
  Copy,
  SkipForward,
  Crosshair,
  Trash2,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodeDef,
  getModelProvider,
  getNodeIdentifier,
  type CanvasNode,
  type NodeDef,
} from "@/lib/editor-nodes";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import { Textarea } from "@/components/ui/textarea";
import { Section, FieldLabel, SubLabel, SettingRow } from "./panel-ui";
import { InlineEditableTextInput } from "./inline-editable-text-input";
import { AIAgentPanelSections } from "./ai-agent-panel";
import { ActionCategoryPicker, parseActionConfig } from "./action-panel";

/* ── Shared style constants ─────────────────────────────────────────────────── */

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";
const textareaClass = `${inputClass} resize-none font-medium text-[16px]`;

/* ── Trigger provider picker ────────────────────────────────────────────────── */

type TriggerProvider =
  | {
      id: string;
      name: string;
      description: string;
      integrationId: "google-drive" | "gmail";
    }
  | {
      id: string;
      name: string;
      description: string;
      iconBg: string;
      letter: string;
    };

const TRIGGER_PROVIDERS: TriggerProvider[] = [
  {
    id: "airtable",
    name: "Airtable",
    description:
      "Query an Airtable base with natural language or semantic search",
    iconBg: "bg-amber-400",
    letter: "A",
  },
  {
    id: "asana",
    name: "Asana",
    description:
      "Asana is a work management platform for organizing tasks and projects",
    iconBg: "bg-red-400",
    letter: "A",
  },
  {
    id: "docusign",
    name: "DocuSign",
    description:
      "Connect to DocuSign to manage envelopes, documents, and signatures",
    iconBg: "bg-indigo-700",
    letter: "D",
  },
  {
    id: "framer",
    name: "Framer",
    description:
      "Framer is a no-code website builder. Connect a Framer project",
    iconBg: "bg-blue-600",
    letter: "F",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Google Drive is a file storage and synchronization service",
    integrationId: "google-drive",
  },
  {
    id: "github",
    name: "Github",
    description:
      "GitHub is a development platform for version control and collaboration",
    iconBg: "bg-gray-900",
    letter: "G",
  },
  {
    id: "gmail",
    name: "Gmail",
    description:
      "Gmail is Google's email service for sending, receiving, and managing email",
    integrationId: "gmail",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description:
      "Google Sheets is a spreadsheet program included as part of Google Drive",
    iconBg: "bg-green-500",
    letter: "S",
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    description:
      "Microsoft Teams integration providing OAuth2 authentication and messaging",
    iconBg: "bg-purple-600",
    letter: "T",
  },
];

function TriggerProviderPicker() {
  const [search, setSearch] = useState("");
  const filtered = TRIGGER_PROVIDERS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
          Providers in all categories
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
            placeholder="Search for a provider in all categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y">
        {filtered.map((provider) => (
          <button
            key={provider.id}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
          >
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold border",
                "integrationId" in provider ? "bg-background" : provider.iconBg,
              )}
            >
              {"integrationId" in provider
                ? renderIntegrationIcon(provider.integrationId, 18)
                : provider.letter}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">
                {provider.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {provider.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Audio-output panel ─────────────────────────────────────────────────────── */

function AudioOutputPanelSections() {
  return (
    <>
      <Section
        title="Test Output"
        icon={<Mic className="h-3.5 w-3.5" />}
        defaultOpen
      >
        <div className="px-4 py-3 rounded-2xl border text-xs text-muted-foreground bg-muted/10 text-center">
          No audio output, run the flow to generate audio
        </div>
      </Section>
      <Section
        title="Configuration"
        icon={<Settings2 className="h-3.5 w-3.5" />}
      >
        <div className="space-y-4">
          <SettingRow label="Model">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
              <span>eleven_multilingual_v2</span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </SettingRow>
          <SettingRow label="Voice">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
              <span>Sarah</span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </SettingRow>
          <div>
            <SubLabel>API Key</SubLabel>
            <input
              type="text"
              className="w-full px-3 py-2 text-xs bg-muted/20 border rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray"
              placeholder=""
            />
          </div>
        </div>
      </Section>
    </>
  );
}

/* ── Template-out panel ─────────────────────────────────────────────────────── */

function TemplatePanelSections() {
  return (
    <Section
      title="Edit Template"
      icon={<PencilLineIcon className="h-3.5 w-3.5" />}
      defaultOpen
    >
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        Add nodes to the template from the options on the left. Remove the
        template to use default output.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/10 flex-wrap">
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors text-xs font-bold">
            B
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors text-xs italic font-serif">
            I
          </button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded bg-gray-800 text-white text-[11px] font-semibold leading-none">
            H<sub className="text-[8px]">1</sub>
          </button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground text-[11px] font-semibold leading-none">
            H<sub className="text-[8px]">2</sub>
          </button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground text-[11px] font-semibold leading-none">
            H<sub className="text-[8px]">3</sub>
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
            <List className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
            <Quote className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
            <Code className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
            <Image className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-3 min-h-[280px] text-sm leading-relaxed bg-background">
          <h1 className="text-base font-bold mb-2">Template Node</h1>
          <h2 className="text-sm font-semibold mb-1.5">How this works</h2>
          <p className="text-xs text-foreground/80 mb-3">
            This node allows you to create a template that can be used to format
            the output of other nodes.
          </p>
          <h2 className="text-sm font-semibold mb-1.5">How to use</h2>
          <ul className="list-disc list-inside text-xs text-foreground/80 space-y-1">
            <li>
              Format to heading, bullet points, and more using the options
              above.
            </li>
            <li>
              Use the values of other nodes by selecting them from the
              expressions side panel.
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ── Generic per-node-kind sections ─────────────────────────────────────────── */

function PanelSections({
  node,
  def,
  onUpdateValue,
}: {
  node: CanvasNode;
  def: NodeDef;
  onUpdateValue: (id: string, value: string) => void;
}) {
  if (def.kind === "url") {
    return (
      <>
        <Section
          title="Test URL"
          icon={<Link2 className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FieldLabel>Website URL</FieldLabel>
          <input
            type="url"
            className={inputClass}
            placeholder="https://example.com"
            value={node.inputValue ?? ""}
            onChange={(e) => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">
            No options configured.
          </p>
        </Section>
        <Section
          title="Chunking Settings"
          icon={<Settings2 className="h-3.5 w-3.5" />}
        >
          <p className="text-xs text-muted-foreground">
            Using default chunking settings.
          </p>
        </Section>
      </>
    );
  }

  if (def.kind === "text-input") {
    return (
      <>
        <Section
          title="Value"
          icon={<AlignLeft className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FieldLabel>Default value</FieldLabel>
          <textarea
            className={textareaClass}
            rows={4}
            placeholder="Enter value or leave blank for user input…"
            value={node.inputValue ?? ""}
            onChange={(e) => onUpdateValue(node.id, e.target.value)}
          />
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">
            No options configured.
          </p>
        </Section>
      </>
    );
  }

  if (def.kind === "knowledge-base") {
    return (
      <>
        <Section
          title="Source"
          icon={<Database className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FieldLabel>Knowledge base</FieldLabel>
          <div className="w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-muted-foreground/50">
            Select a knowledge base…
          </div>
        </Section>
        <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
          <p className="text-xs text-muted-foreground">
            No options configured.
          </p>
        </Section>
      </>
    );
  }

  return (
    <>
      <Section
        title="Configuration"
        icon={<Settings2 className="h-3.5 w-3.5" />}
        defaultOpen
      >
        {def.badge === "App" ? (
          <div className="px-3 py-2 bg-muted/30 border rounded-md text-xs text-muted-foreground leading-relaxed">
            {def.description}
          </div>
        ) : def.badge === "Output" ? (
          <>
            <FieldLabel>Output value</FieldLabel>
            <div className="px-3 py-1.5 text-xs bg-muted/30 border rounded-md text-muted-foreground/50 font-mono">
              {"{{result}}"}
            </div>
          </>
        ) : (
          <>
            <FieldLabel>Value</FieldLabel>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder={def.description}
              value={node.inputValue ?? ""}
              onChange={(e) => onUpdateValue(node.id, e.target.value)}
            />
          </>
        )}
      </Section>
      <Section title="Options" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground">No options configured.</p>
      </Section>
    </>
  );
}

/* ── Main panel ─────────────────────────────────────────────────────────────── */

interface NodeDetailPanelProps {
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
  const [testInput, setTestInput] = useState("");
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
            {def.kind === "ai-agent" ||
            def.kind === "prune-ai" ||
            def.kind === "openai-app" ? (
              renderIntegrationIcon(
                getModelProvider(
                  node.model ??
                    (def.kind === "openai-app"
                      ? "gpt-4o"
                      : "claude-sonnet-4-6"),
                ),
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
                    {
                      icon: Copy,
                      label: "Copy",
                      onClick: () => setMenuOpen(false),
                    },
                    {
                      icon: SkipForward,
                      label: "Skip",
                      onClick: () => setMenuOpen(false),
                    },
                    {
                      icon: Crosshair,
                      label: "Focus",
                      onClick: () => {
                        setMenuOpen(false);
                        onFocusNode(node.id);
                      },
                    },
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
                    onClick={() => {
                      setMenuOpen(false);
                      onRemoveNode(node.id);
                      onClose();
                    }}
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
        ) : def.kind === "ai-agent" ||
          def.kind === "prune-ai" ||
          def.kind === "openai-app" ? (
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
            <Section
              title="Templated Output"
              icon={<LayoutTemplate className="h-3.5 w-3.5" />}
              defaultOpen
            >
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Add a template to format the output. By default, the output
                combines the results of all connected nodes.
              </p>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  Add Template
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Template
                </button>
              </div>
            </Section>
            <Section
              title="Output Content"
              icon={<FileText className="h-3.5 w-3.5" />}
              defaultOpen
            >
              <p className="text-xs text-muted-foreground leading-relaxed">
                No output available. Run the workflow to see the output here.
              </p>
            </Section>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-[3px]">
            <Section
              title="Input text"
              icon={<PencilLineIcon className="h-3.5 w-3.5" />}
              defaultOpen
            >
              <textarea
                className={textareaClass}
                rows={5}
                placeholder="Type test input here…"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
              />
            </Section>
            <PanelSections
              node={node}
              def={def}
              onUpdateValue={onUpdateValue}
            />
          </div>
        )}
      </div>
    </div>
  );
}
