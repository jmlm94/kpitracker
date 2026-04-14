# Carbinox KPI Tracker

One dashboard for every KPI, target, and owner across Carbinox. Built with
Next.js 14 (App Router) and Tailwind, deployable to Vercel out of the box.

## What it does

- **Departments → People → KPIs → Targets → Progress.** Every team member
  owns zero or more KPIs. Every KPI has a target and a live "actual" pulled
  from the source of truth. Managers are listed as watchers on their reports'
  KPIs so underperformance rolls up visibly.
- **Status at a glance.** Each KPI is classified as *Ahead / On track / At
  risk / Off track* based on progress-to-pace, with support for
  `higher_is_better` and `lower_is_better` metrics (e.g. first-response time).
- **Daily automatic refresh.** A Vercel cron hits `/api/cron/refresh` at
  06:00 UTC every day. Connectors for each data source live in
  `lib/connectors/*`.
- **Onboarding wizard.** Four steps — Departments, Team, KPIs & Targets,
  Integrations — so the tool is useful from the first session.
- **Manual "Sync now"** button in the top bar for on-demand refreshes.

## Getting started locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app ships with seed data mirroring the
example in the spec (Simona Saule · Meta ROAS 1.2 today, 1.63 last 7 days,
target 1.6; Damian Perez as head of advertising watching it).

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — zero config needed.
3. Add integration credentials as **Environment Variables** (see table below).
   Any connector whose vars aren't set will fall back to simulated data so
   the UI stays functional.
4. The cron in `vercel.json` runs `/api/cron/refresh` daily. Optionally set
   `CRON_SECRET` to require `Authorization: Bearer <secret>` on that route.

### Environment variables per integration

| Provider       | Variables                                                        |
| -------------- | ---------------------------------------------------------------- |
| Shopify        | `SHOPIFY_SHOP`, `SHOPIFY_ADMIN_TOKEN`                            |
| Triple Whale   | `TRIPLEWHALE_API_KEY`, `TRIPLEWHALE_SHOP_ID`                     |
| Klaviyo        | `KLAVIYO_PRIVATE_KEY`                                            |
| Postscript     | `POSTSCRIPT_API_KEY`                                             |
| Zendesk        | `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN`        |
| Google Sheets  | `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`        |
| Cron           | `CRON_SECRET` *(optional)*                                       |

## Adding a real integration

Each provider has a stub under `lib/connectors/<provider>.ts`. Each returns
`{ today, last7, mtd, samples[], source }`. Replace the `simulate(...)`
call with a real API request — the rest of the app immediately consumes
the live numbers.

## Data persistence

For MVP, the client-side state (departments, team, KPIs, targets) is stored
in `localStorage` so the tool works immediately without any DB. When you're
ready for multi-user production use, the natural next step is to swap the
store in `lib/store.tsx` for Vercel KV or Postgres and move progress
persistence server-side.

## Project layout

```
app/
  page.tsx                    — dashboard
  onboarding/                 — four-step setup wizard
  departments/                — department list + detail
  team/                       — team list + member detail
  kpis/                       — KPI + target table
  integrations/               — connection manager
  api/
    sync/[provider]/          — sync one provider on demand
    sync/all/                 — refresh all providers
    cron/refresh/             — daily Vercel cron entrypoint
components/                   — UI primitives (KPICard, DepartmentCard, …)
lib/
  types.ts                    — core data model
  seed.ts                     — starter data mirroring the spec example
  store.tsx                   — client state with localStorage persistence
  format.ts                   — value formatting + status classification
  connectors/                 — one file per data source
vercel.json                   — daily cron schedule
```
