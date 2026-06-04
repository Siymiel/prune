export interface Provider {
  id: string
  name: string
  authType: "API Key" | "OAuth"
  actionsCount: number
  color: string
}

export interface Connection {
  id: string
  provider: Provider
  connectionName: string
  createdBy: string
  createdAt: Date
  generalAccess: "Private" | "Everyone"
  testStatus: "success" | "failed" | "untested"
}

export const PROVIDERS: Provider[] = [
  { id: "anthropic", name: "Anthropic", authType: "API Key", actionsCount: 8, color: "#C96442" },
  { id: "openai", name: "OpenAI", authType: "API Key", actionsCount: 12, color: "#000000" },
  { id: "slack", name: "Slack", authType: "OAuth", actionsCount: 20, color: "#4A154B" },
  { id: "gmail", name: "Gmail", authType: "OAuth", actionsCount: 15, color: "#EA4335" },
  { id: "google-drive", name: "Google Drive", authType: "OAuth", actionsCount: 10, color: "#4285F4" },
  { id: "google-calendar", name: "Google Calendar", authType: "OAuth", actionsCount: 8, color: "#34A853" },
  { id: "whatsapp", name: "WhatsApp", authType: "API Key", actionsCount: 6, color: "#25D366" },
  { id: "airtable", name: "Airtable", authType: "API Key", actionsCount: 14, color: "#FCB400" },
  { id: "asana", name: "Asana", authType: "OAuth", actionsCount: 18, color: "#F06A6A" },
  { id: "notion", name: "Notion", authType: "OAuth", actionsCount: 16, color: "#000000" },
  { id: "hubspot", name: "HubSpot", authType: "OAuth", actionsCount: 24, color: "#FF7A59" },
  { id: "salesforce", name: "Salesforce", authType: "OAuth", actionsCount: 30, color: "#00A1E0" },
  { id: "github", name: "GitHub", authType: "OAuth", actionsCount: 20, color: "#333333" },
  { id: "jira", name: "Jira", authType: "OAuth", actionsCount: 18, color: "#0052CC" },
  { id: "aws-s3", name: "AWS S3", authType: "API Key", actionsCount: 10, color: "#FF9900" },
  { id: "aws-bedrock", name: "AWS Bedrock", authType: "API Key", actionsCount: 8, color: "#FF9900" },
  { id: "azure-openai", name: "Azure OpenAI", authType: "API Key", actionsCount: 8, color: "#0078D4" },
  { id: "bigquery", name: "BigQuery", authType: "API Key", actionsCount: 12, color: "#4285F4" },
  { id: "stripe", name: "Stripe", authType: "API Key", actionsCount: 14, color: "#6772E5" },
  { id: "twilio", name: "Twilio", authType: "API Key", actionsCount: 10, color: "#F22F46" },
  { id: "zendesk", name: "Zendesk", authType: "OAuth", actionsCount: 20, color: "#03363D" },
  { id: "postgres", name: "PostgreSQL", authType: "API Key", actionsCount: 6, color: "#336791" },
  { id: "mongodb", name: "MongoDB", authType: "API Key", actionsCount: 8, color: "#47A248" },
  { id: "box", name: "Box", authType: "OAuth", actionsCount: 14, color: "#0061D5" },
  { id: "dropbox", name: "Dropbox", authType: "OAuth", actionsCount: 12, color: "#0061FF" },
  { id: "microsoft-teams", name: "Microsoft Teams", authType: "OAuth", actionsCount: 18, color: "#6264A7" },
  { id: "outlook", name: "Outlook", authType: "OAuth", actionsCount: 12, color: "#0078D4" },
]
