"use client";

import { useState } from "react";
import { Check, Code2, Hash, LayoutList, MessageCircle, MessageSquare, Table2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type InterfaceId =
  | "form"
  | "chat-assistant"
  | "website-chatbot"
  | "batch"
  | "api"

interface InterfaceOption {
  id: InterfaceId;
  label: string;
  icon: React.ElementType;
  deprecated?: boolean;
}

const USER_INTERFACES: InterfaceOption[] = [
  { id: "form", label: "Form", icon: LayoutList },
  { id: "chat-assistant", label: "Chat Assistant", icon: MessageSquare },
  { id: "website-chatbot", label: "Website Chatbot", icon: MessageCircle },
  { id: "batch", label: "Batch", icon: Table2 },
];

const API_INTERFACES: InterfaceOption[] = [
  { id: "api", label: "API", icon: Code2 },
];

function InterfaceCard({
  option,
  selected,
  onSelect,
}: {
  option: InterfaceOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border bg-white transition-all duration-150 text-center shadow hover:bg-prune-lightGray",
        selected
          ? "border-foreground ring-1 ring-foreground shadow-sm"
          : "border-border hover:border-gray-300 hover:shadow-sm",
      )}
    >
      <div className="h-14 w-14 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-foreground leading-tight">{option.label}</span>
    </button>
  );
}

function InterfaceGrid({ options, selected, onSelect }: {
  options: InterfaceOption[];
  selected: InterfaceId | null;
  onSelect: (id: InterfaceId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => (
        <InterfaceCard
          key={opt.id}
          option={opt}
          selected={selected === opt.id}
          onSelect={() => onSelect(opt.id)}
        />
      ))}
    </div>
  );
}

export function ExportView() {
  const [selected, setSelected] = useState<InterfaceId | null>(null);

  return (
    <div className="flex flex-1 overflow-hidden font-sans font-[450]">
      {/* Left — preview area */}
      <div className="flex-1 flex items-center justify-center bg-background relative overflow-hidden">
        {/* Concentric circles */}
        {[560, 480, 400, 320, 240].map((r) => (
          <div
            key={r}
            className="absolute rounded-full border-prune-borderGray border border-border/40"
            style={{ width: r * 2, height: r * 2 }}
          />
        ))}
        <div className="relative z-10 flex flex-col items-center gap-3 text-center px-8">
          <div className="flex gap-1.5 mb-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("rounded bg-border", i === 1 ? "h-8 w-12" : "h-8 w-8")} />
            ))}
          </div>
          <p className="text-[16px] text-foreground font-medium">
            You haven&apos;t chosen an interface yet.
          </p>
        </div>
      </div>

      {/* Right — selector panel */}
      <div className="w-[600px] shrink-0 border-l bg-background flex flex-col">
        <div className="px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-medium text-foreground">Select an interface type</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              User Interfaces
            </p>
            <InterfaceGrid options={USER_INTERFACES} selected={selected} onSelect={setSelected} />
          </section>

          <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              API Connections
            </p>
            <InterfaceGrid options={API_INTERFACES} selected={selected} onSelect={setSelected} />
          </section>
        </div>

        <div className="px-5 py-4 border-t shrink-0">
          <button
            disabled={!selected}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              selected
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Check className="h-4 w-4" />
            Use this interface
          </button>
        </div>
      </div>
    </div>
  );
}
