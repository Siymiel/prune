"use client";

import { useState } from "react";
import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  Settings2,
  Database,
  Wrench,
  GitBranch,
  Cpu,
  Bot,
  RefreshCw,
  Rocket,
  Plus,
  PencilLineIcon,
  Search,
} from "lucide-react";
import { Section, SubLabel, SettingRow, Toggle, Slider, PromptEditorToolbar } from "./panel-ui";
import { PromptEditor } from "./prompt-editor";
import { Textarea } from "@/components/ui/textarea";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import { getModelProvider, type CanvasNode, type NodeDef } from "@/lib/editor-nodes";
import { KnowledgeBaseDialog, ConnectedAppsDialog, ToolsPickerDialog } from "./knowledge-source-picker";

const AI_PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
  { id: "meta", label: "Meta" },
  { id: "mistral", label: "Mistral" },
  { id: "xai", label: "XAI" },
  { id: "perplexity", label: "Perplexity" },
  { id: "togetherai", label: "TogetherAI" },
  { id: "cerebras", label: "Cerebras" },
] as const;

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#000000",
  anthropic: "#C96442",
  google: "#4285F4",
  meta: "#0082FB",
  mistral: "#FF6B35",
  xai: "#1a1a1a",
  perplexity: "#20b2aa",
  togetherai: "#7c3aed",
  cerebras: "#FF6B00",
};

function ProviderIcon({ id, size = 16 }: { id: string; size?: number }) {
  const icon = renderIntegrationIcon(id as any, size);
  if (icon) return <>{icon}</>;
  const label = AI_PROVIDERS.find((p) => p.id === id)?.label ?? id;
  const letter = label[0].toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        backgroundColor: PROVIDER_COLORS[id] ?? "#6b7280",
      }}
    >
      {letter}
    </span>
  );
}

export function AIAgentPanelSections({
  node,
  def,
  identifier,
  nodes,
  onUpdateValue,
  onUpdateSystemPrompt,
}: {
  node: CanvasNode;
  def: NodeDef;
  identifier: string;
  nodes: CanvasNode[];
  onUpdateValue: (id: string, value: string) => void;
  onUpdateSystemPrompt: (id: string, value: string) => void;
}) {
  const [promptMode, setPromptMode] = useState<"edit" | "formatted">("edit");
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [windowSize, setWindowSize] = useState(10);
  const [citationsEnabled, setCitationsEnabled] = useState(true);
  const [useReferences, setUseReferences] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const [streamData, setStreamData] = useState(true);
  const [safeContext, setSafeContext] = useState(false);
  const [fileAccess, setFileAccess] = useState(false);
  const [dateAndTime, setDateAndTime] = useState(false);
  const [guardrails, setGuardrails] = useState(false);
  const [piiCompliance, setPiiCompliance] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [maxOutputLength, setMaxOutputLength] = useState(128000);
  const [retryOnFailure, setRetryOnFailure] = useState(false);
  const [llmFallbackMode, setLlmFallbackMode] = useState(false);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [connectedAppsOpen, setConnectedAppsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const model =
    node.model ?? (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6");
  const provider = getModelProvider(model);
  const providerLabel = provider === "openai" ? "OpenAI" : "Anthropic";

  const [providerQuery, setProviderQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>(provider);

  return (
    <div className="bg-prune-lightGray">
      <div className="bg-prune-lightGray border-b ml-2">
        {/* AI Provider */}
        <div className="px-4 py-2 border-b">
          <SubLabel>AI Provider</SubLabel>
          <DropdownMenu onOpenChange={(open) => { if (!open) setProviderQuery(""); }}>
            <DropdownMenuTrigger asChild>
              <button className="w-full bg-white flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
                <span className="flex items-center justify-center shrink-0">
                  <ProviderIcon id={selectedProvider} size={16} />
                </span>
                <span className="flex-1 text-left font-medium">
                  {AI_PROVIDERS.find((p) => p.id === selectedProvider)?.label ?? providerLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}>
              <div className="px-2 py-1.5 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    value={providerQuery}
                    onChange={(e) => setProviderQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Search providers..."
                    className="w-full pl-7 pr-2 py-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {AI_PROVIDERS.filter((p) =>
                  p.label.toLowerCase().includes(providerQuery.toLowerCase())
                ).map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    className="gap-2.5 text-[14px] font-medium"
                    onSelect={() => setSelectedProvider(p.id)}
                  >
                    <span className="shrink-0"><ProviderIcon id={p.id} size={16} /></span>
                    {p.label}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Model */}
        <div className="px-4 py-3">
          <SubLabel>Model</SubLabel>
          <button className="w-full bg-white flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
            <span className="flex items-center justify-center shrink-0">
              {renderIntegrationIcon(provider, 16)}
            </span>
            <span className="flex-1 text-left font-medium">{model}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>
        </div>

        {/* Try agent templates */}
        <button className="w-full flex justify-between items-center gap-2.5 px-4 py-3 mb-2 hover:bg-muted/30 transition-colors text-left">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-foreground/80 shrink-0" />
            <span className="flex-1 text-[14px] font-medium text-foreground/80">
              Try our agent templates
            </span>
            <span className="text-[12px] px-2 py-1 bg-blue-100 text-blue-600 rounded-lg ml-1 font-semibold shrink-0">
              New
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Prompting */}
      <Section title="Prompting" icon={<AlignLeft className="h-3.5 w-3.5" />} defaultOpen>
        <div className="space-y-4 ml-2">
          <div className="mt-4">
            <SubLabel>Instructions</SubLabel>
            <div className="border rounded-lg overflow-hidden">
              <Textarea
                placeholder="You are a helpful assistant that…"
                value={
                  node.systemPrompt ??
                  "You are an expert Investments Help Desk AI Agent. Use the provided context from internal knowledge base, web search, and document repositories to answer the user's question. Be concise, cite sources, and clearly differentiate between product offerings. If eligibility is in question, explain the criteria."
                }
                onChange={(e) => onUpdateSystemPrompt(node.id, e.target.value)}
                size="lg"
              />
              <PromptEditorToolbar showLeft />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <SubLabel>Prompt</SubLabel>
              <ButtonGroup
                className="ml-auto"
                options={[
                  { value: "edit", label: "Edit" },
                  { value: "formatted", label: "Formatted" },
                ]}
                value={promptMode}
                onChange={setPromptMode}
              />
            </div>
            <div className="border rounded-lg overflow-hidden">
              <PromptEditor
                value={
                  node.inputValue ??
                  "- Please provide a clear and concise answer to the user's question.\n- If the answer is not available, search the internal knowledge base for relevant information.\n- If necessary, supplement your response with information from the web search results."
                }
                onChange={(v) => onUpdateValue(node.id, v)}
                nodes={nodes}
                height={240}
              />
              <PromptEditorToolbar />
            </div>
          </div>
          <div className="mt-4">
            <SubLabel>Image URLs</SubLabel>
            <Textarea placeholder="Start typing to add values..." />
          </div>
        </div>
      </Section>

      {/* Knowledge Sources */}
      <Section title="Knowledge Sources" icon={<Database className="h-4 w-4" />}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="prune" className="w-full">
              <Plus className="h-4 w-4" />
              <span className="text-[14px] font-medium">Add Knowledge Sources</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}>
            <DropdownMenuItem
              className="items-start gap-3 py-2.5"
              onSelect={() => setKnowledgeBaseOpen(true)}
            >
              <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-foreground">Add Knowledge Base</div>
                <div className="text-xs font-medium text-muted-foreground leading-relaxed">
                  Index documents for fast retrieval and reuse across workflows.
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="items-start gap-3 py-2.5"
              onSelect={() => setConnectedAppsOpen(true)}
            >
              <Search className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-foreground">Search Connected Apps</div>
                <div className="text-xs font-medium text-muted-foreground leading-relaxed">
                  Search apps like Gmail, Sheets, and Slack without importing data.
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <KnowledgeBaseDialog open={knowledgeBaseOpen} onOpenChange={setKnowledgeBaseOpen} />
        <ConnectedAppsDialog open={connectedAppsOpen} onOpenChange={setConnectedAppsOpen} />
      </Section>

      {/* Tools */}
      <Section title="Tools" icon={<Wrench className="h-3.5 w-3.5" />}>
        <Button variant="prune" className="w-full" onClick={() => setToolsOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="text-[14px] font-medium">Add tools</span>
        </Button>
        <ToolsPickerDialog open={toolsOpen} onOpenChange={setToolsOpen} />
      </Section>

      {/* Subflow Tools */}
      <Section title="Subflow Tools" icon={<GitBranch className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Add subflow tools that the LLM can call. Connect each tool handle to a subflow that will
          execute when the LLM calls that tool.
        </p>
        <div className="text-[10px] text-muted-foreground mb-1.5">
          Available variable in subflows:
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border rounded-md text-xs font-mono text-foreground mb-3">
          <Cpu className="h-3 w-3 text-muted-foreground shrink-0" />
          {identifier}.subflow_tool_input
        </div>
        <Button variant="prune" className="w-full">
          <Plus className="h-4 w-4" />
          <span className="text-[14px] font-medium">Add Subflow Tool</span>
        </Button>
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
              <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2">
                Window Size
              </span>
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
              When the workflow runs, the LLM conversation history will use this as the source of
              user messages.
            </p>
            <div className="flex items-center gap-4 mt-2 justify-end">
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View Memory
              </button>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear
              </button>
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
            <div className="text-xs font-semibold text-foreground mb-2">
              Use your own credentials
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
              <span className="flex-1 text-left">Select a connection</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Your credentials are encrypted and can be removed at any time. You can manage all
              your connections here.
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
              <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2">
                Temperature
              </span>
              <span className="text-xs font-medium tabular-nums">{temperature.toFixed(1)}</span>
            </div>
            <Slider value={temperature} min={0} max={1} step={0.1} onChange={setTemperature} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2">
                Max Output Length
              </span>
              <span className="text-xs font-medium tabular-nums">
                {maxOutputLength.toLocaleString()}
              </span>
            </div>
            <Slider
              value={maxOutputLength}
              min={0}
              max={128000}
              step={1000}
              onChange={setMaxOutputLength}
            />
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
    </div>
  );
}
