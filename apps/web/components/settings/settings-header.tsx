"use client"

import { usePathname } from "next/navigation"
import { getSettingsMeta } from "@/lib/settings-config"

export function SettingsHeader() {
  const pathname = usePathname()
  const meta = getSettingsMeta(pathname)

  if (!meta) return null

  return (
    <div className="px-4 pt-3 pb-4 border-b shrink-0">
      <h1 className="text-[16px] font-semibold tracking-tight">{meta.pageTitle}</h1>
      <p className="text-[14px] font-[450] text-muted-foreground">{meta.description}</p>
    </div>
  )
}
