# Finebank — Institutional Finance Dashboard

## Product Brief

This is a greenfield project — there is no existing codebase yet.

Purpose: An institutional finance/banking admin dashboard for portfolio
oversight, styled for enterprise clients in asset management, custody,
and insurance (comparable to State Street, Bank of America, Liberty
Mutual use cases).

Intended tech stack:
- Next.js 14 (App Router), TypeScript
- Tailwind CSS for styling
- Recharts for data visualization (NAV/performance charts)
- Deployed on Vercel

Key workflows the UI should support:
- Portfolio/account overview with KPI summary (AUM, daily P&L, risk metrics)
- Holdings table with weight, market value, and change
- Performance chart (NAV over time)
- Alerts/compliance notifications panel
- Sidebar navigation across account sections (Overview, Holdings,
  Cash & Collateral, Corporate Actions, Compliance, Reporting)

Quirks / preferences:
- Design should feel institutional and trustworthy, not like a generic
  consumer fintech app — precise typography, data-dense tables, muted
  professional color palette rather than bright SaaS colors
- Numbers/figures should use a monospace font for tabular alignment
- Source of design: the Figma "Finebank – Financial Management Dashboard
  UI Kits" template (BankDash-style layout), attached separately in the
  Build prompt step

## Getting Started

### Prerequisites

- **Node.js 20.x LTS** (the "Iron" line) and **npm 10.x**.
- The Node version is pinned to **20.x** via `.nvmrc` and the `engines` field
  in `package.json`. **Do not auto-upgrade Node** (and do not migrate to
  Next.js 15/16) — this project targets the Next.js 14 App Router on Node 20.x.
- If you use `nvm`, select the pinned version with `nvm use`.

### Install dependencies

```bash
npm install
```

### Run the development server

Serves the app at http://localhost:3000:

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Start the production server

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Screens

Every screen is a distinct App Router route — **one route per Figma frame** —
and they all share a single layout (`app/layout.tsx`) with a persistent
Sidebar and TopBar. The landing route `/` redirects to `/overview`.

| Section           | Route                 |
|-------------------|-----------------------|
| Overview          | `/overview`           |
| Holdings          | `/holdings`           |
| Cash & Collateral | `/cash-collateral`    |
| Corporate Actions | `/corporate-actions`  |
| Compliance        | `/compliance`         |
| Reporting         | `/reporting`          |

## Project Structure

- `app/` — App Router routes (one `page.tsx` per screen), the root
  `layout.tsx` (shared shell), and `globals.css`.
- `components/` — first-party presentational components: `Sidebar`, `TopBar`,
  `KpiCard`, `HoldingsTable`, `NavChart`, `AlertsPanel`.
- `lib/` — `types.ts` (view models), `mock-data.ts` (static data), `format.ts`
  (monospace currency/percent formatters), and `nav.ts` (six-section route
  config).
- `blitzy-deck/` — a standalone executive-summary reveal.js presentation,
  decoupled from the application.

## Architecture & Conventions

These conventions are binding — please keep contributions consistent with them:

- **One route per screen** — never combine multiple screens into a single page
  with tabs or toggles.
- **Shared layout** — the Sidebar and TopBar live in `app/layout.tsx` and are
  never duplicated inside individual page files.
- **Tailwind CSS only** — no CSS-in-JS, styled-components, Bootstrap, MUI, or
  Ant Design; Tailwind utility classes are the sole styling approach.
- **Static mock data only** — all data lives in `lib/mock-data.ts`; there are
  no `fetch()` calls, no API routes, no database, and no `lib/api/*` modules.
- **Monospace numerics** — all monetary and tabular figures render with
  `font-mono tabular-nums`, formatted through `lib/format.ts`, so columns
  align.
- **Institutional tone** — a muted, professional palette, precise typography,
  and data-dense tables rather than bright consumer-fintech styling.

## Deployment

The app deploys to **Vercel** using Vercel's built-in Next.js
**auto-detection** (`next build`) — there is **no Dockerfile, no custom
server, and no CI configuration** required.

- Production deploys on push to `main`.
- Isolated preview deploys are created for each branch / pull request.
- The Hobby tier is sufficient for this project.
