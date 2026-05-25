"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Sparkles,
  Inbox,
  Network,
  FileText,
  TrendingUp,
  Plug,
  Users,
  CreditCard,
  Settings,
  ChevronsUpDown,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: Sparkles, badge: "6" },
  { href: "/inbox", label: "Inbox", icon: Inbox, badge: "12" },
  { href: "/builder", label: "Workflows", icon: Network },
  { href: "/knowledge", label: "Knowledge base", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/integrations", label: "Integrations", icon: Plug },
]

const SETTINGS_NAV: NavItem[] = [
  { href: "/team", label: "Team", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="h-7 w-7 shrink-0 rounded-lg bg-primary flex items-center justify-center text-[13px] font-bold text-primary-foreground">
            P
          </div>
          <div className="text-lg font-medium tracking-tight truncate">
            PruneAI
          </div>
        </div>

        <button className="w-full flex items-center justify-between px-2.5 py-2 rounded-md border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-5 shrink-0 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-semibold">
              AS
            </div>
            <div className="text-left min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="text-[13px] font-medium leading-tight truncate text-sidebar-foreground">
                Asha Salon
              </div>
              <div className="text-[11px] text-sidebar-foreground/60 leading-tight">
                Starter · Westlands
              </div>
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0 group-data-[collapsible=icon]:hidden" />
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {WORKSPACE_NAV.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link href={item.href as any}>
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            {SETTINGS_NAV.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link href={item.href as any}>
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="border-t border-sidebar-border pt-3 group-data-[collapsible=icon]:hidden">
          <div className="flex justify-between text-[11px] text-sidebar-foreground/60 mb-1.5">
            <span>Messages this month</span>
            <span className="text-sidebar-foreground font-medium">340 / 1k</span>
          </div>
          <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "34%" }} />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
