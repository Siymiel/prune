"use client";

import { InterfaceLayout } from "./interface-layout";

interface EmptyInterfaceProps {
  label: string;
  icon: React.ElementType;
  onBack: () => void;
}

export function EmptyInterface({ label, icon: Icon, onBack }: EmptyInterfaceProps) {
  return (
    <InterfaceLayout label={label} onBack={onBack}>
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="h-14 w-14 rounded-2xl bg-muted border flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This interface type is not configured yet. Check back soon.
          </p>
        </div>
      </div>
    </InterfaceLayout>
  );
}
