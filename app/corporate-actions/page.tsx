/**
 * app/corporate-actions/page.tsx — Corporate Actions route screen (`/corporate-actions`).
 * ---------------------------------------------------------------------------
 * The App Router page for the **Corporate Actions** section of the "Finebank"
 * institutional portfolio-oversight dashboard (Next.js 14 App Router +
 * TypeScript + Tailwind CSS). It is one of the six account sections listed in
 * the shared sidebar (Overview, Holdings, Cash & Collateral, Corporate Actions,
 * Compliance, Reporting — README L19-20).
 *
 * ONE ROUTE PER FRAME
 * ------------------------------------------------------------------
 * Following the strict one-route-per-Figma-frame structure, this file renders
 * ONLY the Corporate Actions screen body. It never combines other screens,
 * tabs, or toggles (AAP §0.8.2 negative example). The directory name
 * (`corporate-actions`) fixes the route to exactly `/corporate-actions`, which
 * MUST stay in lockstep with `lib/nav.ts` `NAV_SECTIONS[3].href`, the README
 * screen map, and the executive-deck architecture diagram (AAP §0.7.5).
 *
 * SHELL OWNERSHIP — THIS FILE RENDERS THE PAGE BODY ONLY
 * ------------------------------------------------------------------
 * The persistent application chrome (`<Sidebar />` + `<TopBar />`) and the
 * scrollable content region live in the shared root layout (`app/layout.tsx`),
 * which wraps this page's output in `<main className="flex-1 overflow-y-auto
 * p-6">{children}</main>`. Consequently this module deliberately does NOT
 * declare a sidebar, top bar, `<html>`, `<body>`, or `<main>`, and adds no
 * outer page padding (the layout's `<main>` already supplies `p-6`). The body
 * is a single root `<div>` using vertical spacing so the sections stack with a
 * consistent institutional rhythm.
 *
 * RENDERING MODEL — SERVER COMPONENT (load-bearing)
 * ------------------------------------------------------------------
 * There is intentionally NO `"use client"` directive. The screen is pure,
 * stateless presentation — no hooks, no event handlers, no browser-only APIs —
 * so it renders entirely on the server as a React Server Component and ships
 * zero client JavaScript of its own (AAP §0.6.5 lists only `Sidebar` and
 * `NavChart` as client components).
 *
 * STATIC DATA ONLY
 * ------------------------------------------------------------------
 * Every value is sourced from the single in-memory dataset in
 * `lib/mock-data.ts`; there is no `fetch()`, no `async` data loading, no API
 * route, no database client, and no `lib/api/*` module (AAP §0.3.2). The shared
 * `alerts` array is filtered to this section's category, and the real
 * `account` KPI figures supply institutional portfolio context — no
 * corporate-actions dataset is invented here (AAP §0.5.4: implement to match
 * the frame; do not fabricate content).
 *
 * COMPOSITION (reuse first-party components — AAP §0.5.1)
 * ------------------------------------------------------------------
 *   1. A semantic page header (the screen's single `<h1>`).
 *   2. A restrained, real-data KPI context strip built from `KpiCard` — pure
 *      portfolio context (AUM, YTD return, daily P&L), NOT invented corporate-
 *      actions figures. This gives the screen the institutional density the
 *      frame calls for without duplicating a data layer.
 *   3. The shared `AlertsPanel`, filtered to the Corporate Actions category,
 *      which surfaces the upcoming dividend ex-date notification (and renders
 *      its own muted empty state should the filter ever be empty).
 *
 * MONOSPACE NUMERICS & TOKENS
 * ------------------------------------------------------------------
 * Every numeric figure is a PRE-FORMATTED string from `lib/format.ts`, surfaced
 * through `KpiCard`, which renders `value`/`change` in `font-mono tabular-nums`
 * so currency and percentage figures use fixed-width, vertically aligned glyphs
 * (README L26). No raw numbers are rendered in the body font. Every color,
 * spacing, radius, and type value resolves to a `tailwind.config.ts` semantic
 * token — there are zero hardcoded hex/px/arbitrary values (AAP §0.5.1).
 */

import type { Metadata } from "next";

import AlertsPanel from "@/components/AlertsPanel";
import KpiCard from "@/components/KpiCard";
import { account, alerts } from "@/lib/mock-data";
import {
  formatCompactCurrency,
  formatDate,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
  trendDirection,
} from "@/lib/format";

/**
 * Per-route metadata. Sets the browser-tab title for the Corporate Actions
 * screen, kept consistent with the rest of the app's `"<Section> — Finebank"`
 * titling convention.
 */
export const metadata: Metadata = {
  title: "Corporate Actions — Finebank",
};

/**
 * Corporate Actions screen.
 *
 * Renders the Corporate Actions page body: a header, a small real-data KPI
 * context strip, and the shared alerts panel filtered to this section. Composed
 * entirely from static in-memory data and first-party components.
 *
 * @returns The Corporate Actions page body (the shared layout supplies the
 *   surrounding shell and content padding).
 */
export default function CorporateActionsPage(): JSX.Element {
  // Scope the single shared alerts dataset to this section. The mock dataset
  // includes a warning-severity "upcoming dividend ex-date" alert in this
  // category, so the filtered list contains at least one row. If it were ever
  // empty, `AlertsPanel` renders its own muted "No active alerts" state — the
  // correct conservative fallback (we never fabricate alerts to fill it).
  const corporateActionsAlerts = alerts.filter(
    (a) => a.category === "Corporate Actions",
  );

  return (
    <div className="space-y-6">
      {/* Page header — the single <h1> for this screen (the layout renders none). */}
      <header className="space-y-1">
        <h1 className="font-sans text-2xl font-semibold text-text">
          Corporate Actions
        </h1>
        <p className="text-sm text-text-muted">
          Upcoming and recent corporate action events affecting the portfolio.
        </p>
      </header>

      {/*
        Institutional context strip — REAL account KPIs only (AUM, YTD return,
        daily P&L). This is genuine portfolio context, not invented corporate-
        actions data. Each figure is a pre-formatted string rendered by KpiCard
        in `font-mono tabular-nums`. The grid is a token-based responsive layout
        (1 col → 2 cols ≥sm → 3 cols ≥lg) that stays data-dense on desktop.
      */}
      <section
        aria-label="Portfolio context"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <KpiCard
          label="Assets Under Management"
          value={formatCompactCurrency(account.aum)}
          hint={`As of ${formatDate(account.asOf, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`}
        />
        <KpiCard
          label="YTD Return"
          value={formatPercent(account.ytdReturnPercent)}
          hint="Year to date"
        />
        <KpiCard
          label="Daily P&L"
          value={formatSignedCurrency(account.dailyPnl, { compact: true })}
          change={formatSignedPercent(account.dailyPnlPercent)}
          direction={trendDirection(account.dailyPnl)}
        />
      </section>

      {/*
        Section alerts — the shared panel, filtered to the Corporate Actions
        category. `title` overrides the panel's default heading so it reads for
        this section; `maxItems` is intentionally omitted so the full filtered
        set is shown.
      */}
      <AlertsPanel alerts={corporateActionsAlerts} title="Corporate Actions" />
    </div>
  );
}
