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
- Source of design: a Figma finance dashboard template (BankDash-style
  layout), attached separately in the Build prompt step
- Specifically, that design source is the Figma "Finebank – Financial
  Management Dashboard UI Kits" template — the authoritative per-frame
  visual reference for this build.

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

## Implementation Status

This repository is being built incrementally from the Figma design. The
**Screens**, **Project Structure**, and **Architecture & Conventions** sections
below describe the _target_ architecture; the lists here clarify what is in
place today versus what is still planned.

**Delivered**
- Project scaffold and configuration (`package.json`, `tsconfig.json`,
  `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`,
  `.gitignore`, `.nvmrc`).
- The design-token layer (`tailwind.config.ts`) and global styles
  (`app/globals.css`).
- The typed data layer in `lib/`: `types.ts`, `mock-data.ts`, `format.ts`, and
  `nav.ts`.
- The landing route `app/page.tsx`, which redirects `/` to `/overview`.
- The shared application shell `app/layout.tsx` (rendering the Sidebar and
  TopBar around every route, with a skip-navigation link and responsive
  padding), plus the App Router brand icon `app/icon.svg`.
- The first-party presentational components under `components/`: `Sidebar`,
  `TopBar`, `KpiCard`, `HoldingsTable`, `NavChart` (Recharts), `AlertsPanel`,
  and the data-dense section tables `CashBalancesTable`, `CollateralTable`,
  `CorporateActionsTable`, and `ReportsTable`.
- Five of the six screen routes under `app/`, each matching its Figma frame:
  `/holdings`, `/cash-collateral`, `/corporate-actions`, `/compliance`, and
  `/reporting`.
- The standalone executive-summary deck under `blitzy-deck/`.

**Planned**
- The `/overview` screen route (`app/overview/page.tsx`) — the composite
  landing screen (KPI cards, the NAV chart, and a compact alerts panel) that
  `/` already redirects to. It is the remaining screen for the final
  six-screen milestone.

## Screens

The architecture is **one route per Figma frame**: each screen is its own App
Router route, and all screens share a single layout (`app/layout.tsx`) with a
persistent Sidebar and TopBar. The shared shell and five of the six routes are
implemented; the landing route `/` redirects to `/overview`, which is the one
remaining screen (see [Implementation Status](#implementation-status)). The six
sections map to these routes:

| Section           | Route                 | Status      |
|-------------------|-----------------------|-------------|
| Overview          | `/overview`           | Planned     |
| Holdings          | `/holdings`           | Implemented |
| Cash & Collateral | `/cash-collateral`    | Implemented |
| Corporate Actions | `/corporate-actions`  | Implemented |
| Compliance        | `/compliance`         | Implemented |
| Reporting         | `/reporting`          | Implemented |

## Project Structure

- `app/` — the App Router directory. In place today: the shared shell
  `layout.tsx`, the brand `icon.svg`, `globals.css`, the `/` → `/overview`
  redirect (`page.tsx`), and one `page.tsx` per implemented screen
  (`holdings/`, `cash-collateral/`, `corporate-actions/`, `compliance/`,
  `reporting/`). Planned: `overview/page.tsx`.
- `components/` — first-party presentational components: `Sidebar`, `TopBar`,
  `KpiCard`, `HoldingsTable`, `NavChart`, `AlertsPanel`, and the data-dense
  section tables `CashBalancesTable`, `CollateralTable`,
  `CorporateActionsTable`, and `ReportsTable`.
- `lib/` — `types.ts` (view models), `mock-data.ts` (static data), `format.ts`
  (monospace currency/percent formatters), and `nav.ts` (six-section route
  config).
- `blitzy-deck/` — a standalone executive-summary reveal.js presentation,
  decoupled from the application.

## Architecture & Conventions

These conventions are binding — please keep contributions consistent with them:

- **One route per screen** — never combine multiple screens into a single page
  with tabs or toggles.
- **Shared layout** — the Sidebar and TopBar belong in `app/layout.tsx` and
  must never be duplicated inside individual page files.
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
