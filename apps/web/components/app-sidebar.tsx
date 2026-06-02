"use client"

import { useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  Inbox,
  Workflow,
  BookOpen,
  BarChart3,
  Puzzle,
  UsersRound,
  Receipt,
  Settings2,
  ChevronsUpDown,
  Hop,
  LogOut,
  Home,
  Moon,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/lib/auth-store"

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
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Projects", icon: LayoutDashboard },
  { href: "/knowledge", label: "Knowledge Bases", icon: BookOpen },
  { href: "/integrations", label: "Connections", icon: Puzzle },
  { href: "/templates", label: "Skills", icon: Bot, badge: "6" },
  { href: "/inbox", label: "Inbox", icon: Inbox, badge: "12" },
  { href: "/builder", label: "Workflows", icon: Workflow },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

const SETTINGS_NAV: NavItem[] = [
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/billing", label: "Billing", icon: Receipt },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const { setOpen } = useSidebar()
  const isHoveringRef = useRef(false)
  const dropdownOpenRef = useRef(false)

  const email = user?.email ?? ""
  const initials = email.slice(0, 2).toUpperCase() || "?"
  const displayName = email.split("@")[0] || "Workspace"
  const orgName = `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}'s Workspace`

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  return (
    <Sidebar
      collapsible="icon"
      hoverExpand
      onMouseEnter={() => { isHoveringRef.current = true; setOpen(true) }}
      onMouseLeave={() => { isHoveringRef.current = false; if (!dropdownOpenRef.current) setOpen(false) }}
      className="font-inter"
    >
      <SidebarHeader className="gap-1.5 pb-2">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <div className="h-7 w-7 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Hop className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            PruneAI
          </span>
        </div>

        {/* Workspace selector */}
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="h-6 w-6 shrink-0 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
            <div className="text-[13px] font-medium leading-tight truncate text-sidebar-foreground">
              {orgName}
            </div>
            <div className="text-[11px] text-sidebar-foreground/50 leading-tight">
              Free
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0 group-data-[collapsible=icon]:hidden" />
        </button>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:gap-0 px-1">
        <SidebarGroup className="group-data-[collapsible=icon]:py-1 p-1">
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
                    className={cn(
                      "h-8 text-[13px] font-medium rounded-md",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    )}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link href={item.href as any}>
                      <Icon className="h-[15px] w-[15px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="text-[10px] text-sidebar-foreground/40">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:py-1 p-1">
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase px-2 mb-0.5">
            Settings
          </SidebarGroupLabel>
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
                    className={cn(
                      "h-8 text-[13px] font-medium rounded-md",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    )}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link href={item.href as any}>
                      <Icon className="h-[15px] w-[15px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-1 pb-2">
        {/* Usage meter — hidden in icon mode */}
        <div className="group-data-[collapsible=icon]:hidden px-2 pb-2">
          <div className="flex justify-between text-[11px] text-sidebar-foreground/50 mb-1">
            <span>Messages this month</span>
            <span className="text-sidebar-foreground/70 font-medium">340 / 1k</span>
          </div>
          <div className="h-1 bg-sidebar-accent rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary/70" style={{ width: "34%" }} />
          </div>
        </div>

        {/* Profile card */}
        <DropdownMenu onOpenChange={(open) => {
          dropdownOpenRef.current = open
          if (!open && !isHoveringRef.current) setOpen(false)
        }}>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1.5 outline-none">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[11px] font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
                <div className="text-[13px] font-medium leading-tight truncate text-sidebar-foreground">
                  {displayName}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-[--sidebar-width] font-inter"
          >
            {/* Profile header */}
            <div className="flex items-center gap-3 px-3 py-3 border-b">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[13px] font-semibold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-foreground truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                    Admin
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{email}</div>
              </div>
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <DropdownMenuItem asChild className="gap-2.5 text-[13px] py-2 cursor-pointer">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link href={"/settings" as any}>
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                Settings
              </Link>
            </DropdownMenuItem>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <DropdownMenuItem asChild className="gap-2.5 text-[13px] py-2 cursor-pointer">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link href={"/dashboard" as any}>
                <Home className="h-4 w-4 text-muted-foreground" />
                Home Page
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="gap-2.5 text-[13px] py-2 cursor-pointer">
              <Moon className="h-4 w-4 text-muted-foreground" />
              Theme
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2.5 text-[13px] py-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
