"use client";

import { useState, type ReactNode } from "react";
import { Search, UploadCloud, Link2, Globe, X } from "lucide-react";
import { SiGoogledrive, SiSlack, SiGmail, SiGooglesheets, SiAirtable, SiAlgolia } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/* ── Generic wrapper ─────────────────────────────────────────────────────── */

interface KnowledgeSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function KnowledgeSourceDialog({
  open,
  onOpenChange,
  title,
  children,
}: KnowledgeSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden"
        style={{
          right: 'calc(var(--panel-width, 0px) + 8px)',
          left: 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ── OR divider ──────────────────────────────────────────────────────────── */

function OrDivider() {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">OR</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ── Add Knowledge Base dialog ───────────────────────────────────────────── */

export function KnowledgeBaseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <KnowledgeSourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Knowledge Base"
    >
      <div className="flex flex-col items-center gap-4 p-5">
        <button className="w-full flex flex-col items-center gap-2.5 py-8 border-2 border-dashed rounded-xl hover:bg-muted/30 transition-colors">
          <div className="h-10 w-10 rounded-xl border bg-white shadow-sm flex items-center justify-center">
            <UploadCloud className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-sm font-semibold text-foreground">Drag or click to upload</div>
          <div className="text-xs text-muted-foreground">Upload or drop a file here</div>
        </button>

        <OrDivider />

        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted/30 transition-colors">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          Import from a Connection
        </button>

        <OrDivider />

        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted/30 transition-colors">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          Import from a Website
        </button>
      </div>
    </KnowledgeSourceDialog>
  );
}

/* ── Connected apps ──────────────────────────────────────────────────────── */

const CONNECTED_APPS = [
  {
    id: "google-drive",
    label: "Google Drive",
    icon: <SiGoogledrive size={18} color="#4285F4" />,
  },
  {
    id: "onedrive",
    label: "OneDrive",
    icon: (
      <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-sm text-[9px] font-bold text-white bg-[#0078D4]">
        OD
      </span>
    ),
  },
  {
    id: "sharepoint",
    label: "Microsoft SharePoint",
    icon: (
      <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-sm text-[9px] font-bold text-white bg-[#0B6A0B]">
        SP
      </span>
    ),
  },
  {
    id: "slack",
    label: "Slack",
    icon: <SiSlack size={18} color="#4A154B" />,
  },
] as const;

export function ConnectedAppsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = CONNECTED_APPS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <KnowledgeSourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Connected Apps"
    >
      <div className="px-3 py-2.5 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Select an app to search"
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <div className="py-1 max-h-56 overflow-y-auto">
        {filtered.map((app) => (
          <button
            key={app.id}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-sm font-medium transition-colors text-left"
          >
            <span className="shrink-0">{app.icon}</span>
            {app.label}
          </button>
        ))}
      </div>
    </KnowledgeSourceDialog>
  );
}

/* ── Tools picker ────────────────────────────────────────────────────────── */

function AppBadge({ text, bg }: { text: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-sm text-[9px] font-bold text-white shrink-0"
      style={{ backgroundColor: bg }}
    >
      {text}
    </span>
  );
}

const MOST_USED_TOOLS = [
  { id: "stackai", label: "StackAI", icon: <AppBadge text="S" bg="#6366f1" /> },
  { id: "gmail", label: "Gmail", icon: <SiGmail size={18} color="#EA4335" /> },
  { id: "outlook", label: "Microsoft Outlook", icon: <AppBadge text="O" bg="#0078D4" /> },
  { id: "linkedin", label: "LinkedIn", icon: <AppBadge text="in" bg="#0A66C2" /> },
  { id: "google-sheets", label: "Google Sheets", icon: <SiGooglesheets size={18} color="#0F9D58" /> },
  { id: "slack", label: "Slack", icon: <SiSlack size={18} color="#4A154B" /> },
];

const ALL_TOOLS = [
  { id: "ahrefs", label: "Ahrefs", icon: <AppBadge text="A" bg="#FF6B35" /> },
  { id: "airops", label: "AirOps", icon: <AppBadge text="AO" bg="#1a1a2e" /> },
  { id: "airtable", label: "Airtable", icon: <SiAirtable size={18} color="#18BFFF" /> },
  { id: "algolia", label: "Algolia", icon: <SiAlgolia size={18} color="#5468FF" /> },
];

const PANEL_STYLE: React.CSSProperties = {
  right: "calc(var(--panel-width, 0px) + 8px)",
  left: "auto",
  top: "50%",
  transform: "translateY(-50%)",
};

export function ToolsPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");

  const filterFn = (label: string) =>
    !query || label.toLowerCase().includes(query.toLowerCase());

  const mostUsed = MOST_USED_TOOLS.filter((t) => filterFn(t.label));
  const all = ALL_TOOLS.filter((t) => filterFn(t.label));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="max-w-sm p-0 overflow-hidden"
        style={PANEL_STYLE}
      >
        <DialogTitle className="sr-only">Add Tools</DialogTitle>
        {/* Search header with inline close */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
          />
          <DialogClose className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus:outline-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {mostUsed.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
                Most used apps
              </div>
              {mostUsed.map((tool) => (
                <button
                  key={tool.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-sm font-medium transition-colors text-left"
                >
                  <span className="shrink-0">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </>
          )}
          {all.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground mt-1">
                All apps
              </div>
              {all.map((tool) => (
                <button
                  key={tool.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-sm font-medium transition-colors text-left"
                >
                  <span className="shrink-0">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
