"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { SETTINGS_SECTIONS } from "@/lib/settings-config"

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 border-r h-full flex flex-col py-4 overflow-y-auto bg-background">
      <nav className="flex-1 px-2 mt-16 space-y-1">
        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.label} className="pb-2">
            {/* Category label — light/muted */}
            <div className="text-[13px] font-medium text-muted-foreground px-2 py-1">
              {section.label}
            </div>
            <ul>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link
                      href={item.href as any}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-1 text-[14px] font-[450] rounded-md transition-colors",
                        isActive
                          ? "bg-accent text-foreground font-[450]"
                          : "text-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[15px] w-[15px] shrink-0",
                          isActive ? "text-foreground" : "text-foreground"
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-2 pt-3 border-t">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          href={"/dashboard" as any}
          className="flex items-center gap-2 px-2 py-1.5 text-[14px] text-muted-foreground hover:text-foreground rounded-md transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>
    </aside>
  )
}
