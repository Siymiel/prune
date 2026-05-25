# Prune AI

> The AI workflow platform for African businesses. WhatsApp-first, M-Pesa-native, Swahili-fluent.

Stack AI is great if you're a US startup with English customers and a Stripe account. We're not. Prune AI is the same idea — visual AI workflows for non-engineers — but built around the channels and money rails that actually move SME business in Nairobi, Mombasa, Kampala, and Kigali.

## What's in here

```
prune-ai/
├── preview.html              ← open in a browser, no install needed
├── apps/
│   ├── web/                  ← Next.js 15 frontend (App Router)
│   └── api/                  ← FastAPI workflow engine + adapters
├── packages/
│   └── workflow-nodes/       ← shared workflow schemas (JSON)
└── docs/
```

**`preview.html`** is the fastest way to see the product. It's a single-file demo of the full UX — all six templates, the interactive chat preview with a live run trace, the inbox, and the dashboard. Open it in any browser.

The Next.js app in `apps/web` is the real codebase that backs the same UI.

## The product — templates, not a builder (yet)

The MVP product surface is the **template gallery**. We have six launch templates, each pre-wired with WhatsApp Business, M-Pesa Daraja, and the right knowledge sources for the vertical:

| Template | Vertical | What it does |
|---|---|---|
| 💇 Salon Booking | Beauty | Books appointments via WhatsApp, takes M-Pesa deposits, sends reminders |
| 🏦 SACCO Support | Financial | Loan inquiries, balance checks, FAQs with secure verification |
| ⛪ Church Follow-Up | Faith | Welcomes visitors, prayer requests, event registration |
| 🏘️ Real Estate Inquiry | Property | Qualifies leads, schedules viewings, hands warm leads to agents |
| 🏥 Clinic Booking | Healthcare | Appointments, refills, emergency escalation, no diagnoses |
| 🍽️ Restaurant Ordering | F&B | Menu, orders, M-Pesa payment, delivery coordination |

A business deploys a template in ~5 minutes, customizes the knowledge base and brand voice, and is live. The visual builder is there but secondary — most businesses never touch it.

## Quickstart

```bash
# preview only (no install)
open preview.html

# full stack
pnpm install
pnpm dev                    # starts web on :3000
cd apps/api && uv sync      # or: pip install -e ".[dev]"
uvicorn prune_api.main:app --reload --port 8000
```

The web app reaches the API at `http://localhost:8000` (set `NEXT_PUBLIC_API_URL` to override).

## Architecture in one paragraph

**Frontend** is Next.js 15 with the App Router, Tailwind, and a Stack-AI-inspired dark theme tuned with warm African earth tones (amber accent, M-Pesa green for payment states). **Backend** is FastAPI hosting a graph-based workflow engine. Workflows are stored as JSON — nodes have a uniform contract (`ok` / `wait` / `error`) so the engine can pause a run on an M-Pesa STK push and resume it when the Daraja callback fires. **Data plane** is Postgres for everything (workflows, runs, conversations, traces) with Redis for the event bus and Qdrant for knowledge-base embeddings. **Multi-tenant** via Postgres RLS, one DB shared across all tenants until volume justifies sharding.

We removed ClickHouse from the v1 plan — Postgres analytics are sufficient until we're past 100 active tenants, and one less system to operate is real.

## Design system

The visual language is Stack AI dark enterprise with two deliberate African touches:

- **Accent: warm amber (`#fcb13a`)** — evokes earth tones, distinct from the cold-blue accents that dominate Silicon Valley SaaS
- **Success / payment: M-Pesa green (`#22c55e`)** — instantly readable for payment confirmations, which are the most important UI state in this product
- **Typography: Geist + Instrument Serif** — Geist for UI density and code-feel; Instrument Serif italic for the rare display moment (page titles, accents) so the brand has a literary touch instead of pure SaaS sterility

Background layers are `#0a0a0b → #111114 → #16161a → #1c1c21` (near-black with subtle elevation). Borders are `rgba(255,255,255,0.06)` default and `0.12` strong. See `apps/web/styles/globals.css`.

## What's stubbed vs real

- ✅ **Real**: design system, template data, chat preview UX, run trace visualization, page routing, FastAPI scaffold with engine contract
- 🟡 **Stubbed**: M-Pesa Daraja calls (returns fake checkout IDs), WhatsApp Cloud API (webhook accepts but doesn't dispatch), Claude API calls (replaced with keyword router for demo)
- 🔴 **Pending**: visual workflow builder (React Flow), real DB schema migrations, Qdrant integration, billing

## License

UNLICENSED — proprietary while we figure out what we're doing.
