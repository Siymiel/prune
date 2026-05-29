"use client";

import { useState } from "react";
import { Search, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import { cn } from "@/lib/utils";

// ── Provider metadata ──────────────────────────────────────────────────────

export const PROVIDER_COLORS: Record<string, string> = {
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

export const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  meta: "Meta",
  mistral: "Mistral",
  xai: "XAI",
  perplexity: "Perplexity",
  togetherai: "TogetherAI",
  cerebras: "Cerebras",
};

export function ProviderIcon({ id, size = 16 }: { id: string; size?: number }) {
  const icon = renderIntegrationIcon(id as any, size);
  if (icon) return <>{icon}</>;
  const label = PROVIDER_LABELS[id] ?? id;
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
      {label[0].toUpperCase()}
    </span>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type BadgeColor = "blue" | "pink" | "green";

interface ModelBadgeInfo {
  text: string;
  color: BadgeColor;
}

interface ModelInfo {
  id: string;
  provider: string;
  label: string;
  description: string;
  badge?: ModelBadgeInfo;
  locked?: boolean;
  reasoning: number;
  speed: number;
  context: { bars: number; label: string };
  date: string;
  whenToUse: string[];
}

// ── Model catalog ──────────────────────────────────────────────────────────

export const MODELS: ModelInfo[] = [
  // ── OpenAI ────────────────────────────────────────────────────────────────
  {
    id: "gpt-5.5",
    provider: "openai",
    label: "GPT-5.5",
    description:
      "Faster, sharper frontier reasoning model. Successor to GPT-5.4 with stronger coding and reasoning benchmarks at GPT-5.4 response speeds.",
    badge: { text: "New - Smartest", color: "blue" },
    reasoning: 3,
    speed: 3,
    context: { bars: 3, label: "~513 pages (1M tokens)" },
    date: "April 23, 2026",
    whenToUse: [
      "Building AI assistants that handle complex, open-ended questions",
      "Summarising or analysing very long reports and documents",
      "Generating polished written content — proposals, emails, briefs",
      "Workflows where getting the right answer first time is critical",
    ],
  },
  {
    id: "gpt-5.4",
    provider: "openai",
    label: "GPT-5.4",
    description:
      "Most capable and efficient frontier model for professional work.",
    badge: { text: "Most Capable All-Rounder", color: "pink" },
    locked: true,
    reasoning: 3,
    speed: 3,
    context: { bars: 3, label: "~513 pages (1M tokens)" },
    date: "March 5, 2026",
    whenToUse: [
      "Complex multi-step reasoning and planning tasks",
      "Large-scale document analysis and comparison",
      "Enterprise-grade data analysis workflows",
      "Advanced code generation and review",
    ],
  },
  {
    id: "gpt-5.4-pro",
    provider: "openai",
    label: "GPT-5.4 Pro",
    description:
      "Cutting-edge performance for demanding professional and enterprise workflows.",
    badge: { text: "New - Smartest Pro", color: "pink" },
    locked: true,
    reasoning: 3,
    speed: 2,
    context: { bars: 3, label: "~513 pages (1M tokens)" },
    date: "March 5, 2026",
    whenToUse: [
      "Generating detailed technical documentation",
      "Advanced code generation and review",
      "Enterprise-grade multi-document workflows",
      "Complex multi-step reasoning and planning",
    ],
  },
  {
    id: "gpt-5.4-mini",
    provider: "openai",
    label: "GPT-5.4 Mini",
    description:
      "Fast, affordable model for everyday tasks without compromising quality.",
    badge: { text: "New - Faster", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~200 pages (400K tokens)" },
    date: "March 5, 2026",
    whenToUse: [
      "High-volume, cost-sensitive workflows",
      "Quick Q&A and summarisation tasks",
      "Customer support automations",
      "Lightweight document processing",
    ],
  },
  {
    id: "gpt-5.4-nano",
    provider: "openai",
    label: "GPT-5.4 Nano",
    description:
      "Lightest and fastest model, optimised for real-time applications and edge deployments.",
    badge: { text: "New - Fastest", color: "green" },
    reasoning: 1,
    speed: 3,
    context: { bars: 1, label: "~100 pages (200K tokens)" },
    date: "March 5, 2026",
    whenToUse: [
      "Real-time chat and voice applications",
      "Low-latency classification and routing",
      "Embedded or edge AI deployments",
      "Simple extraction and transformation tasks",
    ],
  },
  {
    id: "gpt-5.3",
    provider: "openai",
    label: "GPT-5.3",
    description:
      "Highly capable previous-generation model with balanced performance and cost.",
    badge: { text: "New", color: "green" },
    locked: true,
    reasoning: 2,
    speed: 2,
    context: { bars: 2, label: "~256 pages (512K tokens)" },
    date: "January 20, 2026",
    whenToUse: [
      "General-purpose assistants and chatbots",
      "Content generation and editing",
      "Research and information retrieval",
      "Standard enterprise automation tasks",
    ],
  },
  {
    id: "gpt-5.2",
    provider: "openai",
    label: "GPT-5.2",
    description: "Stable and reliable model for production environments.",
    locked: true,
    reasoning: 2,
    speed: 2,
    context: { bars: 2, label: "~128 pages (256K tokens)" },
    date: "October 15, 2025",
    whenToUse: [
      "Long-running production pipelines",
      "Batch processing and data enrichment",
      "API integrations requiring consistent output",
      "Regulated environments where stability is key",
    ],
  },
  {
    id: "gpt-5.2-pro",
    provider: "openai",
    label: "GPT-5.2 Pro",
    description:
      "Extended-context version of GPT-5.2 for large document workflows.",
    locked: true,
    reasoning: 2,
    speed: 2,
    context: { bars: 3, label: "~513 pages (1M tokens)" },
    date: "October 15, 2025",
    whenToUse: [
      "Contract and legal document analysis",
      "Large codebase review and refactoring",
      "Multi-document synthesis and comparison",
      "Long-form research report generation",
    ],
  },
  {
    id: "gpt-5.1",
    provider: "openai",
    label: "GPT-5.1",
    description: "Earlier stable release, suitable for legacy integrations.",
    locked: true,
    reasoning: 1,
    speed: 2,
    context: { bars: 1, label: "~64 pages (128K tokens)" },
    date: "July 10, 2025",
    whenToUse: [
      "Maintaining backward compatibility",
      "Lower-cost, lower-stakes automations",
      "Simple classification and labelling tasks",
      "Legacy system integrations",
    ],
  },

  // ── Anthropic ─────────────────────────────────────────────────────────────
  {
    id: "claude-opus-4-7",
    provider: "anthropic",
    label: "Claude Opus 4.7",
    description:
      "Anthropic's most powerful model — exceptional at complex reasoning, nuanced writing, and agentic tasks requiring long multi-step chains.",
    badge: { text: "Most Powerful", color: "blue" },
    reasoning: 3,
    speed: 2,
    context: { bars: 3, label: "~102 pages (200K tokens)" },
    date: "May 12, 2026",
    whenToUse: [
      "Complex agentic workflows with many decision points",
      "Nuanced long-form writing and editing",
      "Deep research synthesis across large documents",
      "Tasks where accuracy outweighs speed",
    ],
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    label: "Claude Sonnet 4.6",
    description:
      "The ideal balance of intelligence and speed. Excellent at coding, analysis, and multi-turn conversations at a fraction of Opus cost.",
    badge: { text: "Best Value", color: "blue" },
    reasoning: 3,
    speed: 3,
    context: { bars: 3, label: "~102 pages (200K tokens)" },
    date: "March 1, 2026",
    whenToUse: [
      "Coding assistance and code review",
      "Multi-turn customer-facing conversations",
      "Data analysis and structured outputs",
      "Balancing capability with throughput",
    ],
  },
  {
    id: "claude-haiku-4-5",
    provider: "anthropic",
    label: "Claude Haiku 4.5",
    description:
      "Fastest and most compact Claude model, designed for near-instant responses in high-throughput production workloads.",
    badge: { text: "Fastest", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~51 pages (100K tokens)" },
    date: "February 10, 2026",
    whenToUse: [
      "Real-time chat interfaces and voice bots",
      "Lightweight classification and tagging",
      "High-volume document extraction",
      "Cost-optimised automation pipelines",
    ],
  },
  {
    id: "claude-opus-4",
    provider: "anthropic",
    label: "Claude Opus 4",
    description:
      "Previous-generation flagship with strong reasoning capabilities.",
    locked: true,
    reasoning: 3,
    speed: 2,
    context: { bars: 2, label: "~102 pages (200K tokens)" },
    date: "November 3, 2025",
    whenToUse: [
      "Legacy workflows requiring Opus 4 parity",
      "Regulated environments with pinned model versions",
      "High-complexity tasks with generous latency budgets",
      "Fallback option during Opus 4.7 capacity limits",
    ],
  },
  {
    id: "claude-sonnet-4",
    provider: "anthropic",
    label: "Claude Sonnet 4",
    description: "Previous-generation balanced model with proven reliability.",
    locked: true,
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~102 pages (200K tokens)" },
    date: "September 18, 2025",
    whenToUse: [
      "Production systems with Sonnet 4 version locks",
      "Stable output quality in regulated pipelines",
      "Rollback target during Sonnet 4.6 incidents",
      "Cost-sensitive workloads with moderate complexity",
    ],
  },
  {
    id: "claude-haiku-4",
    provider: "anthropic",
    label: "Claude Haiku 4",
    description:
      "Previous-generation fast model for lightweight production tasks.",
    locked: true,
    reasoning: 1,
    speed: 3,
    context: { bars: 1, label: "~51 pages (100K tokens)" },
    date: "August 5, 2025",
    whenToUse: [
      "Legacy high-throughput classification jobs",
      "Version-pinned real-time chat deployments",
      "Fallback when Haiku 4.5 is unavailable",
      "Simple routing and intent detection tasks",
    ],
  },

  // ── Google ────────────────────────────────────────────────────────────────
  {
    id: "gemini-2.5-pro",
    provider: "google",
    label: "Gemini 2.5 Pro",
    description:
      "Google's most capable model for highly complex tasks, with state-of-the-art multimodal reasoning across text, code, images, audio, and video.",
    badge: { text: "Most Capable", color: "blue" },
    reasoning: 3,
    speed: 2,
    context: { bars: 3, label: "~513 pages (1M tokens)" },
    date: "March 25, 2026",
    whenToUse: [
      "Complex multimodal analysis (images, video, documents)",
      "Advanced scientific and mathematical reasoning",
      "Long-context document synthesis and Q&A",
      "State-of-the-art coding and debugging tasks",
    ],
  },
  {
    id: "gemini-2.5-flash",
    provider: "google",
    label: "Gemini 2.5 Flash",
    description:
      "Best balance of quality, speed, and cost with adaptive thinking for a wide range of production use cases.",
    badge: { text: "Balanced", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 3, label: "~513 pages (1M tokens)" },
    date: "March 25, 2026",
    whenToUse: [
      "High-throughput production workloads",
      "Multimodal summarisation and extraction",
      "Customer-facing chatbots and assistants",
      "Cost-efficient reasoning at scale",
    ],
  },
  {
    id: "gemini-2.5-flash-lite",
    provider: "google",
    label: "Gemini 2.5 Flash-Lite",
    description:
      "Lightest and most cost-efficient Gemini model, optimised for latency-sensitive real-time applications.",
    badge: { text: "Fastest", color: "green" },
    reasoning: 1,
    speed: 3,
    context: { bars: 2, label: "~256 pages (500K tokens)" },
    date: "April 1, 2026",
    whenToUse: [
      "Real-time voice and chat interfaces",
      "Simple classification and tagging at scale",
      "Edge or on-device inference scenarios",
      "Budget-optimised high-volume pipelines",
    ],
  },
  {
    id: "gemini-2.0-pro",
    provider: "google",
    label: "Gemini 2.0 Pro",
    description:
      "Previous-generation pro model with strong multimodal capabilities.",
    locked: true,
    reasoning: 2,
    speed: 2,
    context: { bars: 3, label: "~513 pages (1M tokens)" },
    date: "December 10, 2025",
    whenToUse: [
      "Version-pinned production environments",
      "Long-context document workflows on 2.0 API",
      "Fallback when 2.5 Pro capacity is constrained",
      "Regulated deployments with frozen model versions",
    ],
  },
  {
    id: "gemini-2.0-flash",
    provider: "google",
    label: "Gemini 2.0 Flash",
    description: "Previous-generation fast model with reliable performance.",
    locked: true,
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~256 pages (500K tokens)" },
    date: "December 10, 2025",
    whenToUse: [
      "Legacy high-throughput 2.0-based deployments",
      "Stable version-pinned chatbot integrations",
      "Cost-controlled workloads on 2.0 tier",
      "Rollback target for 2.5 Flash incidents",
    ],
  },

  // ── Meta ──────────────────────────────────────────────────────────────────
  {
    id: "llama-4-maverick",
    provider: "meta",
    label: "Llama 4 Maverick",
    description:
      "Meta's most capable open model — a powerful mixture-of-experts architecture excelling at text, code, and multimodal tasks.",
    badge: { text: "Most Capable", color: "blue" },
    reasoning: 3,
    speed: 2,
    context: { bars: 2, label: "~512K tokens" },
    date: "April 5, 2026",
    whenToUse: [
      "Complex reasoning and long-form generation",
      "Multimodal document and image analysis",
      "Advanced coding and debugging workflows",
      "Enterprise self-hosted AI deployments",
    ],
  },
  {
    id: "llama-4-scout",
    provider: "meta",
    label: "Llama 4 Scout",
    description:
      "Efficient MoE model with an industry-leading 10M token context window, ideal for ingesting and reasoning over massive corpora.",
    badge: { text: "New", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 3, label: "~20K pages (10M tokens)" },
    date: "April 5, 2026",
    whenToUse: [
      "Ultra-long context document ingestion",
      "Entire codebase analysis in a single call",
      "Large knowledge base summarisation",
      "Multi-document cross-referencing at scale",
    ],
  },
  {
    id: "llama-3.3-70b",
    provider: "meta",
    label: "Llama 3.3 70B",
    description:
      "Highly capable text-only model with strong instruction-following and reasoning.",
    locked: true,
    reasoning: 2,
    speed: 2,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "December 6, 2024",
    whenToUse: [
      "Cost-effective high-quality text generation",
      "Self-hosted open model deployments",
      "Instruction-following and summarisation",
      "Fine-tuning base for domain-specific models",
    ],
  },
  {
    id: "llama-3.1-405b",
    provider: "meta",
    label: "Llama 3.1 405B",
    description:
      "Largest open-weights model in the Llama 3.1 family, matching frontier closed models.",
    locked: true,
    reasoning: 3,
    speed: 1,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "July 23, 2024",
    whenToUse: [
      "Research requiring open-weight frontier models",
      "Sensitive data workflows needing self-hosted scale",
      "Base model for large-scale fine-tuning",
      "Benchmarking against closed-source models",
    ],
  },

  // ── Mistral ───────────────────────────────────────────────────────────────
  {
    id: "mistral-large-2",
    provider: "mistral",
    label: "Mistral Large 2",
    description:
      "Top-tier reasoning and instruction-following model with strong multilingual support across 80+ languages and advanced function calling.",
    badge: { text: "Most Capable", color: "blue" },
    reasoning: 3,
    speed: 2,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "July 24, 2024",
    whenToUse: [
      "Complex multilingual workflows",
      "Advanced function calling and tool use",
      "Nuanced reasoning and instruction following",
      "Enterprise-grade agentic deployments",
    ],
  },
  {
    id: "mistral-small-3.1",
    provider: "mistral",
    label: "Mistral Small 3.1",
    description:
      "Compact vision-capable model with best-in-class performance per compute dollar, supporting text and image inputs.",
    badge: { text: "New", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "March 20, 2026",
    whenToUse: [
      "Cost-optimised multimodal pipelines",
      "On-premise or edge LLM deployments",
      "High-throughput text and image classification",
      "Low-latency customer service applications",
    ],
  },
  {
    id: "codestral",
    provider: "mistral",
    label: "Codestral",
    description:
      "State-of-the-art model purpose-built for code generation, completion, and explanation.",
    locked: true,
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "May 29, 2024",
    whenToUse: [
      "Inline code completion in IDEs",
      "Automated code generation and refactoring",
      "Unit test generation",
      "Explaining legacy codebases",
    ],
  },
  {
    id: "mixtral-8x22b",
    provider: "mistral",
    label: "Mixtral 8×22B",
    description:
      "High-quality sparse mixture-of-experts model balancing performance and efficiency.",
    locked: true,
    reasoning: 2,
    speed: 2,
    context: { bars: 2, label: "~32 pages (64K tokens)" },
    date: "April 17, 2024",
    whenToUse: [
      "Self-hosted deployments requiring MoE efficiency",
      "Multilingual text generation and translation",
      "Balanced throughput for production APIs",
      "Fine-tuning base for domain-specific tasks",
    ],
  },

  // ── XAI ───────────────────────────────────────────────────────────────────
  {
    id: "grok-3",
    provider: "xai",
    label: "Grok-3",
    description:
      "xAI's most intelligent model — exceptional at math, science, and coding, with real-time X (Twitter) data access and deep-search capabilities.",
    badge: { text: "Most Capable", color: "blue" },
    reasoning: 3,
    speed: 2,
    context: { bars: 2, label: "~64 pages (131K tokens)" },
    date: "February 18, 2026",
    whenToUse: [
      "Advanced math and scientific reasoning",
      "Cutting-edge coding and algorithmic tasks",
      "Real-time information retrieval via X data",
      "Deep research across internet and knowledge sources",
    ],
  },
  {
    id: "grok-3-mini",
    provider: "xai",
    label: "Grok-3 Mini",
    description:
      "Fast and affordable reasoning model that excels at logic and quantitative tasks with transparent thinking.",
    badge: { text: "Fast", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~64 pages (131K tokens)" },
    date: "February 18, 2026",
    whenToUse: [
      "High-volume logical reasoning tasks",
      "Cost-efficient math and code workflows",
      "Structured data extraction and analysis",
      "Transparent chain-of-thought applications",
    ],
  },
  {
    id: "grok-2",
    provider: "xai",
    label: "Grok-2",
    description:
      "Previous-generation model with solid reasoning and language capabilities.",
    locked: true,
    reasoning: 2,
    speed: 2,
    context: { bars: 2, label: "~64 pages (131K tokens)" },
    date: "August 13, 2024",
    whenToUse: [
      "Version-pinned Grok-2 production deployments",
      "Cost-controlled workflows on the Grok-2 tier",
      "Rollback target during Grok-3 incidents",
      "Legacy integrations using Grok-2 prompts",
    ],
  },

  // ── Perplexity ────────────────────────────────────────────────────────────
  {
    id: "sonar-pro",
    provider: "perplexity",
    label: "Sonar Pro",
    description:
      "Advanced search-grounded model for complex, multi-step research tasks with deep web access and citation-rich responses.",
    badge: { text: "Most Capable", color: "blue" },
    reasoning: 3,
    speed: 2,
    context: { bars: 2, label: "~64 pages (127K tokens)" },
    date: "January 21, 2026",
    whenToUse: [
      "Complex research requiring live web data",
      "Multi-step fact-finding with citations",
      "Competitive intelligence and market research",
      "Grounded Q&A over current events",
    ],
  },
  {
    id: "sonar",
    provider: "perplexity",
    label: "Sonar",
    description:
      "Fast and affordable search-grounded model for everyday Q&A with real-time web access.",
    badge: { text: "Balanced", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~64 pages (127K tokens)" },
    date: "January 21, 2026",
    whenToUse: [
      "Real-time Q&A with web grounding",
      "News summarisation and current-events queries",
      "Customer-facing search augmentation",
      "Lightweight fact-checking pipelines",
    ],
  },
  {
    id: "sonar-reasoning-pro",
    provider: "perplexity",
    label: "Sonar Reasoning Pro",
    description:
      "Combines chain-of-thought reasoning with live web search for the most thorough and accurate research responses.",
    badge: { text: "Deep Reasoning", color: "pink" },
    locked: true,
    reasoning: 3,
    speed: 1,
    context: { bars: 2, label: "~64 pages (127K tokens)" },
    date: "March 10, 2026",
    whenToUse: [
      "Academic research requiring exhaustive sourcing",
      "Compliance and regulatory fact-finding",
      "Complex multi-source synthesis tasks",
      "High-stakes grounded analysis workflows",
    ],
  },

  // ── TogetherAI ────────────────────────────────────────────────────────────
  {
    id: "together-deepseek-r1",
    provider: "togetherai",
    label: "DeepSeek-R1",
    description:
      "Advanced open-source reasoning model on a par with frontier closed models, served at scale via Together's inference platform.",
    badge: { text: "Best Reasoning", color: "blue" },
    reasoning: 3,
    speed: 2,
    context: { bars: 2, label: "~32 pages (64K tokens)" },
    date: "January 20, 2025",
    whenToUse: [
      "Complex mathematical and scientific reasoning",
      "Advanced coding and algorithmic problem-solving",
      "Open-source alternative to frontier reasoning models",
      "Cost-effective high-intelligence workloads",
    ],
  },
  {
    id: "together-llama-3.3-70b",
    provider: "togetherai",
    label: "Llama-3.3-70B Instruct",
    description:
      "Meta's top open model served on Together's high-throughput infrastructure for reliable, scalable production workloads.",
    badge: { text: "Recommended", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "December 6, 2024",
    whenToUse: [
      "Production open-model deployments",
      "Cost-effective instruction-following at scale",
      "Summarisation and content generation pipelines",
      "Safe, high-throughput enterprise workloads",
    ],
  },
  {
    id: "together-llama-3.1-405b",
    provider: "togetherai",
    label: "Llama-3.1-405B Instruct",
    description:
      "Largest open-weights Llama 3.1 model for maximum capability on Together infrastructure.",
    locked: true,
    reasoning: 3,
    speed: 1,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "July 23, 2024",
    whenToUse: [
      "Research-grade open-model performance",
      "Sensitive-data workflows requiring on-cloud open weights",
      "Frontier benchmarking with open-source models",
      "Base for domain-specific fine-tuning at scale",
    ],
  },

  // ── Cerebras ──────────────────────────────────────────────────────────────
  {
    id: "cerebras-llama-3.3-70b",
    provider: "cerebras",
    label: "Llama-3.3-70B",
    description:
      "Meta's Llama 3.3 70B running on Cerebras wafer-scale chips, delivering unprecedented inference speeds for demanding real-time applications.",
    badge: { text: "Ultra Fast", color: "green" },
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "December 10, 2024",
    whenToUse: [
      "Latency-critical real-time AI applications",
      "High-frequency interactive assistants",
      "Streaming inference at extreme speeds",
      "Throughput-maximised production pipelines",
    ],
  },
  {
    id: "cerebras-llama-3.1-8b",
    provider: "cerebras",
    label: "Llama-3.1-8B",
    description:
      "Compact Llama 3.1 model on Cerebras hardware — the fastest available small model for ultra-low latency classification and routing.",
    badge: { text: "Fastest", color: "green" },
    reasoning: 1,
    speed: 3,
    context: { bars: 1, label: "~64 pages (128K tokens)" },
    date: "September 3, 2024",
    whenToUse: [
      "Sub-100ms latency requirements",
      "Real-time intent detection and routing",
      "Lightweight extraction at massive scale",
      "Edge-like speed with cloud deployment",
    ],
  },
  {
    id: "cerebras-llama-3.1-70b",
    provider: "cerebras",
    label: "Llama-3.1-70B",
    description:
      "Previous-generation 70B model on Cerebras, still the fastest in its class.",
    locked: true,
    reasoning: 2,
    speed: 3,
    context: { bars: 2, label: "~64 pages (128K tokens)" },
    date: "September 3, 2024",
    whenToUse: [
      "Legacy Cerebras deployments on Llama 3.1",
      "Version-pinned ultra-fast production workflows",
      "Rollback during Llama 3.3 migration",
      "Cost-controlled high-throughput inference",
    ],
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────

const BADGE_CLS: Record<BadgeColor, string> = {
  blue: "bg-blue-100 text-blue-700/80",
  pink: "bg-pink-100 text-pink-700/80",
  green: "bg-green-100 text-green-700/80",
};

function ModelBadge({ badge }: { badge: ModelBadgeInfo }) {
  return (
    <span
      className={cn(
        "text-[12px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap shrink-0",
        BADGE_CLS[badge.color],
      )}
    >
      {badge.text}
    </span>
  );
}

function MetricBars({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-3 w-5 rounded-sm border",
            i < value ? "bg-prune-commonGray" : "bg-prune-lightGray",
          )}
        />
      ))}
    </div>
  );
}

function ModelDetailCard({ model }: { model: ModelInfo }) {
  const metrics = [
    {
      label: "Reasoning",
      value: <MetricBars value={model.reasoning} />,
    },
    {
      label: "Speed",
      value: <MetricBars value={model.speed} />,
    },
    {
      label: "Context",
      value: (
        <div className="flex items-center gap-1.5">
          <MetricBars value={model.context.bars} />
          <span className="text-muted-foreground text-[12px] font-medium">
            {model.context.label}
          </span>
        </div>
      ),
    },
    {
      label: "Date",
      value: model.date,
    },
  ];

  return (
    <div className="w-96 bg-background border font-inter rounded-xl shadow-xl p-4 space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="shrink-0">
            <ProviderIcon id={model.provider} size={20} />
          </span>
          <p className="text-[16px] text-foreground/70 font-medium">
            {PROVIDER_LABELS[model.provider] ?? model.provider} / <span className="text-foreground">{model.label}</span>
          </p>
        </div>
        <p className="text-[14px] font-medium text-foreground/60 mt-2">{model.description}</p>
        {model.badge && (
          <div className="mt-3 pb-4">
            <ModelBadge badge={model.badge} />
          </div>
        )}
      </div>

      <div className="border-t">
        {metrics.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-2 py-2.5 text-xs",
              index !== metrics.length - 1 && "border-b"
            )}
          >
            <span className="text-muted-foreground text-[14px] font-medium">
              {item.label}
            </span>

            <span className="ml-6 font-normal font-prune-spaceGray text-[12px]">{item.value}</span>
          </div>
        ))}
      </div>

      {model.whenToUse.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-[12px] font-semibold uppercase text-muted-foreground mb-3">
            When to use
          </p>
          <ul className="space-y-1.5">
            {model.whenToUse.map((item, i) => (
              <li key={i} className="flex items-center text-prune-commonGray font-medium gap-1.5 text-[13px]">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function ModelPickerDialog({
  open,
  onOpenChange,
  selectedModelId,
  onSelectModel,
  selectedProvider,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  selectedProvider: string;
}) {
  const [query, setQuery] = useState("");
  const [hoveredModel, setHoveredModel] = useState<ModelInfo | null>(null);

  const filtered = MODELS.filter(
    (m) =>
      m.provider === selectedProvider &&
      m.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setQuery("");
          setHoveredModel(null);
        }
      }}
    >
      <DialogContent
        hideCloseButton
        className="max-w-sm p-0"
        style={{
          right: "calc(var(--panel-width, 0px) + 8px)",
          left: "auto",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <DialogTitle className="sr-only">Select Model</DialogTitle>

        {/* Detail card — positioned to the left; near-transparent for locked models */}
        {hoveredModel && (
          <div
            className={cn(
              "absolute top-0",
              hoveredModel.locked && "opacity-[0.5]",
            )}
            style={{ right: "calc(100% + 8px)" }}
          >
            <ModelDetailCard model={hoveredModel} />
          </div>
        )}

        {/* Search */}
        <div className="px-2 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto py-1.5 px-2 font-inter">
          {filtered.map((model) => (
            <button
              key={model.id}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-left transition-colors hover:bg-prune-lightGray",
                model.id === selectedModelId && "bg-muted/30",
                model.locked && "opacity-40",
              )}
              onMouseEnter={() => setHoveredModel(model)}
              onMouseLeave={() => setHoveredModel(null)}
              onClick={() => {
                if (!model.locked) {
                  onSelectModel(model.id);
                  onOpenChange(false);
                }
              }}
            >
              <span className="shrink-0">
                <ProviderIcon id={model.provider} size={16} />
              </span>
              <div className="flex items-center gap-4">
                <span className="flex text-[15px] font-medium">{model.label}</span>
                  {model.badge && <ModelBadge badge={model.badge} />}
                  {model.locked && (
                    <span className="flex items-center text-[12px] font-medium gap-1 text-xs px-2 py-0.5 rounded-md text-foreground shrink-0 border">
                      <Lock className="h-3 w-3" />
                      Upgrade
                    </span>
                  )}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
