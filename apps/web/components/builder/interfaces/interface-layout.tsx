"use client";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterfaceLayoutProps {
  label: string;
  onBack: () => void;
  actions?: React.ReactNode;
  leftPanel?: React.ReactNode;
  leftPanelWidth?: number;
  rightPanel?: React.ReactNode;
  rightPanelWidth?: number;
  children: React.ReactNode;
  className?: string;
}

export function InterfaceLayout({
  label,
  onBack,
  actions,
  leftPanel,
  leftPanelWidth = 240,
  rightPanel,
  rightPanelWidth = 300,
  children,
  className,
}: InterfaceLayoutProps) {
  return (
    <div className={cn("flex flex-col flex-1 overflow-hidden", className)}>
      {/* Interface topbar */}
      <div className="h-12 border-b bg-background flex items-center gap-3 px-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Export
        </button>

        <div className="w-px h-4 bg-border" />

        <span className="text-sm font-medium text-foreground">{label}</span>

        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {leftPanel && (
          <div
            className="shrink-0 border-r bg-background overflow-y-auto"
            style={{ width: leftPanelWidth }}
          >
            {leftPanel}
          </div>
        )}

        <div className="flex-1 overflow-hidden">{children}</div>

        {rightPanel && (
          <div
            className="shrink-0 border-l bg-background overflow-y-auto"
            style={{ width: rightPanelWidth }}
          >
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}
