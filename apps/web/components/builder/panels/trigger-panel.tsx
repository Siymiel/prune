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
  ChevronRight,
  ArrowLeft,
  Filter,
  Play,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type CanvasNode } from "@/lib/editor-nodes";
import { FieldLabel, Section } from "./panel-ui";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";
import {
  TRIGGER_PROVIDERS,
  TRIGGER_CATEGORIES,
  findProvider,
  findEvent,
  type TriggerProviderDef,
  type TriggerCategory,
} from "@/lib/trigger-registry";

// ── Trigger types ────────────────────────────────────────────────────────────

type TriggerType = NonNullable<CanvasNode["triggerType"]>;

const TRIGGER_TYPES: Array<{
  id: TriggerType;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { id: "manual",      label: "Manual",      icon: MessageSquare, description: "API call or chat interface"    },
  { id: "scheduled",   label: "Scheduled",   icon: Clock,         description: "Runs on a time schedule"       },
  { id: "webhook",     label: "Webhook",     icon: Link2,         description: "Triggered by HTTP POST"        },
  { id: "integration", label: "Integration", icon: Puzzle,        description: "Triggered by an app event"     },
];

// ── Schedule presets ─────────────────────────────────────────────────────────

const SCHEDULE_PRESETS = [
  { label: "Hourly",  cron: "0 * * * *" },
  { label: "Daily",   cron: "0 9 * * *" },
  { label: "Weekly",  cron: "0 9 * * 1" },
  { label: "Monthly", cron: "0 9 1 * *" },
];

// ── Provider icon helper ─────────────────────────────────────────────────────

function ProviderIcon({ provider, size = 18 }: { provider: TriggerProviderDef; size?: number }) {
  if (provider.integrationId) {
    const icon = renderIntegrationIcon(provider.integrationId, size);
    if (icon) {
      return (
        <div className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center shrink-0">
          {icon}
        </div>
      );
    }
  }
  return (
    <div
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold",
        provider.letterBg ?? "bg-gray-700",
      )}
    >
      {provider.letter ?? provider.name[0]}
    </div>
  );
}

// ── Auth type badge ──────────────────────────────────────────────────────────

const AUTH_LABELS: Record<string, string> = {
  oauth:           "OAuth",
  api_key:         "API Key",
  webhook:         "Webhook",
  service_account: "Service Account",
};

// ── Integration view — provider list + event picker + filters ────────────────

type IntegrationView = "providers" | "events" | "filters";

function IntegrationSection({
  node,
  update,
}: {
  node: CanvasNode;
  update: (fields: Partial<CanvasNode>) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TriggerCategory | "all">("all");
  const [view, setView] = useState<IntegrationView>("providers");

  const selectedProviderId = node.triggerIntegrationId ?? "";
  const selectedEventId    = node.triggerIntegrationEvent ?? "";
  const activeFilters      = node.triggerFilters ?? {};

  const selectedProvider = findProvider(selectedProviderId);
  const selectedEvent    = findEvent(selectedProviderId, selectedEventId);

  // When provider changes, reset event + filters and navigate to event picker
  function selectProvider(providerId: string) {
    update({
      triggerIntegrationId:    providerId,
      triggerIntegrationEvent: "",
      triggerEventLabel:       "",
      triggerFilters:          {},
    });
    setView("events");
  }

  function selectEvent(eventId: string, eventLabel: string) {
    update({
      triggerIntegrationEvent: eventId,
      triggerEventLabel:       eventLabel,
      triggerFilters:          {},
    });
    setView("filters");
  }

  function setFilter(key: string, value: string) {
    update({ triggerFilters: { ...activeFilters, [key]: value } });
  }

  // Categories that have at least one provider
  const usedCategories = new Set(TRIGGER_PROVIDERS.map(p => p.category));
  const visibleCategories = TRIGGER_CATEGORIES.filter(c => usedCategories.has(c.id));

  const filteredProviders = TRIGGER_PROVIDERS.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Providers list ───────────────────────────────────────────────────────

  if (view === "providers") {
    return (
      <Section
        title="Integration"
        icon={<Puzzle className="h-3.5 w-3.5" />}
        defaultOpen
      >
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-background border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
            placeholder="Search integrations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex gap-1 flex-wrap mb-3">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                activeCategory === "all"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-prune-borderGray text-muted-foreground hover:bg-muted/30",
              )}
            >
              All
            </button>
            {visibleCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                  activeCategory === cat.id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-prune-borderGray text-muted-foreground hover:bg-muted/30",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Provider list */}
        <div className="space-y-1 max-h-[360px] overflow-y-auto pr-0.5">
          {filteredProviders.length === 0 && (
            <p className="text-[12px] text-muted-foreground text-center py-6">
              No integrations match your search.
            </p>
          )}
          {filteredProviders.map(provider => {
            const isSelected = selectedProviderId === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => selectProvider(provider.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
                  isSelected
                    ? "border-gray-800 bg-gray-50 dark:bg-gray-900/40"
                    : "border-transparent hover:border-prune-borderGray hover:bg-muted/30",
                )}
              >
                <ProviderIcon provider={provider} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">{provider.name}</span>
                    <span className="text-[10px] text-muted-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded">
                      {AUTH_LABELS[provider.authType]}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {provider.description}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Selected summary */}
        {selectedProviderId && selectedEventId && (
          <div className="mt-3 p-2.5 rounded-lg bg-muted/40 border border-prune-borderGray">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {selectedProvider?.name} → {selectedEvent?.label}
              </span>{" "}
              is configured.{" "}
              <button
                className="underline hover:text-foreground transition-colors"
                onClick={() => setView("events")}
              >
                Change event
              </button>
            </p>
          </div>
        )}
      </Section>
    );
  }

  // ── Event picker ─────────────────────────────────────────────────────────

  if (view === "events" && selectedProvider) {
    return (
      <Section
        title={`${selectedProvider.name} Events`}
        icon={<Zap className="h-3.5 w-3.5" />}
        defaultOpen
      >
        <button
          onClick={() => setView("providers")}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to integrations
        </button>

        {/* Provider header */}
        <div className="flex items-center gap-3 mb-4 p-2.5 rounded-lg bg-muted/30 border border-prune-borderGray">
          <ProviderIcon provider={selectedProvider} size={15} />
          <div>
            <p className="text-[13px] font-medium">{selectedProvider.name}</p>
            <p className="text-[11px] text-muted-foreground">{selectedProvider.description}</p>
          </div>
        </div>

        <FieldLabel>Select an event</FieldLabel>
        <div className="space-y-1.5">
          {selectedProvider.events.map(event => {
            const isSelected = selectedEventId === event.id;
            return (
              <button
                key={event.id}
                onClick={() => selectEvent(event.id, event.label)}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-colors",
                  isSelected
                    ? "border-gray-800 bg-gray-900"
                    : "border-prune-borderGray bg-prune-lightGray/40 hover:bg-muted/20",
                )}
              >
                <Zap
                  className={cn(
                    "h-3.5 w-3.5 mt-0.5 shrink-0",
                    isSelected ? "text-amber-400" : "text-amber-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13px] font-medium",
                      isSelected ? "text-white" : "text-foreground",
                    )}
                  >
                    {event.label}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] mt-0.5 leading-relaxed",
                      isSelected ? "text-white/60" : "text-muted-foreground",
                    )}
                  >
                    {event.description}
                  </p>
                  {event.outputFields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {event.outputFields.slice(0, 4).map(f => (
                        <span
                          key={f}
                          className={cn(
                            "font-mono text-[9px] px-1 py-0.5 rounded",
                            isSelected
                              ? "bg-white/10 text-white/70"
                              : "bg-muted/60 text-muted-foreground",
                          )}
                        >
                          {f}
                        </span>
                      ))}
                      {event.outputFields.length > 4 && (
                        <span
                          className={cn(
                            "text-[9px] px-1 py-0.5 rounded",
                            isSelected ? "text-white/50" : "text-muted-foreground/60",
                          )}
                        >
                          +{event.outputFields.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </Section>
    );
  }

  // ── Filter configuration ──────────────────────────────────────────────────

  if (view === "filters" && selectedProvider && selectedEvent) {
    const hasFilters = (selectedEvent.filters ?? []).length > 0;
    return (
      <>
        <Section
          title="Event Configured"
          icon={<Check className="h-3.5 w-3.5 text-green-500" />}
          defaultOpen
        >
          <button
            onClick={() => setView("providers")}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Change integration
          </button>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-prune-borderGray mb-2">
            <ProviderIcon provider={selectedProvider} size={15} />
            <div className="min-w-0">
              <p className="text-[12px] font-medium">{selectedProvider.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[11px] text-muted-foreground">{selectedEvent.label}</span>
                <button
                  className="text-[10px] underline text-muted-foreground hover:text-foreground transition-colors ml-1"
                  onClick={() => setView("events")}
                >
                  change
                </button>
              </div>
            </div>
          </div>

          {/* Output fields reference */}
          <div className="p-2.5 rounded-lg bg-muted/20 border border-prune-borderGray">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground font-medium">Available downstream</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedEvent.outputFields.map(f => (
                <code
                  key={f}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {`{{state.event.${f}}}`}
                </code>
              ))}
            </div>
          </div>
        </Section>

        {hasFilters && (
          <Section
            title="Event Filters"
            icon={<Filter className="h-3.5 w-3.5" />}
            defaultOpen
          >
            <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
              Only fire this workflow when incoming events match all configured filters.
              Leave a filter blank to accept any value.
            </p>
            <div className="space-y-3">
              {selectedEvent.filters!.map(filterDef => (
                <div key={filterDef.key}>
                  <FieldLabel>{filterDef.label}</FieldLabel>
                  {filterDef.type === "select" ? (
                    <select
                      className="w-full px-2.5 py-2 text-[13px] bg-background border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray"
                      value={activeFilters[filterDef.key] ?? ""}
                      onChange={e => setFilter(filterDef.key, e.target.value)}
                    >
                      <option value="">Any</option>
                      {filterDef.options?.filter(o => o !== "Any").map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-2.5 py-2 text-[13px] bg-background border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
                      placeholder={filterDef.placeholder ?? ""}
                      value={activeFilters[filterDef.key] ?? ""}
                      onChange={e => setFilter(filterDef.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Test trigger */}
        <Section
          title="Test Trigger"
          icon={<Play className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
            Manually fire this trigger with a mock event payload to test your workflow
            without waiting for a real event.
          </p>
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-prune-borderGray bg-prune-lightGray/40 hover:bg-muted/20 text-[13px] font-medium transition-colors"
            onClick={() => {
              const mockPayload = Object.fromEntries(
                selectedEvent.outputFields.map(f => [f, `sample_${f}`]),
              );
              navigator.clipboard.writeText(
                JSON.stringify({ provider: selectedProviderId, event: selectedEventId, payload: mockPayload }, null, 2),
              );
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy test payload
          </button>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            POST this to{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
              POST /v1/integrations/{selectedProviderId}/webhook
            </code>
          </p>
        </Section>
      </>
    );
  }

  return null;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function TriggerPanelSections({
  node,
  onUpdateNode,
}: {
  node: CanvasNode;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
}) {
  const [copied, setCopied] = useState(false);

  const triggerType: TriggerType = node.triggerType ?? "manual";
  const scheduleCron  = node.triggerScheduleCron ?? "";
  const sampleInput   = node.triggerSampleInput  ?? "";

  function update(fields: Partial<CanvasNode>) {
    onUpdateNode?.(node.id, fields);
  }

  const isCustomCron =
    !!scheduleCron && !SCHEDULE_PRESETS.some(p => p.cron === scheduleCron);

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
            onChange={e => update({ triggerSampleInput: e.target.value })}
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

          <FieldLabel>Interval</FieldLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SCHEDULE_PRESETS.map(p => (
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
              onClick={() => { if (!isCustomCron) update({ triggerScheduleCron: "0 0 * * *" }); }}
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

          <FieldLabel>Cron Expression</FieldLabel>
          <input
            type="text"
            className="w-full px-2.5 py-2 text-[13px] font-mono bg-background border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
            placeholder="0 9 * * *"
            value={scheduleCron}
            onChange={e => update({ triggerScheduleCron: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            5-field cron: minute hour day month weekday (UTC)
          </p>
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
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">POST</code>{" "}
            request to the runs endpoint with your workflow ID. The request body is available
            downstream as{" "}
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
        <IntegrationSection node={node} update={update} />
      )}
    </>
  );
}
