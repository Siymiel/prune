"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Play,
  Link2,
  Settings2,
  Cpu,
  Database,
  AlignLeft,
  Wrench,
  Plus,
  ChevronsLeftRight,
  PencilLineIcon,
  MoreVertical,
  Copy,
  SkipForward,
  Crosshair,
  Trash2,
  Search,
  Wand2,
  Mic,
  Bot,
  GitBranch,
  RefreshCw,
  Rocket,
  Bookmark,
  Upload,
  FileText,
  LayoutTemplate,
  LayoutGrid,
  Blocks,
  Box,
  Brain,
  ScanLine,
  Check,
  ChevronsUpDown,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  AlertTriangle,
  Info,
  FileInputIcon,
  ListTreeIcon,
  BracesIcon,
  AsteriskIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodeDef,
  getModelProvider,
  type CanvasNode,
  type NodeDef,
} from "@/lib/editor-nodes";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import { Textarea } from "@/components/ui/textarea";
import { ButtonGroup } from "@/components/ui/button-group";
import Editor from '@monaco-editor/react'
import {
  TOOL_SCHEMAS,
  TOOL_OUTPUTS,
  type InputFieldDef,
  type ToolInputSchema,
} from "@/lib/tool-schemas";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const KIND_PREFIX: Record<string, string> = {
  "text-input": "in",
  url: "url",
  files: "files",
  trigger: "trigger",
  "audio-input": "audio",
  output: "out",
  action: "action",
  "audio-output": "text2audio",
  "template-out": "template",
  "ai-agent": "llm",
  "knowledge-base": "kb",
  "prune-ai": "prune",
  "whatsapp-app": "wa",
  mpesa: "mpesa",
  "openai-app": "openai",
  "slack-app": "slack",
  "gmail-app": "gmail",
  "sheets-app": "sheets",
  "calendar-app": "cal",
  "notion-app": "notion",
  "airtable-app": "airtable",
  "if-else": "if",
  code: "code",
  loop: "loop",
  "ai-routing": "router",
  "sticky-note": "note",
  "default-message": "msg",
  delay: "delay",
  "shared-memory": "mem",
  "vector-store": "vs",
  "text-to-sql": "sql",
  "search-tables": "tbl",
  "search-data": "search",
};

function getNodeIdentifier(node: CanvasNode, nodes: CanvasNode[]): string {
  const prefix = KIND_PREFIX[node.kind] ?? node.kind.split("-")[0];
  const sameKind = nodes.filter((n) => n.kind === node.kind);
  const index = Math.max(
    0,
    sameKind.findIndex((n) => n.id === node.id),
  );
  return `${prefix}-${index}`;
}

function Section({
  title,
  icon,
  defaultOpen = false,
  children,
  extra,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
  <button
    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors"
    onClick={() => setOpen((o) => !o)}
  >
    {icon && (
      <span className="text-prune-commonGray shrink-0">
        {icon}
      </span>
    )}

    <span className="text-left text-[15px] font-medium text-prune-commonGray">
      {title}
    </span>

    {extra}

    {open ? (
      <ChevronUp className="ml-auto h-4 w-4 text-prune-commonGray shrink-0" />
    ) : (
      <ChevronDown className="ml-auto h-4 w-4 text-prune-commonGray shrink-0" />
    )}
  </button>

  {open && <div className="px-4 pb-4">{children}</div>}
</div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

function SubLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-[15px] font-medium text-gray-700 underline decoration-dashed underline-offset-4 mb-2", className)}>
      {children}
    </div>
  );
}

function PromptEditorToolbar({ showLeft }: { showLeft?: boolean }) {
  return (
    <div className="flex items-center px-2 py-1.5 border-t bg-muted/20">
      {showLeft && (
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" />
          <Wrench className="h-3.5 w-3.5" />
          <span>Tools</span>
        </button>
      )}
      <div className="ml-auto flex items-center gap-0.5">
        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
          <Wand2 className="h-3.5 w-3.5" />
        </button>
        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors">
          <Mic className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        `
        group
        relative
        inline-flex
        h-5
        w-10
        shrink-0
        items-center
        rounded-full
        border
        transition-all
        duration-200
        ease-out

        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring/30
        focus-visible:ring-offset-1
      `,
        checked
          ? `
            border-transparent
            bg-gray-800
            shadow-[0_0_0_1px_rgba(17,24,39,0.04),0_2px_8px_rgba(17,24,39,0.18)]
          `
          : `
            border-border
            bg-muted/70
            hover:bg-muted
          `,
      )}
    >
      {/* Track glow */}
      <span
        className={cn(
          `
          absolute
          inset-0
          rounded-full
          opacity-0
          transition-opacity
          duration-200
        `,
          checked &&
            `
            opacity-100
            shadow-[0_0_18px_rgba(17,24,39,0.22)]
          `,
        )}
      />

      {/* Thumb */}
      <span
        className={cn(
          `
          absolute
          left-0.5
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          bg-white
          shadow-[0_1px_2px_rgba(0,0,0,0.08),0_1px_6px_rgba(0,0,0,0.06)]
          transition-all
          duration-200
          ease-out
          will-change-transform
        `,
          checked
            ? 'translate-x-4'
            : 'translate-x-0',
        )}
      >
        {/* Inner indicator */}
        <span
          className={cn(
            `
            h-1.5
            w-1.5
            rounded-full
            transition-colors
            duration-200
          `,
            checked
              ? 'bg-gray-800'
              : 'bg-gray-300',
          )}
        />
      </span>
    </button>
  );
}

function Slider({ value, min, max, step = 1, onChange }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ background: `linear-gradient(to right, #111827 ${pct}%, #e5e7eb ${pct}%)` }}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
    />
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function AIAgentPanelSections({
  node,
  def,
  identifier,
  onUpdateValue,
}: {
  node: CanvasNode;
  def: NodeDef;
  identifier: string;
  onUpdateValue: (id: string, value: string) => void;
}) {
  const [promptMode, setPromptMode] = useState<'edit' | 'formatted'>('edit');
  // Main Settings state
  const [memoryEnabled,     setMemoryEnabled]     = useState(true);
  const [windowSize,        setWindowSize]         = useState(10);
  const [citationsEnabled,  setCitationsEnabled]  = useState(true);
  const [useReferences,     setUseReferences]     = useState(false);
  const [webSearch,         setWebSearch]         = useState(false);
  const [reasoning,         setReasoning]         = useState(false);
  // Advanced Settings state
  const [streamData,        setStreamData]        = useState(true);
  const [safeContext,       setSafeContext]       = useState(false);
  const [fileAccess,        setFileAccess]        = useState(false);
  const [dateAndTime,       setDateAndTime]       = useState(false);
  const [guardrails,        setGuardrails]        = useState(false);
  const [piiCompliance,     setPiiCompliance]     = useState(false);
  const [temperature,       setTemperature]       = useState(0.2);
  const [maxOutputLength,   setMaxOutputLength]   = useState(128000);
  const [retryOnFailure,    setRetryOnFailure]    = useState(false);
  const [llmFallbackMode,   setLlmFallbackMode]   = useState(false);

  const model = node.model ?? (def.kind === 'openai-app' ? 'gpt-4o' : 'claude-sonnet-4-6');
  const provider = getModelProvider(model);
  const providerLabel = provider === 'openai' ? 'OpenAI' : 'Anthropic';

  return (
    <>
      {/* AI Provider */}
      <div className="px-4 py-3 border-b">
        <SubLabel>AI Provider</SubLabel>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
          <span className="flex items-center justify-center shrink-0">{renderIntegrationIcon(provider, 16)}</span>
          <span className="flex-1 text-left font-medium">{providerLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Model */}
      <div className="px-4 py-3 border-b">
        <SubLabel>Model</SubLabel>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
          <span className="flex items-center justify-center shrink-0">{renderIntegrationIcon(provider, 16)}</span>
          <span className="flex-1 text-left font-medium">{model}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Try agent templates */}
      <button className="w-full flex items-center gap-2.5 px-4 py-3 border-b hover:bg-muted/30 transition-colors text-left">
        <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm text-foreground">Try our agent templates</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-semibold shrink-0">New</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {/* Prompting */}
      <Section title="Prompting" icon={<AlignLeft className="h-3.5 w-3.5" />} defaultOpen>
        <div className="space-y-4">
          <div className="mt-4">
            <SubLabel>Instructions</SubLabel>
            <div className="border rounded-lg overflow-hidden">
              <Textarea
              placeholder="You are a helpful assistant that…"
              value={node.inputValue ?? ""}
              onChange={(e) => onUpdateValue(node.id, e.target.value)}
              />
              <PromptEditorToolbar showLeft />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <SubLabel>Prompt</SubLabel>
              <ButtonGroup
                className="ml-auto"
                options={[{ value: 'edit', label: 'Edit' }, { value: 'formatted', label: 'Formatted' }]}
                value={promptMode}
                onChange={setPromptMode}
              />
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2.5 bg-background min-h-[80px] text-xs leading-relaxed relative">
                <p className="text-foreground/80">- Please provide a clear and concise answer to the user&apos;s question.</p>
                <p className="text-foreground/80 mt-1">- If the answer is not available, search the internal knowledge base for relevant information.</p>
                <p className="text-foreground/80 mt-1">- If necessary, supplement your response with information from the web search results.</p>
                <p className="text-muted-foreground/60 mt-2 font-mono text-[11px]">{"<UserMessage>"}</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/60 border rounded text-xs text-foreground">
                  <PencilLineIcon className="h-3 w-3" />
                  User Question
                </span>
                <p className="text-muted-foreground/60 font-mono text-[11px]">{"</UserMessage>"}</p>
                <button className="absolute bottom-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-muted/50 border hover:bg-muted transition-colors">
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <PromptEditorToolbar />
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <div className="mt-4">
              <SubLabel>Image URLs</SubLabel>
              <Textarea placeholder="Start typing to add values..." />
            </div>
          </div>
        </div>
      </Section>

      {/* Knowledge Sources */}
      <Section title="Knowledge Sources" icon={<Database className="h-3.5 w-3.5" />}>
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs text-foreground hover:bg-muted/30 transition-colors mb-3">
          <Plus className="h-3.5 w-3.5" />
          Add Knowledge Sources
        </button>
        <div className="space-y-0.5">
          <button className="w-full flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-muted/30 text-left transition-colors">
            <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground">Add Knowledge Base</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Index documents for fast retrieval and reuse across workflows.</div>
            </div>
          </button>
          <button className="w-full flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-muted/30 text-left transition-colors">
            <Search className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground">Search Connected Apps</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Search apps like Gmail, Sheets, and Slack without importing data.</div>
            </div>
          </button>
        </div>
      </Section>

      {/* Tools */}
      <Section title="Tools" icon={<Wrench className="h-3.5 w-3.5" />}>
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs text-foreground hover:bg-muted/30 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Add tools
        </button>
      </Section>

      {/* Subflow Tools */}
      <Section title="Subflow Tools" icon={<GitBranch className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Add subflow tools that the LLM can call. Connect each tool handle to a subflow that will execute when the LLM calls that tool.
        </p>
        <div className="text-[10px] text-muted-foreground mb-1.5">Available variable in subflows:</div>
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border rounded-md text-xs font-mono text-foreground mb-3">
          <Cpu className="h-3 w-3 text-muted-foreground shrink-0" />
          {identifier}.subflow_tool_input
        </div>
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs text-foreground hover:bg-muted/30 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Add Subflow Tool
        </button>
      </Section>

      {/* Main Settings */}
      <Section title="Main Settings" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="space-y-4">
          <SettingRow label="Memory">
            <Toggle checked={memoryEnabled} onChange={setMemoryEnabled} />
          </SettingRow>
          {memoryEnabled && (
            <button className="w-full flex items-center gap-2.5 px-3 py-2 border rounded-md text-xs hover:bg-muted/30 transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-left">Sliding Window with Input</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2">Window Size</span>
              <span className="text-xs font-medium tabular-nums">{windowSize}</span>
            </div>
            <Slider value={windowSize} min={1} max={20} onChange={setWindowSize} />
          </div>
          <div>
            <SubLabel className="mb-1.5">Source of User Messages</SubLabel>
            <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md text-xs hover:bg-muted/30 transition-colors">
              <PencilLineIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-left">User Question</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              When the workflow runs, the LLM conversation history will use this as the source of user messages.
            </p>
            <div className="flex items-center gap-4 mt-2 justify-end">
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">View Memory</button>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
            </div>
          </div>
          <SettingRow label="Citations">
            <Toggle checked={citationsEnabled} onChange={setCitationsEnabled} />
          </SettingRow>
          <SettingRow label="Use References">
            <Toggle checked={useReferences} onChange={setUseReferences} />
          </SettingRow>
          <SettingRow label="Web Search">
            <Toggle checked={webSearch} onChange={setWebSearch} />
          </SettingRow>
          <SettingRow label="Reasoning">
            <Toggle checked={reasoning} onChange={setReasoning} />
          </SettingRow>
          <SettingRow label="Response format">
            <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs hover:bg-muted/30 transition-colors">
              <span>Text</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </SettingRow>
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Use your own credentials</div>
            <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
              <span className="flex-1 text-left">Select a connection</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Your credentials are encrypted and can be removed at any time. You can manage all your connections here.
            </p>
          </div>
        </div>
      </Section>

      {/* Advanced Settings */}
      <Section title="Advanced Settings" icon={<Rocket className="h-3.5 w-3.5" />}>
        <div className="space-y-4">
          <SettingRow label="Stream Data">
            <Toggle checked={streamData} onChange={setStreamData} />
          </SettingRow>
          <SettingRow label="Safe Context Token Window">
            <Toggle checked={safeContext} onChange={setSafeContext} />
          </SettingRow>
          <SettingRow label="File Access">
            <Toggle checked={fileAccess} onChange={setFileAccess} />
          </SettingRow>
          <SettingRow label="Date and Time">
            <Toggle checked={dateAndTime} onChange={setDateAndTime} />
          </SettingRow>
          <SettingRow label="Guardrails">
            <Toggle checked={guardrails} onChange={setGuardrails} />
          </SettingRow>
          <SettingRow label="PII Compliance">
            <Toggle checked={piiCompliance} onChange={setPiiCompliance} />
          </SettingRow>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2">Temperature</span>
              <span className="text-xs font-medium tabular-nums">{temperature.toFixed(1)}</span>
            </div>
            <Slider value={temperature} min={0} max={1} step={0.1} onChange={setTemperature} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2">Max Output Length</span>
              <span className="text-xs font-medium tabular-nums">{maxOutputLength.toLocaleString()}</span>
            </div>
            <Slider value={maxOutputLength} min={0} max={128000} step={1000} onChange={setMaxOutputLength} />
          </div>
          <SettingRow label="Retry on Failure">
            <Toggle checked={retryOnFailure} onChange={setRetryOnFailure} />
          </SettingRow>
          <SettingRow label="LLM Fallback Mode">
            <Toggle checked={llmFallbackMode} onChange={setLlmFallbackMode} />
          </SettingRow>
          <div>
            <SubLabel>On Error</SubLabel>
            <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md text-xs hover:bg-muted/30 transition-colors">
              <span className="flex-1 text-left">Stop workflow</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          </div>
        </div>
      </Section>
    </>
  );
}

const inputClass =
  "w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray";
const textareaClass = `${inputClass} resize-none font-medium text-[16px]`;

type TriggerProvider =
  | { id: string; name: string; description: string; integrationId: 'google-drive' | 'gmail' }
  | { id: string; name: string; description: string; iconBg: string; letter: string };

const TRIGGER_PROVIDERS: TriggerProvider[] = [
  { id: 'airtable',        name: 'Airtable',         description: 'Query an Airtable base with natural language or semantic search',           iconBg: 'bg-amber-400',   letter: 'A' },
  { id: 'asana',           name: 'Asana',             description: 'Asana is a work management platform for organizing tasks and projects',      iconBg: 'bg-red-400',     letter: 'A' },
  { id: 'docusign',        name: 'DocuSign',          description: 'Connect to DocuSign to manage envelopes, documents, and signatures',         iconBg: 'bg-indigo-700',  letter: 'D' },
  { id: 'framer',          name: 'Framer',            description: 'Framer is a no-code website builder. Connect a Framer project',              iconBg: 'bg-blue-600',    letter: 'F' },
  { id: 'google-drive',    name: 'Google Drive',      description: 'Google Drive is a file storage and synchronization service',                 integrationId: 'google-drive' },
  { id: 'github',          name: 'Github',            description: 'GitHub is a development platform for version control and collaboration',     iconBg: 'bg-gray-900',    letter: 'G' },
  { id: 'gmail',           name: 'Gmail',             description: "Gmail is Google's email service for sending, receiving, and managing email", integrationId: 'gmail' },
  { id: 'google-sheets',   name: 'Google Sheets',     description: 'Google Sheets is a spreadsheet program included as part of Google Drive',   iconBg: 'bg-green-500',   letter: 'S' },
  { id: 'microsoft-teams', name: 'Microsoft Teams',   description: 'Microsoft Teams integration providing OAuth2 authentication and messaging',  iconBg: 'bg-purple-600',  letter: 'T' },
];

function TriggerProviderPicker() {
  const [search, setSearch] = useState('');

  const filtered = TRIGGER_PROVIDERS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
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

      {/* Provider list */}
      <div className="flex-1 overflow-y-auto divide-y">
        {filtered.map((provider) => (
          <button
            key={provider.id}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
          >
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold border",
              'integrationId' in provider ? "bg-background" : provider.iconBg,
            )}>
              {'integrationId' in provider
                ? renderIntegrationIcon(provider.integrationId, 18)
                : provider.letter}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{provider.name}</div>
              <div className="text-xs text-muted-foreground truncate">{provider.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Action node drill-down ─────────────────────────────────────────────────

type ActionNavStep =
  | { step: 'categories' }
  | { step: 'providers'; catId: string; catLabel: string; catHeader: string }
  | { step: 'tools'; catId: string; catLabel: string; catHeader: string; providerId: string; providerName: string };

type ProviderIconDef =
  | { type: 'integration'; id: Parameters<typeof renderIntegrationIcon>[0] }
  | { type: 'letter'; letter: string; bg: string; fg?: string };

type ActionProviderDef = {
  id: string;
  name: string;
  description: string;
  icon: ProviderIconDef;
  cats: string[];
};

type ActionToolGroup = { name: string; tools: { id: string; name: string; description: string }[] };

const ACTION_CATEGORIES_DEF = [
  { id: 'all',       header: 'ALL',      label: 'All',        description: 'All tools and providers',                   icon: LayoutGrid },
  { id: 'stackai',   header: 'STACKAI',  label: 'By StackAI', description: 'Native Stack AI tools and integrations',   icon: Blocks, verified: true },
  { id: 'apps',      header: 'APPS',     label: 'Apps',       description: 'Third-party applications and services',    icon: Box },
  { id: 'llm',       header: 'LLM',      label: 'LLM',        description: 'Large language models and AI services',    icon: Brain },
  { id: 'databases', header: 'DATABASE', label: 'Databases',  description: 'Database connections and data management', icon: Database },
  { id: 'scrapers',  header: 'SCRAPER',  label: 'Scrapers',   description: 'Web scraping and data extraction tools',   icon: ScanLine },
];

const ACTION_PROVIDERS: ActionProviderDef[] = [
  // Apps
  { id: 'ahrefs',      name: 'Ahrefs',          description: 'Pull SEO and backlink data from Ahrefs: domain ratings, backlinks, and more.',    icon: { type: 'letter', letter: 'a',     bg: '#F96332', fg: '#fff' }, cats: ['all', 'apps'] },
  { id: 'airops',      name: 'AirOps',          description: 'Full AirOps integration: agents, workflows, definitions, and more.',               icon: { type: 'letter', letter: 'AO',    bg: '#f1f1f1', fg: '#111' }, cats: ['all', 'apps'] },
  { id: 'algolia',     name: 'Algolia',         description: 'Search an Algolia index.',                                                          icon: { type: 'letter', letter: '@',     bg: '#003DFF', fg: '#fff' }, cats: ['all', 'apps'] },
  { id: 'apollo',      name: 'Apollo',          description: 'Apollo.io sales intelligence and engagement platform.',                             icon: { type: 'letter', letter: 'A',     bg: '#111',    fg: '#fff' }, cats: ['all', 'apps'] },
  { id: 'appfolio',    name: 'AppFolio',        description: 'Connect to AppFolio property management software.',                                 icon: { type: 'letter', letter: 'AF',    bg: '#0072CE', fg: '#fff' }, cats: ['all', 'apps'] },
  { id: 'asana',       name: 'Asana',           description: 'Asana is a work management platform for organizing tasks and projects.',            icon: { type: 'letter', letter: 'A',     bg: '#F06A6A', fg: '#fff' }, cats: ['all', 'apps'] },
  { id: 'ashby',       name: 'Ashby',           description: 'Integration with Ashby ATS for managing candidates.',                              icon: { type: 'letter', letter: 'A',     bg: '#E8F0FE', fg: '#2563EB' }, cats: ['all', 'apps'] },
  { id: 'azure-files', name: 'Azure Files',     description: 'Azure Files offers fully managed file shares in the cloud.',                       icon: { type: 'letter', letter: 'Az',    bg: '#0078D4', fg: '#fff' }, cats: ['all', 'apps'] },
  { id: 'box',         name: 'Box',             description: 'Box cloud content management and file storage integration.',                        icon: { type: 'letter', letter: 'box',   bg: '#fff',    fg: '#0061D5' }, cats: ['all', 'apps'] },
  { id: 'gmail',       name: 'Gmail',           description: 'Send and receive emails via Gmail.',                                                icon: { type: 'integration', id: 'gmail' },                            cats: ['all', 'apps'] },
  { id: 'gdrive',      name: 'Google Drive',    description: 'Read and write files in Google Drive.',                                             icon: { type: 'integration', id: 'google-drive' },                    cats: ['all', 'apps'] },
  { id: 'gcal',        name: 'Google Calendar', description: 'Create and manage calendar events.',                                                icon: { type: 'integration', id: 'google-calendar' },                 cats: ['all', 'apps'] },
  { id: 'slack',       name: 'Slack',           description: 'Post messages to Slack channels.',                                                  icon: { type: 'integration', id: 'slack' },                            cats: ['all', 'apps'] },
  // LLMs
  { id: 'anthropic',   name: 'Anthropic',       description: 'Anthropic provides Claude AI models for natural language processing.',              icon: { type: 'integration', id: 'anthropic' },                        cats: ['all', 'llm'] },
  { id: 'cerebras',    name: 'Cerebras',        description: 'Connect to Cerebras AI for high-performance language inference.',                   icon: { type: 'letter', letter: 'C',     bg: '#EA5C1C', fg: '#fff' }, cats: ['all', 'llm'] },
  { id: 'groq',        name: 'Groq',            description: 'Connect to Groq for ultra-fast AI inference and language models.',                  icon: { type: 'letter', letter: 'g',     bg: '#E55B2B', fg: '#fff' }, cats: ['all', 'llm'] },
  { id: 'custom-mcp',  name: 'Custom MCP',      description: 'Model Context Protocol server integration.',                                        icon: { type: 'letter', letter: 'MCP',   bg: '#1c1c1c', fg: '#fff' }, cats: ['all', 'llm', 'stackai'] },
  { id: 'openai',      name: 'OpenAI',          description: 'OpenAI provides advanced AI models including GPT-4 and beyond.',                   icon: { type: 'integration', id: 'openai' },                           cats: ['all', 'llm'] },
  { id: 'xai',         name: 'xAI',             description: 'Connect to xAI API to access Grok models and user data.',                          icon: { type: 'letter', letter: 'xAI',   bg: '#000',    fg: '#fff' }, cats: ['all', 'llm'] },
  // Databases
  { id: 'airtable-db', name: 'Airtable',        description: 'Query an Airtable base with natural language or semantic search.',                 icon: { type: 'letter', letter: 'A',     bg: '#FFBF00', fg: '#fff' }, cats: ['all', 'databases'] },
  { id: 'aws-athena',  name: 'AWS Athena',      description: 'Integration with Amazon Athena for running SQL queries.',                          icon: { type: 'letter', letter: 'Q',     bg: '#8C4FFF', fg: '#fff' }, cats: ['all', 'databases'] },
  { id: 'azure-sql',   name: 'Azure SQL',       description: 'Query, insert, update, and delete data in an Azure SQL database.',                 icon: { type: 'letter', letter: 'Az',    bg: '#0078D4', fg: '#fff' }, cats: ['all', 'databases'] },
  { id: 'bigquery',    name: 'BigQuery',        description: 'Query a Google BigQuery database.',                                                  icon: { type: 'letter', letter: 'BQ',    bg: '#4285F4', fg: '#fff' }, cats: ['all', 'databases'] },
  { id: 'clickhouse',  name: 'ClickHouse',      description: 'Query a ClickHouse database.',                                                       icon: { type: 'letter', letter: 'CH',    bg: '#FFCC00', fg: '#111' }, cats: ['all', 'databases'] },
  { id: 'gdrive-db',   name: 'Google Drive',    description: 'Google Drive is a file storage and synchronization service.',                      icon: { type: 'integration', id: 'google-drive' },                    cats: ['all', 'databases'] },
  { id: 'looker',      name: 'Looker',          description: 'Connect to Looker for data analytics. Query models and more.',                     icon: { type: 'letter', letter: 'L',     bg: '#4285F4', fg: '#fff' }, cats: ['all', 'databases'] },
  { id: 'mongodb',     name: 'MongoDB',         description: 'Query a MongoDB database.',                                                          icon: { type: 'letter', letter: 'M',     bg: '#00684A', fg: '#fff' }, cats: ['all', 'databases'] },
  { id: 'mysql',       name: 'MySQL',           description: 'Query a MySQL database.',                                                             icon: { type: 'letter', letter: 'My',    bg: '#00758F', fg: '#fff' }, cats: ['all', 'databases'] },
  // Scrapers
  { id: 'duckduckgo',  name: 'DuckDuckGo',      description: 'A privacy-focused search engine integration that allows web searching.',           icon: { type: 'letter', letter: 'D',     bg: '#DE5833', fg: '#fff' }, cats: ['all', 'scrapers'] },
  { id: 'exa-ai',      name: 'Exa AI',          description: 'A comprehensive API for internet-scale search.',                                    icon: { type: 'letter', letter: 'E',     bg: '#1E3A5F', fg: '#fff' }, cats: ['all', 'scrapers'] },
  { id: 'firecrawl',   name: 'Firecrawl',       description: 'Firecrawl integration for web crawling and scraping.',                             icon: { type: 'letter', letter: 'F',     bg: '#F97316', fg: '#fff' }, cats: ['all', 'scrapers'] },
  { id: 'hyperbrowser',name: 'HyperBrowser',    description: 'HyperBrowser integration for fast web automation.',                                icon: { type: 'letter', letter: 'H',     bg: '#111',    fg: '#FACC15' }, cats: ['all', 'scrapers'] },
  { id: 'parallel-ai', name: 'Parallel AI',     description: 'Parallel AI is a web intelligence platform for deep research.',                    icon: { type: 'letter', letter: 'P',     bg: '#1c1c1c', fg: '#fff' }, cats: ['all', 'scrapers'] },
  { id: 'serpapi',     name: 'SerpAPI',         description: 'A tool for searching the web.',                                                     icon: { type: 'letter', letter: 'S',     bg: '#3B82F6', fg: '#fff' }, cats: ['all', 'scrapers'] },
  { id: 'tavily',      name: 'Tavily',          description: 'Tavily provides AI-optimized search and content extraction.',                      icon: { type: 'letter', letter: 'T',     bg: '#6366F1', fg: '#fff' }, cats: ['all', 'scrapers'] },
  // StackAI native
  { id: 'stackai-web', name: 'Stack AI Web',    description: 'Native Stack AI web search and retrieval tools.',                                   icon: { type: 'letter', letter: 'S',     bg: '#F59E0B', fg: '#fff' }, cats: ['stackai'] },
];

const PROVIDER_TOOLS: Record<string, ActionToolGroup[]> = {
  ahrefs: [
    { name: 'Batch-analysis Tools', tools: [
      { id: 'ahrefs-batch',         name: 'Batch Analysis',      description: 'Fetch the same SEO metrics for up to 100 targets in one call.' },
    ]},
    { name: 'Bulk Tools', tools: [
      { id: 'ahrefs-bulk',          name: 'Batch Analysis',      description: 'Fetch the same SEO metrics for up to 100 targets in one call.' },
    ]},
    { name: 'Domain-rating Tools', tools: [
      { id: 'ahrefs-domain-batch',  name: 'Batch Analysis',      description: 'Fetch the same SEO metrics for up to 100 targets in one call.' },
      { id: 'ahrefs-domain-rating', name: 'Get Domain Rating',   description: 'Get Ahrefs Domain Rating and Ahrefs Rank for a target.' },
    ]},
    { name: 'Backlinks Tools', tools: [
      { id: 'ahrefs-bl-batch',      name: 'Batch Analysis',      description: 'Fetch the same SEO metrics for up to 100 targets in one call.' },
      { id: 'ahrefs-bl-stats',      name: 'Get Backlinks Stats', description: 'Get backlinks and referring-domain counts for a target.' },
      { id: 'ahrefs-bl-list',       name: 'List Backlinks',      description: 'List the actual backlink rows pointing to a target URL.' },
    ]},
  ],
  anthropic: [
    { name: 'Text Generation', tools: [
      { id: 'claude-messages', name: 'Claude Messages',     description: 'Send messages to Claude and receive a completion.' },
      { id: 'claude-vision',   name: 'Claude with Vision',  description: 'Process images and text together with Claude.' },
    ]},
    { name: 'Embeddings', tools: [
      { id: 'anthropic-embed', name: 'Embed Text',           description: 'Generate embeddings for text using Anthropic models.' },
    ]},
  ],
  openai: [
    { name: 'Chat', tools: [
      { id: 'gpt4-chat',    name: 'GPT-4 Chat',             description: 'Chat with GPT-4 and receive a completion.' },
      { id: 'gpt4-vision',  name: 'GPT-4 Vision',           description: 'Process images and text with GPT-4V.' },
    ]},
    { name: 'Embeddings', tools: [
      { id: 'oai-embed',    name: 'Generate Embeddings',    description: 'Generate text embeddings using OpenAI models.' },
    ]},
    { name: 'Audio', tools: [
      { id: 'whisper',      name: 'Whisper Transcription',  description: 'Transcribe audio to text using Whisper.' },
      { id: 'tts',          name: 'Text to Speech',         description: 'Convert text to speech using OpenAI TTS.' },
    ]},
  ],
  groq: [
    { name: 'Chat', tools: [
      { id: 'groq-chat',    name: 'Groq Chat',              description: 'Ultra-fast chat completions via Groq.' },
    ]},
  ],
  cerebras: [
    { name: 'Inference', tools: [
      { id: 'cerebras-chat', name: 'Cerebras Chat',          description: 'High-performance language model inference.' },
    ]},
  ],
  'custom-mcp': [
    { name: 'MCP Tools', tools: [
      { id: 'mcp-call',     name: 'Call MCP Tool',           description: 'Invoke a tool on a connected MCP server.' },
      { id: 'mcp-list',     name: 'List MCP Tools',          description: 'List available tools from a connected MCP server.' },
    ]},
  ],
  slack: [
    { name: 'Messaging', tools: [
      { id: 'slack-send-message', name: 'Send Message',       description: 'Send a message to a Slack channel with optional file attachments.' },
      { id: 'slack-search',       name: 'Search Messages',    description: 'Search for messages across the Slack workspace.' },
      { id: 'slack-send-wait',    name: 'Send and Wait',      description: 'Send a message and wait for an approval or free-text response.' },
      { id: 'slack-query',        name: 'Query Channel',      description: 'Retrieve messages from a configured Slack channel.' },
    ]},
    { name: 'Files', tools: [
      { id: 'slack-upload-file',  name: 'Upload File',        description: 'Upload files to Slack from URL, base64, or text content.' },
      { id: 'slack-delete-file',  name: 'Delete File',        description: 'Delete a file from the Slack workspace permanently.' },
      { id: 'slack-get-file',     name: 'Get File Info',      description: 'Get detailed information about a specific Slack file.' },
      { id: 'slack-list-files',   name: 'List Files',         description: 'List files in the Slack workspace with filtering options.' },
    ]},
  ],
  gmail: [
    { name: 'Email', tools: [
      { id: 'gmail-send',   name: 'Send Email',              description: 'Send an email from your Gmail account.' },
      { id: 'gmail-list',   name: 'List Emails',             description: 'List emails in your Gmail inbox.' },
      { id: 'gmail-read',   name: 'Read Email',              description: 'Read the content of a specific email.' },
    ]},
  ],
  gdrive: [
    { name: 'Files', tools: [
      { id: 'gdrive-list',  name: 'List Files',              description: 'List files in a Google Drive folder.' },
      { id: 'gdrive-read',  name: 'Read File',               description: 'Read the content of a file from Drive.' },
      { id: 'gdrive-write', name: 'Write File',              description: 'Create or update a file in Drive.' },
    ]},
  ],
  mongodb: [
    { name: 'Operations', tools: [
      { id: 'mongo-find',   name: 'Find Documents',          description: 'Query documents from a MongoDB collection.' },
      { id: 'mongo-insert', name: 'Insert Document',         description: 'Insert a new document into a collection.' },
      { id: 'mongo-update', name: 'Update Document',         description: 'Update existing documents in a collection.' },
      { id: 'mongo-delete', name: 'Delete Document',         description: 'Delete documents from a collection.' },
    ]},
  ],
  bigquery: [
    { name: 'Queries', tools: [
      { id: 'bq-query',     name: 'Run Query',               description: 'Execute a SQL query on BigQuery.' },
      { id: 'bq-insert',    name: 'Insert Rows',             description: 'Insert rows into a BigQuery table.' },
    ]},
  ],
  serpapi: [
    { name: 'Search', tools: [
      { id: 'serp-google',  name: 'Google Search',           description: 'Search the web using the Google SERP API.' },
      { id: 'serp-images',  name: 'Google Images',           description: 'Search for images using Google Images SERP.' },
    ]},
  ],
  tavily: [
    { name: 'Search', tools: [
      { id: 'tavily-search', name: 'AI Search',              description: 'AI-optimized web search with content extraction.' },
      { id: 'tavily-extract', name: 'Extract Content',       description: 'Extract structured content from a URL.' },
    ]},
  ],
  firecrawl: [
    { name: 'Crawling', tools: [
      { id: 'fc-crawl',     name: 'Crawl URL',               description: 'Crawl a URL and extract structured content.' },
      { id: 'fc-scrape',    name: 'Scrape Page',             description: 'Scrape a single page and return markdown.' },
    ]},
  ],
  'exa-ai': [
    { name: 'Search', tools: [
      { id: 'exa-search',   name: 'Semantic Search',         description: 'Search the web using semantic similarity.' },
      { id: 'exa-contents', name: 'Get Contents',            description: 'Retrieve content for a list of URLs.' },
    ]},
  ],
  mysql: [
    { name: 'Queries', tools: [
      { id: 'mysql-select', name: 'Select Rows',             description: 'Run a SELECT query on a MySQL table.' },
      { id: 'mysql-insert', name: 'Insert Row',              description: 'Insert a row into a MySQL table.' },
      { id: 'mysql-update', name: 'Update Rows',             description: 'Update rows in a MySQL table.' },
    ]},
  ],
};

function renderProviderIcon(icon: ProviderIconDef, size = 20) {
  if (icon.type === 'integration') return renderIntegrationIcon(icon.id, size);
  return (
    <span className="text-[11px] font-bold leading-none" style={{ color: icon.fg ?? '#fff' }}>
      {icon.letter}
    </span>
  );
}

type ActionConfig = {
  providerId: string;
  providerName: string;
  providerIcon: ProviderIconDef;
  toolId: string;
  toolName: string;
  toolDescription: string;
};

function parseActionConfig(inputValue?: string): ActionConfig | null {
  if (!inputValue) return null;
  try {
    const p = JSON.parse(inputValue);
    if (p.providerId && p.toolName) return p as ActionConfig;
  } catch {}
  return null;
}

// ── Action input schemas ───────────────────────────────────────────────────


// ── On Error select ───────────────────────────────────────────────────────

const ON_ERROR_OPTIONS = [
  { id: 'stop',     label: 'Stop workflow',   description: 'Stop the workflow when this node fails.',                     Icon: AlertTriangle },
  { id: 'fallback', label: 'Fallback Branch', description: 'Create a separate branch that executes when this node fails.', Icon: GitBranch },
];

function OnErrorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="text-xs">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {ON_ERROR_OPTIONS.map((opt) => (
          <SelectItem key={opt.id} value={opt.id} className="text-xs">
            <span className="flex items-center gap-2">
              <opt.Icon className={cn('h-4 w-4', opt.id === 'stop' ? 'text-orange-500' : 'text-muted-foreground')} />
              <span>{opt.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function buildObjectItem(fields: InputFieldDef[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const f of fields) item[f.key] = f.default ?? null;
  return item;
}

function buildDefaultValues(schema: ToolInputSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of schema.fields) {
    if (f.type === 'array') {
      out[f.key] = f.fields ? [buildObjectItem(f.fields)] : [''];
    } else if (f.type === 'multiple_select') {
      out[f.key] = null;
    } else {
      out[f.key] = f.default ?? null;
    }
  }
  return out;
}

// ── Input form sub-components ─────────────────────────────────────────────

function TypeBadge({ type, switchable, switchTypes }: { type: string; switchable?: boolean; switchTypes?: string[] }) {
  const [open, setOpen] = useState(false);
  const TYPE_OPTIONS = switchTypes ?? ['multiple_select', 'array', 'expression'];
  return (
    <div className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); if (switchable) setOpen(o => !o); }}
        className={cn(
          'flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 bg-muted/90 border rounded text-muted-foreground font-mono font-medium',
          switchable && 'hover:bg-muted/80 cursor-pointer',
        )}
      >
        {type}
        {switchable && <ChevronsUpDown className="h-2.5 w-2.5 ml-0.5" />}
      </button>
      {open && switchable && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg z-50 px-1 py-1 min-w-[130px]">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t}
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[14px] rounded-md hover:bg-prune-lightGray text-left"
              >
                {t}
                {t === type && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MultiSelectField({ options, value, onChange }: {
  options: string[];
  value: unknown;
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
  const filtered = search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;
  const allSelected = filtered.length > 0 && filtered.every(o => selected.includes(o));

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-xs hover:bg-muted/20 transition-colors"
      >
        <span className="text-muted-foreground">{selected.length > 0 ? `${selected.length} selected` : 'Select multiple...'}</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-1 border rounded-lg overflow-hidden bg-background shadow-sm">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b">
            <Search className="h-3 w-3 text-muted-foreground shrink-0" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="flex-1 text-xs bg-transparent" autoFocus onClick={e => e.stopPropagation()} />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              onClick={() => onChange(allSelected ? selected.filter(s => !filtered.includes(s)) : [...new Set([...selected, ...filtered])])}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/40 border-b text-left"
            >
              <div className={cn('h-3.5 w-3.5 rounded-sm border shrink-0 flex items-center justify-center', allSelected ? 'bg-foreground border-foreground' : 'border-muted-foreground/40')}>
                {allSelected && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className="font-medium">Select All</span>
            </button>
            {filtered.map(opt => {
              const checked = selected.includes(opt);
              return (
                <button key={opt} onClick={() => toggle(opt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/40 text-left">
                  <div className={cn('h-3.5 w-3.5 rounded-sm border shrink-0 flex items-center justify-center', checked ? 'bg-foreground border-foreground' : 'border-muted-foreground/40')}>
                    {checked && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground px-1">
        <span>{selected.length} of {options.length} selected</span>
        <button onClick={() => onChange([])} className="hover:text-foreground transition-colors">Select All</button>
      </div>
    </div>
  );
}

function EnumSelectField({ options, value, onChange }: {
  options: string[];
  value: unknown;
  onChange: (v: string | null) => void;
}) {
  const [search, setSearch] = useState('');
  const val = typeof value === 'string' ? value : null;
  const filtered = search ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex-1">
        <Select
          value={val ?? ''}
          onValueChange={(next) => onChange(next || null)}
          onOpenChange={(open) => {
            if (!open) setSearch('');
          }}
        >
          <SelectTrigger className="text-[14px]">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.length > 4 && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 border-b">
                <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 text-xs bg-transparent"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="max-h-40 overflow-y-auto">
              {filtered.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-[14px] font-medium cursor-pointer">
                  {opt}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
      {val && (
        <button onClick={() => onChange(null)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground shrink-0">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function InputFieldRow({
  field,
  value,
  onChange,
  onDelete,
  depth = 0,
}: {
  field: InputFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  onDelete?: () => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const pl = 8 + depth * 12;

  // Array of objects
  if (field.type === 'array' && field.fields) {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [buildObjectItem(field.fields)];
    return (
      <div>
        <div
          style={{ paddingLeft: pl }}
          className="flex items-center gap-1 py-1.5 pr-3 cursor-pointer hover:bg-muted/10 select-none"
          onClick={() => setOpen(o => !o)}
        >
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <div className="flex items-start gap-1 flex-1 min-w-0">
              <span className="text-[15px] font-medium truncate">
                {field.label}
              </span>

              {field.required && (
                <span className="text-[#EF4444] text-[11px] leading-none">
                  <AsteriskIcon className="h-3 w-3" />
                </span>
              )}
            </div>
          <TypeBadge type="array" />
        </div>
        {open && (
          <div className="relative border-l border-dashed border-muted-foreground/20 ml-6">
            {items.map((item, idx) => (
              <div key={idx}>
                {field.fields!.map((sf, si) => (
                  <InputFieldRow
                    key={sf.key}
                    field={sf}
                    value={(item ?? {})[sf.key]}
                    onChange={(v) => {
                      const next = [...items];
                      next[idx] = { ...item, [sf.key]: v };
                      onChange(next);
                    }}
                    onDelete={si === 0 ? () => {
                      const next = items.filter((_, i) => i !== idx);
                      onChange(next.length ? next : [buildObjectItem(field.fields!)]);
                    } : undefined}
                    depth={depth + 1}
                  />
                ))}
              </div>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); onChange([...items, buildObjectItem(field.fields!)]); }}
              className="flex items-center justify-center h-6 w-6 my-1.5 ml-2 border rounded bg-muted/20 hover:bg-muted/40 text-muted-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Plain array of strings
  if (field.type === 'array') {
    const items = Array.isArray(value) ? (value as string[]) : [''];
    return (
      <div>
        <div
          style={{ paddingLeft: pl }}
          className="flex items-center gap-1 py-1.5 pr-3 cursor-pointer hover:bg-muted/10 select-none"
          onClick={() => setOpen(o => !o)}
        >
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <div className="flex items-start gap-1 flex-1 min-w-0">
              <span className="text-[15px] font-medium truncate">
                {field.label}
              </span>

              {field.required && (
                <span className="text-[#EF4444] text-[11px] leading-none">
                  <AsteriskIcon className="h-3 w-3" />
                </span>
              )}
            </div>
          <TypeBadge type="array" />
        </div>
        {open && (
          <div style={{ paddingLeft: pl + 16, paddingRight: 12, paddingBottom: 8 }}>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                <Textarea 
                  placeholder="Start typing to add values..."
                  value={item}
                  onChange={(e) => { const n = [...items]; n[idx] = e.target.value; onChange(n); }}
                  className="flex-1 text-xs resize-none"
                />
                <button
                  onClick={() => onChange(items.filter((_, i) => i !== idx))}
                  className="h-6 w-6 flex items-center justify-center rounded border hover:bg-muted/40 text-muted-foreground shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange([...items, ''])}
              className="flex items-center justify-center h-6 w-6 border rounded bg-muted/20 hover:bg-muted/40 text-muted-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Multiple select
  if (field.type === 'multiple_select') {
    return (
      <div>
        <div
          style={{ paddingLeft: pl }}
          className="flex items-center gap-1 py-1.5 pr-3 cursor-pointer hover:bg-muted/10 select-none"
          onClick={() => setOpen(o => !o)}
        >
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <div className="flex items-start gap-1 flex-1 min-w-0">
              <span className="text-[15px] font-medium truncate">
                {field.label}
              </span>

              {field.required && (
                <span className="text-[#EF4444] text-[11px] leading-none">
                  <AsteriskIcon className="h-3 w-3" />
                </span>
              )}
            </div>
          <TypeBadge type={field.type} switchable={!!field.switchableTypes} switchTypes={field.switchableTypes} />
        </div>
        {open && (
          <div style={{ paddingLeft: pl + 16, paddingRight: 12, paddingBottom: 8 }}>
            <MultiSelectField options={field.options ?? []} value={value} onChange={onChange} />
          </div>
        )}
      </div>
    );
  }

  // Boolean — inline toggle, no expand
  if (field.type === 'boolean') {
    return (
      <div
        style={{ paddingLeft: pl }}
        className="flex items-center gap-1 py-1.5 pr-3 hover:bg-muted/10"
      >
        <div className="w-3.5 shrink-0" />
        <div className="flex items-start gap-1 flex-1 min-w-0">
            <span className="text-[15px] font-medium truncate">
              {field.label}
            </span>

            {field.required && (
              <span className="text-[#EF4444] text-[11px] leading-none">
                <AsteriskIcon className="h-3 w-3" />
              </span>
            )}
          </div>
        <span className="text-[10px] px-1.5 py-0.5 bg-muted/50 border rounded text-muted-foreground font-mono mr-1.5">boolean</span>
        <Toggle
          checked={typeof value === 'boolean' ? value : false}
          onChange={(v) => onChange(v)}
        />
      </div>
    );
  }

  // Select — dynamic options (e.g. Slack channels), with optional info/warning banners
  if (field.type === 'select') {
    return (
      <div>
        <div
          style={{ paddingLeft: pl }}
          className="flex items-center gap-1 py-1.5 pr-3 cursor-pointer hover:bg-muted/10 select-none"
          onClick={() => setOpen(o => !o)}
        >
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <div className="flex items-start gap-1 flex-1 min-w-0">
            <span className="text-[15px] font-medium truncate">
              {field.label}
            </span>

            {field.required && (
              <span className="text-[#EF4444] text-[11px] leading-none">
                <AsteriskIcon className="h-3 w-3" />
              </span>
            )}
          </div>
          <TypeBadge type="select" switchable={!!field.switchableTypes} switchTypes={field.switchableTypes} />
        </div>
        {open && (
          <div style={{ paddingLeft: pl + 16, paddingRight: 12, paddingBottom: 8 }} className="space-y-2">
            {field.infoText && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-700 leading-relaxed">{field.infoText}</p>
              </div>
            )}
            {field.warningText && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700">{field.warningText}</p>
              </div>
            )}
            {!field.warningText && (
              <button className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-xs hover:bg-muted/20 transition-colors">
                <span className="text-muted-foreground">Select option…</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Number
  if (field.type === 'number') {
    return (
      <div>
        <div
          style={{ paddingLeft: pl }}
          className="flex items-center gap-1 py-1.5 pr-3 cursor-pointer hover:bg-muted/10 select-none"
          onClick={() => setOpen(o => !o)}
        >
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <div className="flex items-start gap-1 flex-1 min-w-0">
            <span className="text-[15px] font-medium truncate">
              {field.label}
            </span>

            {field.required && (
              <span className="text-[#EF4444] text-[11px] leading-none">
                <AsteriskIcon className="h-3 w-3" />
              </span>
            )}
          </div>
          <TypeBadge type="number" switchable={!!field.switchableTypes} switchTypes={field.switchableTypes} />
        </div>
        {open && (
          <div style={{ paddingLeft: pl + 16, paddingRight: 12, paddingBottom: 8 }}>
            <Input
              type="number"
              placeholder={`Default: ${field.default ?? '—'}`}
              value={typeof value === 'number' ? value : ''}
              onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        )}
      </div>
    );
  }

  // String (plain or enum)
  return (
    <div>
      <div
        style={{ paddingLeft: pl }}
        className="flex items-center gap-1 py-1.5 pr-3 cursor-pointer hover:bg-muted/10 select-none"
        onClick={() => setOpen(o => !o)}
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <div className="flex items-start gap-1 flex-1 min-w-0">
            <span className="text-[15px] font-medium truncate">
              {field.label}
            </span>

            {field.required && (
              <span className="text-[#EF4444] text-[11px] leading-none">
                <AsteriskIcon className="h-3 w-3" />
              </span>
            )}
          </div>
        <div className="flex items-center gap-1">
          <TypeBadge type="string" switchable={!!field.switchableTypes} switchTypes={field.switchableTypes} />
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div style={{ paddingLeft: pl + 16, paddingRight: 12, paddingBottom: 8 }} className="space-y-2">
          {field.infoText && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed">{field.infoText}</p>
            </div>
          )}
          {field.warningText && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700">{field.warningText}</p>
            </div>
          )}
          {field.options ? (
            <EnumSelectField options={field.options} value={value} onChange={onChange} />
          ) : (
            <div className="relative">
              <Input
                placeholder="Start typing to add values..."
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-2.5 py-1.5 pr-8 text-xs border rounded-md bg-muted/20 resize-none focus:outline-none focus:ring-1 focus:ring-prune-midGray"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionInputsForm({ toolId }: { toolId: string }) {
  const schema = TOOL_SCHEMAS[toolId];
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    schema ? buildDefaultValues(schema) : {}
  );
  const [jsonEditor, setJsonEditor] = useState(
  JSON.stringify(values, null, 2)
);

  if (!schema) {
    return <p className="text-xs text-muted-foreground">Configure the required input fields for this action.</p>;
  }

  const jsonStr = JSON.stringify(values, null, 2);

  return (
    <div className="-mx-4 -mb-4">
      {/* View toggle */}
      <div className="px-4 pb-2 pt-4">
          <div className="inline-flex items-center gap-1 rounded-lg bg-prune-lightGray border-muted">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                'py-1 px-1 flex items-center justify-center rounded border text-[11px] transition-colors',
                viewMode === 'tree' ? 'bg-white border text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/30',
              )}
            >
              <ListTreeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={cn(
                'py-1 px-1 flex items-center justify-center rounded border text-[11px] font-mono transition-colors',
                viewMode === 'json' ? 'bg-white border text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/30',
              )}
            >
              <BracesIcon className="h-5 w-5" />
            </button>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <div>
          {schema.fields.map(field => (
            <InputFieldRow
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(v) => setValues(prev => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="border rounded-xl overflow-hidden">
            <Editor
              height="200px"
              defaultLanguage="json"
              value={jsonEditor}
              onChange={(value) => {
                if (!value) return;
                setJsonEditor(value);
                try {
                  setValues(JSON.parse(value));
                } catch {}
              }}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                renderLineHighlight: 'none',
                padding: {
                  top: 10,
                  bottom: 10,
                },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCategoryPicker({
  node,
  onUpdateValue,
  onUpdateLabel,
}: {
  node: CanvasNode;
  onUpdateValue: (id: string, value: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
}) {
  const [nav, setNav] = useState<ActionNavStep>({ step: 'categories' });
  const [search, setSearch] = useState('');
  const [useEndUser, setUseEndUser] = useState(false);
  const [retryOnFailure, setRetryOnFailure] = useState(false);
  const [onError, setOnError] = useState('stop');

  const config = parseActionConfig(node.inputValue);

  if (config) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {/* Provider */}
          <div className="px-4 py-3 border-b">
            <SubLabel>Provider</SubLabel>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
              <div
                className="h-6 w-6 rounded flex items-center justify-center shrink-0 border overflow-hidden"
                style={config.providerIcon.type === 'letter' ? { backgroundColor: config.providerIcon.bg } : undefined}
              >
                {renderProviderIcon(config.providerIcon, 14)}
              </div>
              <span className="flex-1 text-left font-medium">{config.providerName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </div>

          {/* Action */}
          <div className="px-4 py-3 border-b">
            <SubLabel>Action</SubLabel>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
              <div
                className="h-6 w-6 rounded flex items-center justify-center shrink-0 border overflow-hidden"
                style={config.providerIcon.type === 'letter' ? { backgroundColor: config.providerIcon.bg } : undefined}
              >
                {renderProviderIcon(config.providerIcon, 14)}
              </div>
              <span className="flex-1 text-left font-medium">{config.toolName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </div>

          {/* Connection */}
          <div className="px-4 py-3 space-y-2">
            <SubLabel>Connection</SubLabel>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-prune-commonGray">Use end-user connection</span>
              <Toggle checked={useEndUser} onChange={setUseEndUser} />
            </div>
            <p className="text-[12px] text-muted-foreground">Require end-users to authenticate at runtime</p>
            <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
              <span className="flex-1 text-left">Select a connection</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              <span className="underline cursor-pointer hover:text-foreground">Your credentials are encrypted and can be removed at any time.</span>
              {' '}You can manage all your connections{' '}
              <span className="underline cursor-pointer hover:text-foreground">here</span>.
            </p>
          </div>

          {/* Visual divider before collapsible sections */}
          <div className="h-2 bg-muted/10 border-b" />

          <Section
            title="Inputs"
            icon={<FileInputIcon className="h-4 w-4" />}
            defaultOpen
            extra={
              <span className="flex items-center gap-1 text-[12px] text-amber-700 bg-amber-100 px-1 rounded-md font-normal mr-1">
                <AlertTriangle className="h-3 w-3" />Has required fields
              </span>
            }
          >
            <ActionInputsForm toolId={config.toolId} />
          </Section>
          {/* Outputs */}
          <Section title="Outputs" icon={<FileText className="h-4 w-4" />}>
            {(() => {
              const outputSchema = TOOL_OUTPUTS[config.toolId];
              if (!outputSchema) {
                return <p className="text-[14px] text-muted-foreground">No outputs defined for this action.</p>;
              }
              return (
                <div className="-mx-4 -mb-4">
                  {outputSchema.fields.map((field, idx) => (
                    <div key={field.key} className={cn('flex items-stretch gap-3 px-4 py-3', idx < outputSchema.fields.length - 1 && 'border-b')}>
                      <div className="w-px bg-muted-foreground/20 shrink-0 rounded-full my-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[14px] font-medium text-foreground">{field.label}</span>
                          <span className="text-[11px] px-1.5 py-0.5 bg-muted/50 border font-medium rounded text-muted-foreground font-mono shrink-0 ml-2">{field.type}</span>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{field.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Section>
          <Section title="Advanced Settings" icon={<Rocket className="h-3.5 w-3.5" />}>
            <div className="space-y-4">
              <SettingRow label="Retry on Failure">
                <Toggle checked={retryOnFailure} onChange={setRetryOnFailure} />
              </SettingRow>
              <div>
                <SubLabel>On Error</SubLabel>
                <OnErrorSelect value={onError} onChange={setOnError} />
              </div>
            </div>
          </Section>
          <Section title="Test Action" icon={<Play className="h-3.5 w-3.5" />}>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Testing an action will use the values you have entered in Inputs and Configurations.
            </p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              <Play className="h-3.5 w-3.5 fill-background" />
              Run Action
            </button>
          </Section>
        </div>
      </div>
    );
  }

  // ── Categories view ──────────────────────────────────────────────────────
  if (nav.step === 'categories') {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Select a Category
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {ACTION_CATEGORIES_DEF.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
                onClick={() => { setNav({ step: 'providers', catId: cat.id, catLabel: cat.label, catHeader: cat.header }); setSearch(''); }}
              >
                <div className="h-10 w-10 rounded-xl border bg-muted/20 flex items-center justify-center shrink-0">
                  <CatIcon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                    {cat.verified && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shrink-0">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{cat.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Provider list view ───────────────────────────────────────────────────
  if (nav.step === 'providers') {
    const providers = ACTION_PROVIDERS
      .filter(p => p.cats.includes(nav.catId))
      .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { setNav({ step: 'categories' }); setSearch(''); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Providers in {nav.catHeader}
          </span>
        </div>
        <div className="px-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
              placeholder={`Search for a provider in ${nav.catHeader}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {providers.map(provider => (
            <button
              key={provider.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
              onClick={() => { setNav({ step: 'tools', catId: nav.catId, catLabel: nav.catLabel, catHeader: nav.catHeader, providerId: provider.id, providerName: provider.name }); setSearch(''); }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden shrink-0"
                style={provider.icon.type === 'letter' ? { backgroundColor: provider.icon.bg } : {}}
              >
                {renderProviderIcon(provider.icon)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{provider.name}</div>
                <div className="text-xs text-muted-foreground truncate">{provider.description}</div>
              </div>
            </button>
          ))}
          {providers.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">No providers found</div>
          )}
        </div>
      </div>
    );
  }

  // ── Tool list view ───────────────────────────────────────────────────────
  const providerDef = ACTION_PROVIDERS.find(p => p.id === nav.providerId);
  const allGroups = PROVIDER_TOOLS[nav.providerId] ?? [];
  const filteredGroups = allGroups
    .map(g => ({
      ...g,
      tools: search
        ? g.tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
        : g.tools,
    }))
    .filter(g => g.tools.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex items-center gap-1 shrink-0">
        <button
          onClick={() => { setNav({ step: 'providers', catId: nav.catId, catLabel: nav.catLabel, catHeader: nav.catHeader }); setSearch(''); }}
          className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          TOOLS IN {nav.catHeader}
        </button>
        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {nav.providerName.toUpperCase()}
        </span>
      </div>
      <div className="px-4 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            autoFocus
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
            placeholder={`Search for a tool in ${nav.providerName}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length > 0 ? filteredGroups.map(group => (
          <div key={group.name}>
            <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/10">
              {group.name}
            </div>
            {group.tools.map(tool => (
              <button
                key={tool.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
                onClick={() => {
                  const providerDef = ACTION_PROVIDERS.find(p => p.id === nav.providerId);
                  if (!providerDef) return;
                  const cfg: ActionConfig = {
                    providerId: nav.providerId,
                    providerName: nav.providerName,
                    providerIcon: providerDef.icon,
                    toolId: tool.id,
                    toolName: tool.name,
                    toolDescription: tool.description,
                  };
                  onUpdateValue(node.id, JSON.stringify(cfg));
                  onUpdateLabel(node.id, tool.name);
                }}
              >
                <div
                  className="relative h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden"
                  style={providerDef?.icon.type === 'letter' ? { backgroundColor: providerDef.icon.bg } : {}}
                >
                  {providerDef && renderProviderIcon(providerDef.icon)}
                  <div className="absolute bottom-0 right-0 h-4 w-4 bg-white border-t border-l rounded-tl flex items-center justify-center">
                    <Play className="h-2 w-2 fill-foreground text-foreground" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{tool.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                </div>
              </button>
            ))}
          </div>
        )) : (
          <div className="px-4 py-10 text-center text-xs text-muted-foreground">
            {allGroups.length === 0 ? 'No tools available for this provider yet.' : 'No tools match your search.'}
          </div>
        )}
      </div>
    </div>
  );
}

function AudioOutputPanelSections() {
  return (
    <>
      <Section title="Test Output" icon={<Mic className="h-3.5 w-3.5" />} defaultOpen>
        <div className="px-4 py-3 rounded-2xl border text-xs text-muted-foreground bg-muted/10 text-center">
          No audio output, run the flow to generate audio
        </div>
      </Section>
      <Section title="Configuration" icon={<Settings2 className="h-3.5 w-3.5" />}>
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

function TemplatePanelSections() {
  return (
    <Section title="Edit Template" icon={<PencilLineIcon className="h-3.5 w-3.5" />} defaultOpen>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        Add nodes to the template from the options on the left. Remove the template to use default output.
      </p>
      <div className="border rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/10 flex-wrap">
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors text-xs font-bold">B</button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors text-xs italic font-serif">I</button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded bg-gray-800 text-white text-[11px] font-semibold leading-none">H<sub className="text-[8px]">1</sub></button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground text-[11px] font-semibold leading-none">H<sub className="text-[8px]">2</sub></button>
          <button className="h-6 px-1.5 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground text-[11px] font-semibold leading-none">H<sub className="text-[8px]">3</sub></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><List className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><ListOrdered className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><Quote className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><Code className="h-3.5 w-3.5" /></button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground transition-colors"><Image className="h-3.5 w-3.5" /></button>
        </div>
        {/* Content area */}
        <div className="p-3 min-h-[280px] text-sm leading-relaxed bg-background">
          <h1 className="text-base font-bold mb-2">Template Node</h1>
          <h2 className="text-sm font-semibold mb-1.5">How this works</h2>
          <p className="text-xs text-foreground/80 mb-3">This node allows you to create a template that can be used to format the output of other nodes.</p>
          <h2 className="text-sm font-semibold mb-1.5">How to use</h2>
          <ul className="list-disc list-inside text-xs text-foreground/80 space-y-1">
            <li>Format to heading, bullet points, and more using the options above.</li>
            <li>Use the values of other nodes by selecting them from the expressions side panel.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

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

interface NodeDetailPanelProps {
  node: CanvasNode;
  nodes: CanvasNode[];
  onClose: () => void;
  onUpdateValue: (id: string, value: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onRemoveNode: (id: string) => void;
  onFocusNode: (id: string) => void;
  onResizeMouseDown?: (e: React.MouseEvent) => void;
}

export function NodeDetailPanel({
  node,
  nodes,
  onClose,
  onUpdateValue,
  onUpdateLabel,
  onRemoveNode,
  onFocusNode,
  onResizeMouseDown,
}: NodeDetailPanelProps) {
  const [labelEditing, setLabelEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(node.label);
  const [labelHovered, setLabelHovered] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLabelDraft(node.label);
    setLabelEditing(false);
  }, [node.id, node.label]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const def = getNodeDef(node.kind);
  if (!def) return null;

  const Icon = def.icon;
  const identifier = getNodeIdentifier(node, nodes);

  function commitLabel() {
    const trimmed = labelDraft.trim();
    setLabelEditing(false);
    if (trimmed && trimmed !== node.label) onUpdateLabel(node.id, trimmed);
    else setLabelDraft(node.label);
  }

  return (
    <div className="relative w-full h-full">
      {/* Drag-to-resize handle — outside overflow-hidden so it's never clipped */}
      <div
        onMouseDown={onResizeMouseDown}
        className="group/resizer absolute left-0 top-0 bottom-0 w-4 -translate-x-full z-50 cursor-col-resize select-none"
      >
       <div
      className="
          absolute
          top-2
          bottom-2
          right-0
          w-px
          opacity-0
          group-hover/resizer:opacity-100
          transition-opacity
          duration-200
          bg-gradient-to-b
          from-transparent
          via-black
          to-transparent
        "
      />
        <div
          className="
            absolute
            top-1/2
            right-0
            translate-x-1/2
            -translate-y-1/2
            h-7
            w-7
            rounded-full
            bg-background
            border
            border-transparent
            shadow-md
            flex
            items-center
            justify-center
            text-muted-foreground
            group-hover/resizer:text-foreground
            group-hover/resizer:border-black
            group-hover/resizer:scale-105
            transition-all
            duration-150
          "
        >
          <ChevronsLeftRight className="h-4 w-4" />
        </div>
      </div>

      {/* Panel shell — overflow-hidden kept here for rounded corners + scroll */}
      <div className="w-full h-full bg-background rounded-xl border shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
          {/* Node icon */}
          <div className="h-7 w-7 rounded-md bg-muted/50 border flex items-center justify-center shrink-0">
            {def.kind === "ai-agent" ||
            def.kind === "prune-ai" ||
            def.kind === "openai-app" ? (
              renderIntegrationIcon(
                getModelProvider(
                  node.model ??
                    (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6"),
                ),
                14,
              )
            ) : def.integrationId ? (
              renderIntegrationIcon(def.integrationId, 14)
            ) : (
              <Icon className={cn("h-3.5 w-3.5", def.iconClass)} />
            )}
          </div>

          {/* Label + identifier badge */}
          <div className="flex-1 min-w-0">
            {labelEditing ? (
              <input
                autoFocus
                className="w-full text-sm font-semibold bg-prune-lightGray rounded px-1 outline-none focus:ring-1 focus:ring-ring"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') { setLabelDraft(node.label); setLabelEditing(false); }
                }}
              />
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    "text-sm font-semibold truncate rounded px-1 -mx-1 cursor-text transition-colors select-none",
                    labelHovered && "bg-prune-lightGray"
                  )}
                  onMouseEnter={() => setLabelHovered(true)}
                  onMouseLeave={() => setLabelHovered(false)}
                  onClick={() => { setLabelEditing(true); setLabelDraft(node.label); }}
                >
                  {node.label}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border text-muted-foreground shrink-0">
                  {identifier}
                </span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Bookmark */}
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Bookmark className="h-3.5 w-3.5" />
            </button>
            {/* Ellipsis menu */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-background border rounded-xl shadow-lg font-normal overflow-hidden z-50 py-1 px-1">
                  {[
                    { icon: Copy,        label: 'Copy',   onClick: () => setMenuOpen(false) },
                    { icon: SkipForward, label: 'Skip',   onClick: () => setMenuOpen(false) },
                    { icon: Crosshair,   label: 'Focus',  onClick: () => { setMenuOpen(false); onFocusNode(node.id); } },
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

        {/* Description — gray background */}
        <div className="border-b shrink-0">
          <p className="text-[14px] text-muted-foreground font-medium leading-relaxed bg-prune-lightGray px-3 py-3">
            {def.kind === 'trigger'
              ? 'Please select an integration for your trigger.'
              : def.kind === 'action'
              ? (parseActionConfig(node.inputValue)?.toolDescription ?? 'Please select an action for your integration.')
              : def.description}
          </p>
        </div>

        {/* Sections */}
        {def.kind === 'trigger' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <TriggerProviderPicker />
          </div>
        ) : (def.kind === 'ai-agent' || def.kind === 'prune-ai' || def.kind === 'openai-app') ? (
          <div className="flex-1 overflow-y-auto">
            <AIAgentPanelSections node={node} def={def} identifier={identifier} onUpdateValue={onUpdateValue} />
          </div>
        ) : def.kind === 'action' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <ActionCategoryPicker node={node} onUpdateValue={onUpdateValue} onUpdateLabel={onUpdateLabel} />
          </div>
        ) : def.kind === 'audio-output' ? (
          <div className="flex-1 overflow-y-auto py-[3px]">
            <AudioOutputPanelSections />
          </div>
        ) : def.kind === 'template-out' ? (
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
        ) : def.kind === 'output' ? (
          <div className="flex-1 overflow-y-auto py-[3px]">
            <Section title="Templated Output" icon={<LayoutTemplate className="h-3.5 w-3.5" />} defaultOpen>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Add a template to format the output. By default, the output combines the results of all connected nodes.
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
            <Section title="Output Content" icon={<FileText className="h-3.5 w-3.5" />} defaultOpen>
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
            <PanelSections node={node} def={def} onUpdateValue={onUpdateValue} />
          </div>
        )}
      </div>
    </div>
  );
}
