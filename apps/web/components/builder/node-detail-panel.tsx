"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodeDef,
  getModelProvider,
  type CanvasNode,
  type NodeDef,
} from "@/lib/editor-nodes";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";

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
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <span className="flex-1 text-left text-sm font-medium">{title}</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
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
    <div className={cn("text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2 mb-2", className)}>
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0 focus:outline-none",
        checked ? "bg-gray-900" : "bg-gray-200",
      )}
    >
      <span className={cn(
        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0.5",
      )} />
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
          <div>
            <SubLabel>Instructions</SubLabel>
            <div className="border rounded-lg overflow-hidden">
              <textarea
                className="w-full px-3 py-2.5 text-xs bg-background resize-none focus:outline-none placeholder:text-muted-foreground/40 min-h-[80px]"
                rows={5}
                placeholder="You are a helpful assistant that…"
                value={node.inputValue ?? ""}
                onChange={(e) => onUpdateValue(node.id, e.target.value)}
              />
              <PromptEditorToolbar showLeft />
            </div>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2">Prompt</span>
              <div className="ml-auto flex items-center border rounded-md overflow-hidden text-[11px]">
                <button onClick={() => setPromptMode('edit')} className={cn("px-2.5 py-1 transition-colors", promptMode === 'edit' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Edit</button>
                <button onClick={() => setPromptMode('formatted')} className={cn("px-2.5 py-1 transition-colors", promptMode === 'formatted' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Formatted</button>
              </div>
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
        </div>
      </Section>

      {/* Image URLs */}
      <div className="px-4 py-3 border-b">
        <SubLabel>Image URLs</SubLabel>
        <textarea
          className="w-full px-3 py-2 text-xs bg-muted/20 border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/40"
          rows={2}
          placeholder="Start typing to add values..."
        />
      </div>

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

type ActionCategory = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  verified?: boolean;
};

const ACTION_CATEGORIES: ActionCategory[] = [
  { id: 'all',       label: 'All',        description: 'All tools and providers',                  icon: LayoutGrid },
  { id: 'stackai',   label: 'By StackAI', description: 'Native Stack AI tools and integrations',  icon: Blocks,    verified: true },
  { id: 'apps',      label: 'Apps',       description: 'Third-party applications and services',   icon: Box },
  { id: 'llm',       label: 'LLM',        description: 'Large language models and AI services',   icon: Brain },
  { id: 'databases', label: 'Databases',  description: 'Database connections and data management', icon: Database },
  { id: 'scrapers',  label: 'Scrapers',   description: 'Web scraping and data extraction tools',  icon: ScanLine },
];

function ActionCategoryPicker() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          Select a Category
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y">
        {ACTION_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
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
              ? 'Please select an action for your integration.'
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
            <ActionCategoryPicker />
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
