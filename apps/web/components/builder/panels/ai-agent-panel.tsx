"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
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
  Clock,
  Globe,
  Check,
  ChevronsUpDown,
  X,
  BarChart2,
  FileSearch2,
  Headphones,
  PenLine,
  TrendingUp,
} from "lucide-react";
import { api, type KnowledgeBaseOut } from "@/lib/api";
import {
  Section,
  SubLabel,
  SettingRow,
  Toggle,
  Slider,
  PromptEditorToolbar,
} from "./panel-ui";
import { PromptEditor } from "./prompt-editor";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  getModelProvider,
  type CanvasNode,
  type NodeDef,
} from "@/lib/editor-nodes";
import {
  KnowledgeBaseDialog,
  ConnectedAppsDialog,
  ToolsPickerDialog,
} from "./knowledge-source-picker";
import {
  ModelPickerDialog,
  MODELS,
  ProviderIcon,
  PROVIDER_LABELS,
} from "./model-picker";
import { Separator } from "@/components/ui/separator";

const MEMORY_TYPES = [
  {
    id: "sliding-window",
    label: "Sliding Window",
    icon: <Clock className="h-4 w-4 text-foreground shrink-0" />,
    description:
      "LLM will remember the full of N previous messages, including references to any files or knowledge bases, which may result in memory running out quickly.",
  },
  {
    id: "sliding-window-input",
    label: "Sliding Window with Input",
    icon: <Globe className="h-4 w-4 text-foreground shrink-0" />,
    description:
      "Like Sliding Window, but also includes the user's current input in the memory context. Useful when the input references previous conversation content.",
  },
  {
    id: "vector-database",
    label: "Vector Database",
    icon: <Database className="h-4 w-4 text-foreground shrink-0" />,
    description:
      "Store and retrieve conversation history using vector similarity search. Ideal for long-running sessions where semantic relevance matters more than message order.",
  },
] as const;

type MemoryTypeId = (typeof MEMORY_TYPES)[number]["id"];

const AI_PROVIDERS = Object.entries(PROVIDER_LABELS).map(([id, label]) => ({
  id,
  label,
}));

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  openai: "AI provider for OpenAI",
  anthropic: "AI provider for Anthropic",
  google: "AI provider for Google",
  meta: "AI provider for Meta",
  mistral: "AI provider for Mistral",
  xai: "AI provider for XAI",
  perplexity: "AI provider for Perplexity",
  togetherai: "AI provider for TogetherAI",
  cerebras: "AI provider for Cerebras",
};

const AGENT_TEMPLATES = [
  {
    id: "data-analyst",
    name: "Data Analyst",
    toolCount: 9,
    icon: BarChart2,
    description: "Analyzes data, runs code, and generates visualizations from your files and databases.",
    systemPrompt: "You are an expert Data Analyst AI. You have access to code execution, file analysis, and data visualization tools. Help users analyze their data by writing and running code, creating charts, and providing clear insights from the data.",
    prompt: "Analyze the provided data and answer the user's question. Use code execution when needed to process or visualize data. Explain your findings clearly.",
  },
  {
    id: "kb-qa-agent",
    name: "Document Q&A",
    toolCount: 3,
    icon: FileSearch2,
    description: "Answer questions strictly from your connected knowledge bases and uploaded documents.",
    systemPrompt: "You are a knowledgeable document assistant. Answer questions using only the provided knowledge base. Be concise and accurate. If the answer is not in the knowledge base, clearly state that you don't have that information — do not speculate or fabricate an answer.",
    prompt: "Search the connected knowledge base for relevant context, then answer the user's question. Quote directly from the source when helpful, and always indicate which document the information came from.",
  },
  {
    id: "customer-support",
    name: "Customer Support",
    toolCount: 3,
    icon: Headphones,
    description: "Resolve customer issues with a friendly, empathetic tone using your knowledge base.",
    systemPrompt: "You are a customer support specialist. Help users resolve their issues quickly and professionally. Use the knowledge base to find accurate answers, maintain a polite and empathetic tone, and escalate complex issues when appropriate.",
    prompt: "Based on the available knowledge base and context, help resolve the user's request. If you cannot fully resolve the issue, acknowledge the limitation and suggest clear next steps.",
  },
  {
    id: "content-writer",
    name: "Content Writer",
    toolCount: 3,
    icon: PenLine,
    description: "Writes blog posts, articles, and marketing copy with web research for accuracy and SEO.",
    systemPrompt: "You are an expert content writer and SEO specialist. Create high-quality, engaging content that is both informative and optimized for search engines. Research topics thoroughly and produce well-structured content.",
    prompt: "Write high-quality content based on the user's request. Research the topic thoroughly and create engaging, well-structured content with proper formatting.",
  },
  {
    id: "investment-help-desk",
    name: "Investment Help Desk",
    toolCount: 5,
    icon: TrendingUp,
    description: "Answer investor questions using internal docs and web search with cited sources.",
    systemPrompt: "You are an expert Investments Help Desk AI Agent. Use the provided context from internal knowledge base, web search, and document repositories to answer the user's question. Be concise, cite sources, and clearly differentiate between product offerings.",
    prompt: "Please provide a clear and concise answer to the user's question. If the answer is not available, search the internal knowledge base for relevant information. If necessary, supplement your response with information from the web search results.",
  },
];

type TemplateId = string;

export function AIAgentPanelSections({
  node,
  def,
  identifier,
  nodes,
  onUpdateValue,
  onUpdateSystemPrompt,
  onUpdateModel,
  onUpdateKnowledgeBases,
  onUpdateSubflowTools,
  scrollToSection,
}: {
  node: CanvasNode;
  def: NodeDef;
  identifier: string;
  nodes: CanvasNode[];
  onUpdateValue: (id: string, value: string) => void;
  onUpdateSystemPrompt: (id: string, value: string) => void;
  onUpdateModel: (id: string, model: string) => void;
  onUpdateKnowledgeBases: (id: string, kbIds: string[]) => void;
  onUpdateSubflowTools?: (id: string, tools: import("@/lib/editor-nodes").SubflowTool[]) => void;
  scrollToSection?: {
    section: "tools" | "knowledge-sources";
    trigger: number;
  } | null;
}) {
  const [promptMode, setPromptMode] = useState<"edit" | "formatted">("edit");
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryType, setMemoryType] =
    useState<(typeof MEMORY_TYPES)[number]["id"]>("sliding-window");
  const [hoveredMemoryType, setHoveredMemoryType] = useState<string | null>(
    null,
  );
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
  const [responseFormat, setResponseFormat] = useState<"text" | "json">("text");
  const [jsonSchema, setJsonSchema] = useState("");
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [connectedAppsOpen, setConnectedAppsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [allKbs, setAllKbs] = useState<KnowledgeBaseOut[]>([]);

  // View state: provider-select → shown for ai-agent nodes with no model yet
  const isGenericAgent = def.kind === "ai-agent";
  const [view, setView] = useState<"provider-select" | "template-picker" | "config">(
    () => isGenericAgent && !node.model ? "provider-select" : "config"
  );
  const [pickerProviderQuery, setPickerProviderQuery] = useState("");

  useEffect(() => {
    api.knowledgeBases.list().then(setAllKbs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!knowledgeBaseOpen) {
      api.knowledgeBases.list().then(setAllKbs).catch(() => {});
    }
  }, [knowledgeBaseOpen]);

  const knowledgeSectionRef = useRef<HTMLDivElement>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);
  const [knowledgeForceTrigger, setKnowledgeForceTrigger] = useState(0);
  const [toolsForceTrigger, setToolsForceTrigger] = useState(0);

  // Subflow tools
  const [subflowTools, setSubflowTools] = useState<import("@/lib/editor-nodes").SubflowTool[]>(
    () => node.subflowTools ?? []
  );
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  const addSubflowTool = () => {
    const newTool: import("@/lib/editor-nodes").SubflowTool = {
      id: crypto.randomUUID(),
      name: `Tool ${subflowTools.length + 1}`,
      description: "",
    };
    const updated = [...subflowTools, newTool];
    setSubflowTools(updated);
    onUpdateSubflowTools?.(node.id, updated);
    setEditingToolId(newTool.id);
  };

  const updateSubflowTool = (id: string, patch: Partial<import("@/lib/editor-nodes").SubflowTool>) => {
    const updated = subflowTools.map(t => t.id === id ? { ...t, ...patch } : t);
    setSubflowTools(updated);
    onUpdateSubflowTools?.(node.id, updated);
  };

  const removeSubflowTool = (id: string) => {
    const updated = subflowTools.filter(t => t.id !== id);
    setSubflowTools(updated);
    onUpdateSubflowTools?.(node.id, updated);
    if (editingToolId === id) setEditingToolId(null);
  };

  useEffect(() => {
    if (!scrollToSection) return;
    if (scrollToSection.section === "tools") {
      setToolsForceTrigger(scrollToSection.trigger);
      setTimeout(() => {
        setToolsOpen(true);
        toolsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else if (scrollToSection.section === "knowledge-sources") {
      setKnowledgeForceTrigger(scrollToSection.trigger);
      setTimeout(() => {
        setKnowledgeBaseOpen(true);
        knowledgeSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [scrollToSection?.trigger]);

  const model =
    node.model ?? (def.kind === "openai-app" ? "gpt-4o" : "claude-sonnet-4-6");
  const provider = getModelProvider(model);

  const [providerQuery, setProviderQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>(provider);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(model);

  // Keep local state in sync if the node's model changes externally (undo/redo).
  useEffect(() => {
    setSelectedModelId(model);
    setSelectedProvider(getModelProvider(model));
    // When model is set externally (e.g., undo), transition to config view
    if (isGenericAgent && node.model && view === "provider-select") setView("config");
    if (isGenericAgent && !node.model && view === "config") setView("provider-select");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.model]);

  // ── Provider selection view ────────────────────────────────────────────────
  if (view === "provider-select") {
    const filtered = AI_PROVIDERS.filter((p) =>
      p.label.toLowerCase().includes(pickerProviderQuery.toLowerCase())
    );
    return (
      <div className="bg-prune-lightGray min-h-full">
        {/* Use a template */}
        <div className="px-4 pt-4 pb-3 border-b">
          <button
            onClick={() => setView("template-picker")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-prune-borderGray bg-white text-[14px] font-[450] hover:bg-muted/30 transition-colors"
          >
            <Bot className="h-4 w-4 text-foreground/70" />
            Use a template
          </button>
        </div>

        {/* Provider list */}
        <div className="px-4 py-4">
          <p className="text-[15px] font-semibold mb-3">Select an AI provider</p>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={pickerProviderQuery}
              onChange={(e) => setPickerProviderQuery(e.target.value)}
              placeholder="Search for a provider"
              className="pl-8"
            />
          </div>
          <div className="space-y-1.5">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const first =
                    MODELS.find((m) => m.provider === p.id && !m.locked) ??
                    MODELS.find((m) => m.provider === p.id);
                  if (first) {
                    onUpdateModel(node.id, first.id);
                    setSelectedModelId(first.id);
                    setSelectedProvider(p.id);
                  }
                  setView("config");
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-prune-borderGray hover:border-gray-400 hover:shadow-sm transition-all text-left"
              >
                <div className="shrink-0">
                  <ProviderIcon id={p.id} size={32} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground">{p.label}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {PROVIDER_DESCRIPTIONS[p.id] ?? `AI provider for ${p.label}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Template picker view ───────────────────────────────────────────────────
  if (view === "template-picker") {
    return (
      <div className="bg-prune-lightGray min-h-full">
        {/* Header */}
        <div className="flex items-center gap-1 px-3 py-3 border-b bg-white">
          <button
            onClick={() => setView(node.model ? "config" : "provider-select")}
            className="flex items-center gap-1 text-[14px] font-medium text-foreground hover:text-muted-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Choose a template
          </button>
        </div>
        {/* Template cards */}
        <div className="p-3 space-y-2.5">
          {AGENT_TEMPLATES.map((t) => {
            const TIcon = t.icon;
            const active = activeTemplateId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onUpdateSystemPrompt(node.id, t.systemPrompt);
                  onUpdateValue(node.id, t.prompt);
                  setActiveTemplateId(t.id);
                  setView(node.model ? "config" : "provider-select");
                }}
                className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
                  active
                    ? "border-violet-300 bg-violet-50"
                    : "border-prune-borderGray bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="h-9 w-9 rounded-lg border bg-muted/50 flex items-center justify-center shrink-0">
                    <TIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-muted/50 border rounded-full text-muted-foreground">
                    {t.toolCount} tools
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-foreground">{t.name}</span>
                  {active && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{t.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-prune-lightGray">
      <div className="bg-prune-lightGray border-b ml-2">
        {/* AI Provider */}
        <div className="px-4 py-2 border-b">
          <SubLabel>AI Provider</SubLabel>
          <DropdownMenu
            modal={false}
            onOpenChange={(open) => {
              if (!open) setProviderQuery("");
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2.5 rounded-lg bg-white px-3 hover:bg-muted/30 hover:text-foreground"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ProviderIcon id={selectedProvider} size={18} />
                <span className="flex-1 text-left font-medium">
                  {AI_PROVIDERS.find((p) => p.id === selectedProvider)?.label ??
                    selectedProvider}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div
                className="px-2 py-1.5 border-b"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={providerQuery}
                    onChange={(e) => setProviderQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Search providers..."
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {AI_PROVIDERS.filter((p) =>
                  p.label.toLowerCase().includes(providerQuery.toLowerCase()),
                ).map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    className="gap-2.5 text-[14px] font-normal"
                    onSelect={() => {
                      setSelectedProvider(p.id);
                      const first =
                        MODELS.find((m) => m.provider === p.id && !m.locked) ??
                        MODELS.find((m) => m.provider === p.id);
                      const newModelId = first?.id ?? "";
                      setSelectedModelId(newModelId);
                      if (newModelId) onUpdateModel(node.id, newModelId);
                    }}
                  >
                    <span className="shrink-0">
                      <ProviderIcon id={p.id} size={18} />
                    </span>
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
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 rounded-lg bg-white px-3 hover:bg-muted/30 hover:text-foreground"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setModelPickerOpen(true); }}
          >
            <span className="shrink-0">
              <ProviderIcon
                id={
                  MODELS.find((m) => m.id === selectedModelId)?.provider ??
                  selectedProvider
                }
                size={16}
              />
            </span>
            <span className="flex-1 text-left font-medium">
              {MODELS.find((m) => m.id === selectedModelId)?.label ?? model}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
          </Button>
          <ModelPickerDialog
            open={modelPickerOpen}
            onOpenChange={setModelPickerOpen}
            selectedModelId={selectedModelId}
            onSelectModel={(id) => { setSelectedModelId(id); onUpdateModel(node.id, id); }}
            selectedProvider={selectedProvider}
          />
        </div>

        {/* Try agent templates */}
        <button
          onClick={() => setView("template-picker")}
          className="w-full flex justify-between items-center gap-2.5 px-4 py-3 mb-2 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-4 w-4 text-foreground/80 shrink-0" />
            <span className="text-[14px] font-medium text-foreground/80 shrink-0">
              Try our agent templates
            </span>
            {activeTemplateId ? (
              <span className="text-[11px] px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-semibold truncate">
                {AGENT_TEMPLATES.find((t) => t.id === activeTemplateId)?.name}
              </span>
            ) : (
              <span className="text-[12px] px-2 py-1 bg-blue-100 text-blue-600 rounded-lg font-semibold shrink-0">
                New
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Prompting */}
      <Section
        title="Prompting"
        icon={<AlignLeft className="h-3.5 w-3.5" />}
        defaultOpen
      >
        <div className="space-y-4 ml-2">
          <div className="mt-4">
            <SubLabel>Instructions</SubLabel>
            <p className="text-[11px] text-muted-foreground -mt-1 mb-2 leading-relaxed">
              System prompt — your AI&apos;s persona, scope, and persistent rules across all runs
            </p>
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
            <div className="flex items-center mb-1">
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
            <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
              User prompt — dynamic task instructions executed on each run
            </p>
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
      <div ref={knowledgeSectionRef}>
        <Section
          title="Knowledge Sources"
          icon={<Database className="h-4 w-4" />}
          forceOpenTrigger={knowledgeForceTrigger}
        >
          {(node.knowledgeBases ?? []).length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {allKbs
                .filter((kb) => (node.knowledgeBases ?? []).includes(kb.id))
                .map((kb) => (
                  <div
                    key={kb.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-prune-borderGray bg-background"
                  >
                    <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-[450] text-foreground truncate">
                        {kb.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {kb.document_count} {kb.document_count === 1 ? "file" : "files"}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const current = node.knowledgeBases ?? [];
                        onUpdateKnowledgeBases(
                          node.id,
                          current.filter((id) => id !== kb.id),
                        );
                      }}
                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="prune" className="w-full">
                <Plus className="h-4 w-4" />
                <span className="text-[14px] font-medium">
                  Add Knowledge Sources
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
            >
              <DropdownMenuItem
                className="items-start gap-3 py-2.5"
                onSelect={() => setKnowledgeBaseOpen(true)}
              >
                <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-foreground">
                    Add Knowledge Base
                  </div>
                  <div className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Index documents for fast retrieval and reuse across
                    workflows.
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="items-start gap-3 py-2.5"
                onSelect={() => setConnectedAppsOpen(true)}
              >
                <Search className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-foreground">
                    Search Connected Apps
                  </div>
                  <div className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Search apps like Gmail, Sheets, and Slack without importing
                    data.
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <KnowledgeBaseDialog
            open={knowledgeBaseOpen}
            onOpenChange={setKnowledgeBaseOpen}
            selectedIds={node.knowledgeBases ?? []}
            onToggle={(kbId) => {
              const current = node.knowledgeBases ?? [];
              onUpdateKnowledgeBases(
                node.id,
                current.includes(kbId)
                  ? current.filter((id) => id !== kbId)
                  : [...current, kbId],
              );
            }}
          />
          <ConnectedAppsDialog
            open={connectedAppsOpen}
            onOpenChange={setConnectedAppsOpen}
          />
        </Section>
      </div>

      <Separator />

      {/* Tools */}
      <div ref={toolsSectionRef}>
        <Section
          title="Tools"
          icon={<Wrench className="h-3.5 w-3.5" />}
          forceOpenTrigger={toolsForceTrigger}
        >
          <Button
            variant="prune"
            className="w-full"
            onClick={() => setToolsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="text-[14px] font-medium">Add tools</span>
          </Button>
          <ToolsPickerDialog open={toolsOpen} onOpenChange={setToolsOpen} />
        </Section>
      </div>

      {/* Subflow Tools */}
      <Section title="Subflow Tools" icon={<GitBranch className="h-3.5 w-3.5" />}>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Define tools this agent can call dynamically. Each tool runs a connected sub-workflow.
          The agent decides which tool to invoke based on the conversation context.
        </p>

        {subflowTools.length > 0 && (
          <div className="space-y-2 mb-3">
            {subflowTools.map((tool) => (
              <div key={tool.id} className="rounded-lg border bg-muted/20 overflow-hidden">
                {/* Tool header row */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <Cpu className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                  <span className="flex-1 text-[13px] font-medium text-foreground truncate">
                    {tool.name || "Unnamed Tool"}
                  </span>
                  <button
                    onClick={() => setEditingToolId(editingToolId === tool.id ? null : tool.id)}
                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <PencilLineIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeSubflowTool(tool.id)}
                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Inline edit form */}
                {editingToolId === tool.id && (
                  <div className="px-3 pb-3 space-y-2 border-t bg-background">
                    <div className="pt-2">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">Name</p>
                      <input
                        className="w-full text-[13px] px-2 py-1.5 rounded-md border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-violet-400"
                        value={tool.name}
                        onChange={(e) => updateSubflowTool(tool.id, { name: e.target.value })}
                        placeholder="e.g. Search Web"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">
                        Description <span className="font-normal">(tells the agent when to use it)</span>
                      </p>
                      <textarea
                        rows={2}
                        className="w-full text-[13px] px-2 py-1.5 rounded-md border bg-muted/30 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
                        value={tool.description}
                        onChange={(e) => updateSubflowTool(tool.id, { description: e.target.value })}
                        placeholder="e.g. Search the web for current information"
                      />
                    </div>
                    {/* Variable reference */}
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">Input variable in sub-workflow</p>
                      <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-900 rounded-md text-[11px] font-mono text-emerald-400">
                        <Cpu className="h-3 w-3 shrink-0 text-gray-400" />
                        {identifier}.subflow_tool_input
                      </div>
                    </div>
                  </div>
                )}

                {/* Description preview when collapsed */}
                {editingToolId !== tool.id && tool.description && (
                  <p className="px-3 pb-2 text-[11px] text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <Button variant="prune" className="w-full" onClick={addSubflowTool}>
          <Plus className="h-4 w-4" />
          <span className="text-[14px] font-medium">Add Subflow Tool</span>
        </Button>

        {subflowTools.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Connect a <span className="font-medium text-foreground">Subflow Tool</span> node to this agent on the canvas to wire each tool to its sub-workflow.
          </p>
        )}
      </Section>

      <Separator />

      {/* Main Settings */}
      <Section title="Main Settings" icon={<Settings2 className="h-4 w-4" />}>
        <div className="space-y-4 ml-2">
          {/* Memory */}
          <div className="border-b last:border-b-0 bg-white">
            <div className="w-full flex items-center gap-2.5 py-3">
              <RefreshCw className="h-3.5 w-3.5 text-prune-commonGray shrink-0" />
              <span className="text-left text-[15px] font-medium text-gray-800 flex-1">
                Memory
              </span>
              <Toggle checked={memoryEnabled} onChange={setMemoryEnabled} />
            </div>

            {memoryEnabled && (
              <div className="pb-4 space-y-4">
                {/* Memory type select */}
                <DropdownMenu
                  onOpenChange={(open) => {
                    if (!open) setHoveredMemoryType(null);
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-prune-lightGray transition-colors">
                      {MEMORY_TYPES.find((t) => t.id === memoryType)?.icon}
                      <span className="flex-1 text-left">
                        {MEMORY_TYPES.find((t) => t.id === memoryType)?.label}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 font-medium text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    style={{
                      width: "var(--radix-dropdown-menu-trigger-width)",
                    }}
                  >
                    {/* Hover tooltip card — fixed to the left of the panel */}
                    {hoveredMemoryType &&
                      (() => {
                        const t = MEMORY_TYPES.find(
                          (x) => x.id === hoveredMemoryType,
                        );
                        return t ? (
                          <div
                            className="fixed z-[200] w-96 rounded-xl border bg-white shadow-xl p-4"
                            style={{
                              right: "calc(var(--panel-width, 320px) - 36px)",
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {t.icon}
                              <span className="text-base font-medium text-foreground">
                                {t.label}
                              </span>
                            </div>
                            <p className="text-[14px] font-medium text-muted-foreground leading-relaxed">
                              {t.description}
                            </p>
                          </div>
                        ) : null;
                      })()}

                    {MEMORY_TYPES.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        className="gap-2 text-[14px] font-medium text-foreground/90"
                        onMouseEnter={() => setHoveredMemoryType(t.id)}
                        onMouseLeave={() => setHoveredMemoryType(null)}
                        onSelect={() => setMemoryType(t.id)}
                      >
                        {t.icon}
                        <span className="flex-1">{t.label}</span>
                        {t.id === memoryType && (
                          <Check className="h-4 w-4 text-foreground" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Window Size — only for sliding window types */}
                {memoryType !== "vector-database" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-medium text-gray-800 underline decoration-dashed underline-offset-4">
                        Window Size
                      </span>
                      <span className="text-sm font-medium tabular-nums">
                        {windowSize}
                      </span>
                    </div>
                    <Slider
                      value={windowSize}
                      min={1}
                      max={20}
                      onChange={setWindowSize}
                    />
                  </div>
                )}

                {/* Source of User Messages */}
                {/* <div>
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
            </div> */}
              </div>
            )}
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
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] font-medium text-gray-80 underline decoration-dashed underline-offset-4 mb-2">
                Response format
              </span>
              <ButtonGroup
                options={[
                  { value: "text", label: "Text" },
                  { value: "json", label: "JSON" },
                ]}
                value={responseFormat}
                onChange={(v) => setResponseFormat(v as "text" | "json")}
              />
            </div>
            {responseFormat === "json" && (
              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  JSON Schema <span className="font-normal">(optional — leave blank to let the AI decide)</span>
                </p>
                <textarea
                  rows={4}
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  placeholder={'{\n  "type": "object",\n  "properties": {\n    "answer": { "type": "string" }\n  }\n}'}
                  className="w-full text-[12px] font-mono px-2.5 py-2 rounded-md border bg-muted/30 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  The AI will return valid JSON matching this schema on every run.
                </p>
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">
              Use your own credentials
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 border rounded-md text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
              <span className="flex-1 text-left">Select a connection</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Your credentials are encrypted and can be removed at any time. You
              can manage all your connections here.
            </p>
          </div>
        </div>
      </Section>

      {/* Advanced Settings */}
      <Section
        title="Advanced Settings"
        icon={<Rocket className="h-3.5 w-3.5" />}
      >
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
              <span className="text-xs font-medium tabular-nums">
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={temperature}
              min={0}
              max={1}
              step={0.1}
              onChange={setTemperature}
            />
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
