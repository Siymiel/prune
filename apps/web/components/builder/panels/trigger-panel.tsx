"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderIntegrationIcon } from "@/components/templates/integration-logo";

type TriggerProvider =
  | { id: string; name: string; description: string; integrationId: "google-drive" | "gmail" }
  | { id: string; name: string; description: string; iconBg: string; letter: string };

const TRIGGER_PROVIDERS: TriggerProvider[] = [
  { id: "airtable", name: "Airtable", description: "Query an Airtable base with natural language or semantic search", iconBg: "bg-amber-400", letter: "A" },
  { id: "asana", name: "Asana", description: "Asana is a work management platform for organizing tasks and projects", iconBg: "bg-red-400", letter: "A" },
  { id: "docusign", name: "DocuSign", description: "Connect to DocuSign to manage envelopes, documents, and signatures", iconBg: "bg-indigo-700", letter: "D" },
  { id: "framer", name: "Framer", description: "Framer is a no-code website builder. Connect a Framer project", iconBg: "bg-blue-600", letter: "F" },
  { id: "google-drive", name: "Google Drive", description: "Google Drive is a file storage and synchronization service", integrationId: "google-drive" },
  { id: "github", name: "Github", description: "GitHub is a development platform for version control and collaboration", iconBg: "bg-gray-900", letter: "G" },
  { id: "gmail", name: "Gmail", description: "Gmail is Google's email service for sending, receiving, and managing email", integrationId: "gmail" },
  { id: "google-sheets", name: "Google Sheets", description: "Google Sheets is a spreadsheet program included as part of Google Drive", iconBg: "bg-green-500", letter: "S" },
  { id: "microsoft-teams", name: "Microsoft Teams", description: "Microsoft Teams integration providing OAuth2 authentication and messaging", iconBg: "bg-purple-600", letter: "T" },
];

export function TriggerProviderPicker() {
  const [search, setSearch] = useState("");
  const filtered = TRIGGER_PROVIDERS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="flex flex-col h-full font-sans">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
          Providers in all categories
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray placeholder:text-muted-foreground/50"
            placeholder="Search for a provider in all categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y">
        {filtered.map((provider) => (
          <button
            key={provider.id}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
          >
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold border",
                "integrationId" in provider ? "bg-background" : provider.iconBg,
              )}
            >
              {"integrationId" in provider
                ? renderIntegrationIcon(provider.integrationId, 18)
                : provider.letter}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{provider.name}</div>
              <div className="text-xs text-muted-foreground truncate">{provider.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
