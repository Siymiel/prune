"use client";

import { Mic, Settings2, ChevronsUpDown } from "lucide-react";
import { Section, SettingRow, SubLabel } from "./panel-ui";

export function AudioOutputPanelSections() {
  return (
    <>
      <Section title="Test Output" icon={<Mic className="h-3.5 w-3.5" />} defaultOpen>
        <div className="px-4 py-3 rounded-2xl border text-xs text-muted-foreground bg-muted/10 text-center">
          No audio output, run the flow to generate audio
        </div>
      </Section>
      <Section title="Configuration" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="space-y-4">
          <SettingRow label="Model">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
              <span>eleven_multilingual_v2</span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </SettingRow>
          <SettingRow label="Voice">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs text-foreground hover:bg-muted/30 transition-colors">
              <span>Sarah</span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </SettingRow>
          <div>
            <SubLabel>API Key</SubLabel>
            <input
              type="text"
              className="w-full px-3 py-2 text-xs bg-muted/20 border rounded-md focus:outline-none focus:ring-1 focus:ring-prune-midGray"
              placeholder=""
            />
          </div>
        </div>
      </Section>
    </>
  );
}
