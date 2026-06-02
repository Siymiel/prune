import { SettingsNav } from "@/components/settings/settings-nav"
import { SettingsHeader } from "@/components/settings/settings-header"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden">
      <SettingsNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SettingsHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
