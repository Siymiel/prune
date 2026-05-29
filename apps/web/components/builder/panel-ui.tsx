"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlignLeft,
  Wrench,
  Plus,
  Mic,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Section({
  title,
  icon,
  defaultOpen = false,
  children,
  extra,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0 ml-2 bg-white">
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {icon && <span className="text-prune-commonGray shrink-0">{icon}</span>}
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

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

export function SubLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[15px] font-medium text-gray-700/80 underline decoration-dashed underline-offset-4 mb-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PromptEditorToolbar({ showLeft }: { showLeft?: boolean }) {
  return (
    <div className="flex items-center px-2 py-1.5 border-t bg-prune-lightGray">
      {showLeft && (
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors">
          <span className="p-1.5 bg-white rounded-md border hover:text-foreground hover:bg-prune-lightGray">
            <Plus className="h-4 w-4" />
          </span>
          <div className="flex items-center gap-1 ml-2 hover:text-foreground/80">
            <Wrench className="h-4 w-4" />
            <span className="text-[14px] font-semibold">Tools</span>
          </div>
        </button>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <AlignLeft className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import prompt</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <Wand2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refine prompt</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <Mic className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice to prompt</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function Toggle({
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
        `group relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border
         transition-all duration-200 ease-out focus:outline-none
         focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1`,
        checked
          ? `border-transparent bg-gray-800
             shadow-[0_0_0_1px_rgba(17,24,39,0.04),0_2px_8px_rgba(17,24,39,0.18)]`
          : `border-border bg-muted/70 hover:bg-muted`,
      )}
    >
      <span
        className={cn(
          `absolute inset-0 rounded-full opacity-0 transition-opacity duration-200`,
          checked && `opacity-100 shadow-[0_0_18px_rgba(17,24,39,0.22)]`,
        )}
      />
      <span
        className={cn(
          `absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white
           shadow-[0_1px_2px_rgba(0,0,0,0.08),0_1px_6px_rgba(0,0,0,0.06)]
           transition-all duration-200 ease-out will-change-transform`,
          checked ? "translate-x-4" : "translate-x-0",
        )}
      >
        <span
          className={cn(
            `h-1.5 w-1.5 rounded-full transition-colors duration-200`,
            checked ? "bg-gray-800" : "bg-gray-300",
          )}
        />
      </span>
    </button>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
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
      style={{
        background: `linear-gradient(to right, #111827 ${pct}%, #e5e7eb ${pct}%)`,
      }}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border
        [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:shadow-sm
        [&::-webkit-slider-thumb]:cursor-pointer"
    />
  );
}

export function SettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-muted-foreground underline decoration-dashed underline-offset-2 shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}
