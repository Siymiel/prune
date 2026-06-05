"use client";

import { Mic, Settings2, ChevronDown, Play } from "lucide-react";
import { Section, SettingRow, SubLabel } from "./panel-ui";
import { type CanvasNode } from "@/lib/editor-nodes";
import { cn } from "@/lib/utils";

// ─── Static option lists ──────────────────────────────────────────────────────

const TTS_MODELS = [
  { id: "eleven_multilingual_v2", label: "Eleven Multilingual v2" },
  { id: "eleven_turbo_v2_5",      label: "Eleven Turbo v2.5" },
  { id: "eleven_turbo_v2",        label: "Eleven Turbo v2" },
  { id: "eleven_monolingual_v1",  label: "Eleven Monolingual v1" },
];

const TTS_VOICES = [
  { id: "sarah",   label: "Sarah" },
  { id: "chris",   label: "Chris" },
  { id: "brian",   label: "Brian" },
  { id: "rachel",  label: "Rachel" },
  { id: "bella",   label: "Bella" },
  { id: "antoni",  label: "Antoni" },
  { id: "josh",    label: "Josh" },
  { id: "elli",    label: "Elli" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AudioOutputPanelProps {
  node: CanvasNode;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
  runOutput?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioOutputPanelSections({
  node,
  onUpdateNode,
  runOutput,
}: AudioOutputPanelProps) {
  const model = node.ttsModel ?? "eleven_multilingual_v2";
  const voice = node.ttsVoice ?? "sarah";
  const apiKey = node.ttsApiKey ?? "";

  const update = (fields: Partial<CanvasNode>) =>
    onUpdateNode?.(node.id, fields);

  const modelLabel =
    TTS_MODELS.find((m) => m.id === model)?.label ?? model;
  const voiceLabel =
    TTS_VOICES.find((v) => v.id === voice)?.label ?? voice;

  return (
    <>
      {/* Test Output */}
      <Section title="Test Output" icon={<Mic className="h-3.5 w-3.5" />} defaultOpen>
        {runOutput ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-prune-borderGray bg-prune-lightGray">
            <button
              className="h-7 w-7 flex items-center justify-center rounded-full bg-foreground text-background shrink-0 hover:opacity-80 transition-opacity"
              title="Play audio"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
            </button>
            <span className="text-[13px] text-muted-foreground truncate">{runOutput}</span>
          </div>
        ) : (
          <div className="px-4 py-3 rounded-2xl border text-xs text-muted-foreground bg-muted/10 text-center">
            No audio output — run the flow to generate audio
          </div>
        )}
      </Section>

      {/* Configuration */}
      <Section title="Configuration" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="space-y-4">
          {/* Model */}
          <SettingRow label="Model">
            <div className="relative">
              <select
                value={model}
                onChange={(e) => update({ ttsModel: e.target.value })}
                className={cn(
                  "appearance-none flex items-center gap-1.5 pl-3 pr-7 py-1.5 border border-prune-borderGray rounded-md",
                  "text-[13px] text-foreground bg-background hover:bg-muted/30 transition-colors",
                  "focus:outline-none focus:ring-1 focus:ring-prune-midGray cursor-pointer",
                )}
              >
                {TTS_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
          </SettingRow>

          {/* Voice */}
          <SettingRow label="Voice">
            <div className="relative">
              <select
                value={voice}
                onChange={(e) => update({ ttsVoice: e.target.value })}
                className={cn(
                  "appearance-none flex items-center gap-1.5 pl-3 pr-7 py-1.5 border border-prune-borderGray rounded-md",
                  "text-[13px] text-foreground bg-background hover:bg-muted/30 transition-colors",
                  "focus:outline-none focus:ring-1 focus:ring-prune-midGray cursor-pointer",
                )}
              >
                {TTS_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
          </SettingRow>

          {/* API Key */}
          <div>
            <SubLabel>API Key</SubLabel>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => update({ ttsApiKey: e.target.value })}
              className="w-full px-3 py-2 text-[13px] bg-muted/20 border border-prune-borderGray rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray"
              placeholder="sk-…  (uses platform key if empty)"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
