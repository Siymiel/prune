"use client";

import { X, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistModalProps {
  open: boolean;
  onClose: () => void;
  onAddInterface?: () => void;
  onPublish?: () => void;
}

export function ChecklistModal({ open, onClose, onAddInterface, onPublish }: ChecklistModalProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-[4.5rem] right-4 z-30 w-[460px] bg-white border border-prune-borderGray rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-prune-borderGray">
        <h3 className="text-[14px] font-[450] text-foreground">Set up your workflow</h3>
        <button
          onClick={onClose}
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-prune-lightGray transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Description */}
      <p className="px-5 pt-4 pb-3 text-[13px] text-muted-foreground leading-relaxed">
        To finish this workflow setup: click on any node in the workflow to configure its settings,
        or add new steps to build your automation.
      </p>

      {/* Checklist items */}
      <div className="px-5 pb-5 flex flex-col gap-0">
        <ChecklistRow
          icon={<Rocket className="h-4 w-4 text-muted-foreground" />}
          title="Set up your interface"
          subtitle="Configure the user-facing interface for your workflow"
          action={
            <button
              onClick={onAddInterface}
              className="shrink-0 px-3 py-1.5 text-[13px] font-[450] border border-prune-borderGray rounded-lg bg-white hover:bg-prune-lightGray transition-colors whitespace-nowrap"
            >
              Add Interface
            </button>
          }
        />
        <ChecklistRow
          icon={<Rocket className="h-4 w-4 text-muted-foreground" />}
          title="Publish your workflow"
          subtitle="Make your workflow available for use"
        />
      </div>
    </div>
  );
}

function ChecklistRow({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-prune-borderGray last:border-b-0">
      <div className="h-9 w-9 rounded-lg bg-prune-lightGray border border-prune-borderGray flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-[450] text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground truncate">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
