import { notFound } from "next/navigation"

const VALID_SLUGS = new Set([
  "language",
  "organizations",
  "members",
  "groups",
  "roles",
  "notifications",
  "branding",
  "sso-provisioning",
  "feature-access",
  "audit-logs",
  "data-retention",
  "api-keys",
  "connectors",
  "triggers",
  "billing",
  "usage",
  "support",
  "deployment-info",
])

const LABELS: Record<string, string> = {
  language: "Language",
  organizations: "Organizations",
  members: "Members",
  groups: "Groups",
  roles: "Roles",
  notifications: "Notifications",
  branding: "Branding",
  "sso-provisioning": "SSO and Provisioning",
  "feature-access": "Feature Access",
  "audit-logs": "Audit Logs",
  "data-retention": "Data Retention",
  "api-keys": "API Keys",
  connectors: "Connectors",
  triggers: "Triggers",
  billing: "Billing",
  usage: "Usage",
  support: "Support",
  "deployment-info": "Deployment Info",
}

export default async function SettingsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!VALID_SLUGS.has(slug)) notFound()

  const label = LABELS[slug] ?? slug

  return (
    <div className="max-w-5xl mx-auto pt-6 pb-10 px-10">
      <div className="border rounded-lg px-6 py-12 flex items-center justify-center text-[13px] text-muted-foreground">
        {label} settings will appear here.
      </div>
    </div>
  )
}
