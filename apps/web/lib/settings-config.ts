import type { LucideIcon } from "lucide-react"
import {
  User, Globe, Building2, Users, UsersRound, ShieldCheck, Bell, Palette,
  Lock, ToggleLeft, ScrollText, Database, Key, Plug, Zap,
  CreditCard, BarChart3, HelpCircle, Server,
} from "lucide-react"

export interface SettingsItem {
  label: string
  href: string
  icon: LucideIcon
  pageTitle: string
  description: string
}

export interface SettingsSection {
  label: string
  items: SettingsItem[]
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    label: "Account",
    items: [
      {
        label: "Profile", href: "/settings/profile", icon: User,
        pageTitle: "Profile",
        description: "Manage your personal information and profile picture",
      },
      {
        label: "Language", href: "/settings/language", icon: Globe,
        pageTitle: "Language",
        description: "Manage your language and localization preferences",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Organizations", href: "/settings/organizations", icon: Building2,
        pageTitle: "Organizations",
        description: "Manage your organization's settings and members",
      },
      {
        label: "Members", href: "/settings/members", icon: Users,
        pageTitle: "Members",
        description: "Invite and manage members across your workspace",
      },
      {
        label: "Groups", href: "/settings/groups", icon: UsersRound,
        pageTitle: "Groups",
        description: "Organize workspace members into groups",
      },
      {
        label: "Roles", href: "/settings/roles", icon: ShieldCheck,
        pageTitle: "Roles",
        description: "Configure roles and permissions for your team",
      },
      {
        label: "Notifications", href: "/settings/notifications", icon: Bell,
        pageTitle: "Notifications",
        description: "Control your notification preferences and alerts",
      },
      {
        label: "Branding", href: "/settings/branding", icon: Palette,
        pageTitle: "Branding",
        description: "Customize your workspace's branding and appearance",
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        label: "SSO and Provisioning", href: "/settings/sso-provisioning", icon: Lock,
        pageTitle: "SSO and Provisioning",
        description: "Configure single sign-on and user provisioning",
      },
      {
        label: "Feature Access", href: "/settings/feature-access", icon: ToggleLeft,
        pageTitle: "Feature Access",
        description: "Control access to features across your workspace",
      },
      {
        label: "Audit Logs", href: "/settings/audit-logs", icon: ScrollText,
        pageTitle: "Audit Logs",
        description: "Review a history of actions taken in your workspace",
      },
      {
        label: "Data Retention", href: "/settings/data-retention", icon: Database,
        pageTitle: "Data Retention",
        description: "Configure data retention and deletion policies",
      },
    ],
  },
  {
    label: "Integrations",
    items: [
      {
        label: "API Keys", href: "/settings/api-keys", icon: Key,
        pageTitle: "API Keys",
        description: "Create and manage API keys for external access",
      },
      {
        label: "Connectors", href: "/settings/connectors", icon: Plug,
        pageTitle: "Connectors",
        description: "Connect your workspace to external services and tools",
      },
      {
        label: "Triggers", href: "/settings/triggers", icon: Zap,
        pageTitle: "Triggers",
        description: "Set up automated triggers for your workflows",
      },
    ],
  },
  {
    label: "Billing",
    items: [
      {
        label: "Billing", href: "/settings/billing", icon: CreditCard,
        pageTitle: "Billing",
        description: "Manage your subscription and payment details",
      },
      {
        label: "Usage", href: "/settings/usage", icon: BarChart3,
        pageTitle: "Usage",
        description: "Monitor your workspace usage and plan limits",
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        label: "Support", href: "/settings/support", icon: HelpCircle,
        pageTitle: "Support",
        description: "Get help and contact our support team",
      },
      {
        label: "Deployment Info", href: "/settings/deployment-info", icon: Server,
        pageTitle: "Deployment Info",
        description: "View technical details about your deployment",
      },
    ],
  },
]

const ALL_ITEMS = SETTINGS_SECTIONS.flatMap((s) => s.items)

export function getSettingsMeta(pathname: string) {
  return ALL_ITEMS.find((item) => item.href === pathname) ?? null
}
