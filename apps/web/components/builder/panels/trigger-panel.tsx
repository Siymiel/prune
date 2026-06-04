"use client";

import { useState } from "react";
import {
  Clock,
  Link2,
  MessageSquare,
  Puzzle,
  Search,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type CanvasNode } from "@/lib/editor-nodes";
import { FieldLabel, Section } from "./panel-ui";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";

// ── Trigger types ────────────────────────────────────────────────────────────

type TriggerType = NonNullable<CanvasNode["triggerType"]>;

const TRIGGER_TYPES: Array<{
  id: TriggerType;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    id: "manual",
    label: "Manual",
    icon: MessageSquare,
    description: "API call or chat interface",
  },
  {
    id: "scheduled",
    label: "Scheduled",
    icon: Clock,
    description: "Runs on a time schedule",
  },
  {
    id: "webhook",
    label: "Webhook",
    icon: Link2,
    description: "Triggered by HTTP POST",
  },
  {
    id: "integration",
    label: "Integration",
    icon: Puzzle,
    description: "Triggered by an app event",
  },
];

// ── Schedule presets ─────────────────────────────────────────────────────────

const SCHEDULE_PRESETS = [
  { label: "Hourly",  cron: "0 * * * *"   },
  { label: "Daily",   cron: "0 9 * * *"   },
  { label: "Weekly",  cron: "0 9 * * 1"   },
  { label: "Monthly", cron: "0 9 1 * *"   },
];

// ── Integration providers ────────────────────────────────────────────────────

type TriggerProvider =
  | { id: string; name: string; description: string; integrationId: "google-drive" | "gmail" }
  | { id: string; name: string; description: string; iconBg: string; letter: string };

const TRIGGER_PROVIDERS: TriggerProvider[] = [
  { id: "airtable",        name: "Airtable",         description: "New or updated record in a base",                   iconBg: "bg-amber-400",   letter: "A" },
  { id: "asana",           name: "Asana",            description: "New task or project event",                          iconBg: "bg-red-400",     letter: "A" },
  { id: "docusign",        name: "DocuSign",         description: "Envelope signed or status changed",                  iconBg: "bg-indigo-700",  letter: "D" },
  { id: "framer",          name: "Framer",           description: "Form submission from a Framer project",              iconBg: "bg-blue-600",    letter: "F" },
  { id: "google-drive",    name: "Google Drive",     description: "New file added or modified",                         integrationId: "google-drive" },
  { id: "github",          name: "Github",           description: "Push, PR, or issue event",                           iconBg: "bg-gray-900",    letter: "G" },
  { id: "gmail",           name: "Gmail",            description: "New email received matching filters",                 integrationId: "gmail"       },
  { id: "google-sheets",   name: "Google Sheets",   description: "New row or cell change in a spreadsheet",            iconBg: "bg-green-500",   letter: "S" },
  { id: "microsoft-teams", name: "Microsoft Teams", description: "New message or channel event",                        iconBg: "bg-purple-600",  letter: "T" },
  { id: "stripe",          name: "Stripe",           description: "Payment, refund, or subscription event",             iconBg: "bg-violet-600",  letter: "S" },
  { id: "typeform",        name: "Typeform",         description: "Form response submitted",                            iconBg: "bg-orange-500",  letter: "T" },
  { id: "zendesk",         name: "Zendesk",          description: "New ticket created or updated",                      iconBg: "bg-green-600",   letter: "Z" },
];

// ── Provider icon helper ─────────────────────────────────────────────────────

function ProviderIcon({ provider, size = 18 }: { provider: TriggerProvider; size?: number }) {
  if ("integrationId" in provider) {
    return (
      <div className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center shrink-0">
        {renderIntegrationIcon(provider.integrationId, size)}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold",
        provider.iconBg,
      )}
    >
      {provider.letter}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function TriggerPanelSections({
  node,
  onUpdateNode,
}: {
  node: CanvasNode;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
}) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const triggerType: TriggerType = node.triggerType ?? "manual";
  const scheduleCron = node.triggerScheduleCron ?? "";
  const sampleInput = node.triggerSampleInput ?? "";
  const selectedIntegrationId = node.triggerIntegrationId ?? "";

  function update(fields: Partial<CanvasNode>) {
    onUpdateNode?.(node.id, fields);
  }

  const isCustomCron =
    !!scheduleCron && !SCHEDULE_PRESETS.some((p) => p.cron === scheduleCron);

  const filteredProviders = TRIGGER_PROVIDERS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  function copyWebhookSnippet() {
    const snippet = JSON.stringify(
      { workflow_id: node.id, inputs: { payload: { key: "value" } } },
      null,
      2,
    );
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      {/* ── Type selector ─────────────────────────────────────────── */}
      <Section
        title="Trigger Type"
        icon={<Zap className="h-3.5 w-3.5" />}
        defaultOpen
      >
        <div className="grid grid-cols-2 gap-1.5">
          {TRIGGER_TYPES.map(({ id, label, icon: TIcon, description }) => {
            const active = triggerType === id;
            return (
              <button
                key={id}
                onClick={() => update({ triggerType: id })}
                className={cn(
                  "flex flex-col items-start gap-1 px-3 py-2.5 rounded-lg border text-left transition-colors",
                  active
                    ? "border-gray-800 bg-gray-900"
                    : "border-prune-borderGray bg-prune-lightGray/40 hover:bg-muted/20",
                )}
              >
                <TIcon
                  className={cn(
                    "h-3.5 w-3.5",
                    active ? "text-amber-400" : "text-amber-500",
                  )}
                />
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    active ? "text-white" : "text-foreground",
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-relaxed",
                    active ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Manual config ─────────────────────────────────────────── */}
      {triggerType === "manual" && (
        <Section
          title="Sample Input"
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
            This workflow runs when triggered via the API, a chat interface, or
            another workflow. Provide a sample message to use during testing.
          </p>
          <FieldLabel>Sample Message</FieldLabel>
          <textarea
            className="w-full px-2.5 py-2 text-[13px] bg-background border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50 resize-none"
            rows={3}
            placeholder="e.g. What is the weather today?"
            value={sampleInput}
            onChange={(e) => update({ triggerSampleInput: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Available downstream as{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
              {"{{state.message}}"}
            </code>
          </p>
        </Section>
      )}

      {/* ── Scheduled config ──────────────────────────────────────── */}
      {triggerType === "scheduled" && (
        <Section
          title="Schedule"
          icon={<Clock className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
            The workflow will run automatically on the configured schedule.
            Publishing the workflow activates the schedule.
          </p>

          {/* Preset buttons */}
          <FieldLabel>Interval</FieldLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SCHEDULE_PRESETS.map((p) => (
              <button
                key={p.cron}
                onClick={() => update({ triggerScheduleCron: p.cron })}
                className={cn(
                  "px-3 py-1.5 rounded-md border text-[12px] font-medium transition-colors",
                  scheduleCron === p.cron
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-prune-borderGray text-foreground hover:bg-muted/30",
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => {
                if (!isCustomCron) update({ triggerScheduleCron: "0 0 * * *" });
              }}
              className={cn(
                "px-3 py-1.5 rounded-md border text-[12px] font-medium transition-colors",
                isCustomCron
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-prune-borderGray text-foreground hover:bg-muted/30",
              )}
            >
              Custom
            </button>
          </div>

          {/* Cron expression */}
          <FieldLabel>Cron Expression</FieldLabel>
          <input
            type="text"
            className="w-full px-2.5 py-2 text-[13px] font-mono bg-background border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
            placeholder="0 9 * * *"
            value={scheduleCron}
            onChange={(e) => update({ triggerScheduleCron: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            5-field cron: minute hour day month weekday (UTC)
          </p>

          {/* Available downstream */}
          <p className="text-[11px] text-muted-foreground mt-3">
            Available downstream as{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
              {"{{state.triggered_at}}"}
            </code>
          </p>
        </Section>
      )}

      {/* ── Webhook config ────────────────────────────────────────── */}
      {triggerType === "webhook" && (
        <Section
          title="Webhook"
          icon={<Link2 className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
            Send a{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
              POST
            </code>{" "}
            request to the runs endpoint with your workflow ID. The request body
            is available downstream as{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
              {"{{state.payload}}"}
            </code>
            .
          </p>

          <FieldLabel>Endpoint</FieldLabel>
          <div className="flex items-center gap-2 px-2.5 py-2 bg-muted/40 border border-prune-borderGray rounded-md mb-3">
            <span className="text-[10px] font-mono text-muted-foreground flex-1 truncate">
              POST /v1/runs
            </span>
          </div>

          <FieldLabel>Example Payload</FieldLabel>
          <div className="relative">
            <pre className="text-[10px] font-mono bg-muted/40 border border-prune-borderGray rounded-md p-3 leading-relaxed overflow-x-auto">
              {`{\n  "workflow_id": "${node.id}",\n  "inputs": {\n    "payload": { "key": "value" }\n  }\n}`}
            </pre>
            <button
              onClick={copyWebhookSnippet}
              className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Copy payload"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </Section>
      )}

      {/* ── Integration picker ────────────────────────────────────── */}
      {triggerType === "integration" && (
        <Section
          title="Integration"
          icon={<Puzzle className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-background border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
              placeholder="Search providers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            {filteredProviders.map((provider) => {
              const selected = selectedIntegrationId === provider.id;
              return (
                <button
                  key={provider.id}
                  onClick={() =>
                    update({
                      triggerIntegrationId: provider.id,
                      triggerIntegrationEvent: "",
                    })
                  }
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
                    selected
                      ? "border-gray-800 bg-gray-50"
                      : "border-transparent hover:border-prune-borderGray hover:bg-muted/30",
                  )}
                >
                  <ProviderIcon provider={provider} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-foreground">
                      {provider.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {provider.description}
                    </div>
                  </div>
                  {selected && (
                    <Check className="h-3.5 w-3.5 text-gray-800 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedIntegrationId && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Event data available downstream as{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
                {"{{state.event}}"}
              </code>
            </p>
          )}
        </Section>
      )}
    </>
  );
}
