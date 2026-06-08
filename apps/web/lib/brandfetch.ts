import { unstable_cache } from "next/cache";

export const BRANDFETCH_DOMAIN_MAP: Record<string, string> = {
  whatsapp:          "whatsapp.com",
  mpesa:             "safaricom.com",
  openai:            "openai.com",
  anthropic:         "anthropic.com",
  google:            "google.com",
  mistral:           "mistral.ai",
  perplexity:        "perplexity.ai",
  "google-calendar": "calendar.google.com",
  "google-drive":    "drive.google.com",
  gmail:             "gmail.com",
  slack:             "slack.com",
  "google-maps":     "maps.google.com",
  notion:            "notion.so",
  hubspot:           "hubspot.com",
  salesforce:        "salesforce.com",
  airtable:          "airtable.com",
  github:            "github.com",
  jira:              "atlassian.com",
  stripe:            "stripe.com",
  postgresql:        "postgresql.org",
  snowflake:         "snowflake.com",
  zapier:            "zapier.com",
  typeform:          "typeform.com",
  linear:            "linear.app",
  zendesk:           "zendesk.com",
  meta:              "meta.com",
  xai:               "x.ai",
  togetherai:        "together.ai",
  cerebras:          "cerebras.net",
};

interface BrandfetchIcon {
  formats: Array<{ src: string; format: string; size?: number | null }>;
}

async function fetchIconForDomain(domain: string): Promise<string | null> {
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = await res.json() as { icons?: BrandfetchIcon[] };
    const formats = data.icons?.[0]?.formats ?? [];
    const svg = formats.find((f) => f.format === "svg");
    const png = formats.find((f) => f.format === "png");
    return (svg ?? png)?.src ?? null;
  } catch {
    return null;
  }
}

const cachedFetchIcon = unstable_cache(fetchIconForDomain, ["brandfetch-icon"], {
  revalidate: 86400,
});

export async function getAllBrandIconUrls(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(BRANDFETCH_DOMAIN_MAP).map(async ([id, domain]) => {
      const url = await cachedFetchIcon(domain);
      return [id, url] as const;
    }),
  );
  return Object.fromEntries(entries.filter(([, url]) => url !== null) as [string, string][]);
}
