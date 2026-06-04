"use client";

import { useRef } from "react";
import { Mic, Settings2, Layers, KeyRound, Upload, Link2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CanvasNode } from "@/lib/editor-nodes";
import { Section, FieldLabel } from "./panel-ui";

const DEEPGRAM_MODELS: { id: "nova-2" | "nova" | "enhanced" | "base"; label: string; description: string }[] = [
  { id: "nova-2",   label: "Nova 2",   description: "Latest — highest accuracy" },
  { id: "nova",     label: "Nova",     description: "Legacy — good accuracy" },
  { id: "enhanced", label: "Enhanced", description: "High quality, balanced" },
  { id: "base",     label: "Base",     description: "Fast, balanced performance" },
];

const AUDIO_SOURCES: { id: "url" | "upload" | "recording"; label: string }[] = [
  { id: "url",       label: "URL" },
  { id: "upload",    label: "Upload File" },
  { id: "recording", label: "Recording" },
];

export function AudioInputPanelSections({
  node,
  onUpdateNode,
}: {
  node: CanvasNode;
  onUpdateNode?: (id: string, fields: Partial<CanvasNode>) => void;
}) {
  const provider = node.audioProvider ?? "deepgram";
  const model = node.audioModel ?? "nova-2";
  const apiKey = node.audioApiKey ?? "";
  const audioSource = node.audioSource ?? "recording";
  const audioSourceUrl = node.audioSourceUrl ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (fields: Partial<CanvasNode>) => onUpdateNode?.(node.id, fields);

  return (
    <>
      <Section title="Test Audio Source" icon={<Mic className="h-3.5 w-3.5" />} defaultOpen>
        {audioSource === "recording" && (
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-gray-900 text-white text-xs font-[450] hover:bg-gray-800 transition-colors">
              <Mic className="h-3.5 w-3.5" />
              Record Audio
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-prune-borderGray bg-background text-xs font-[450] text-foreground hover:bg-muted/40 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Audio
            </button>
          </div>
        )}

        {audioSource === "upload" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border border-dashed border-prune-borderGray bg-prune-lightGray text-center cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-background border border-prune-borderGray flex items-center justify-center">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Click to upload an audio file</p>
            <p className="text-[11px] text-muted-foreground/60">MP3, WAV, M4A, FLAC, OGG, WebM</p>
          </div>
        )}

        {audioSource === "url" && (
          <div className="space-y-2">
            <FieldLabel>Audio URL</FieldLabel>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-prune-borderGray bg-muted/20">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="url"
                value={audioSourceUrl}
                onChange={(e) => update({ audioSourceUrl: e.target.value })}
                placeholder="https://example.com/audio.mp3"
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-muted-foreground/70">
              Audio will be fetched from this URL and transcribed at runtime.
            </p>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" />
      </Section>

      <Section title="Settings" icon={<Settings2 className="h-3.5 w-3.5" />} defaultOpen>
        <FieldLabel>Audio source</FieldLabel>
        <div className="relative">
          <select
            value={audioSource}
            onChange={(e) => update({ audioSource: e.target.value as "url" | "upload" | "recording" })}
            className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-background border border-prune-borderGray rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-prune-midGray cursor-pointer"
          >
            {AUDIO_SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </Section>

      <Section title="Provider" icon={<Layers className="h-3.5 w-3.5" />} defaultOpen>
        <div className="flex gap-2">
          {(["deepgram", "whisper-1"] as const).map((p) => (
            <button
              key={p}
              onClick={() => update({ audioProvider: p })}
              className={cn(
                "flex-1 px-3 py-2 rounded-md border text-xs font-[450] transition-colors",
                provider === p
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-background text-foreground border-prune-borderGray hover:bg-muted/40",
              )}
            >
              {p === "deepgram" ? "Deepgram" : "Whisper-1"}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          {provider === "deepgram"
            ? "Deepgram — supports multiple models and submodels."
            : "OpenAI Whisper v1 — no model selection available."}
        </p>
      </Section>

      {provider === "deepgram" && (
        <Section title="Model" icon={<Layers className="h-3.5 w-3.5" />} defaultOpen>
          <div className="space-y-1.5">
            {DEEPGRAM_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => update({ audioModel: m.id })}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-colors",
                  model === m.id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-background text-foreground border-prune-borderGray hover:bg-muted/40",
                )}
              >
                <span className="font-[450]">{m.label}</span>
                <span className={cn("text-[11px]", model === m.id ? "text-white/70" : "text-muted-foreground")}>
                  {m.description}
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="API Key" icon={<KeyRound className="h-3.5 w-3.5" />}>
        <FieldLabel>
          {provider === "deepgram" ? "Deepgram API Key" : "OpenAI API Key"}
        </FieldLabel>
        <input
          type="password"
          className="w-full px-3 py-2 text-xs bg-muted/30 border rounded-md text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-prune-midGray"
          placeholder="sk-••••••••••••"
          value={apiKey}
          onChange={(e) => update({ audioApiKey: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground/70 mt-1.5">
          Leave blank to use the workspace default key.
        </p>
      </Section>
    </>
  );
}
