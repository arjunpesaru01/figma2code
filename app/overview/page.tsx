/**
 * app/overview/page.tsx — Overview screen (the `/overview` route).
 * ---------------------------------------------------------------------------
 * The Overview route of the "Finebank" institutional portfolio-oversight
 * dashboard (Next.js 14 App Router + TypeScript + Tailwind CSS). It is the
 * application's PRIMARY LANDING VIEW — the root `/` (`app/page.tsx`) performs
 * `redirect('/overview')`, so this is the first screen every user sees.
 *
 * THE ONLY COMPOSITE SCREEN (by design):
 *   Where the other five routes each render a single primary component, the
 *   Overview assembles THREE surfaces into one at-a-glance summary, matching the
 *   README workflow (L14-18):
 *     1. a KPI summary — AUM, daily P&L, YTD return, and a risk metric;
 *     2. the NAV / performance chart over time; and
 *     3. a compact alerts / compliance notifications panel.
 *   It distributes the static `OverviewProps` data (`account`, `navSeries`,
 *   `alerts`) into the shared first-party components (`KpiCard`, `NavChart`,
 *   `AlertsPanel`) and does nothing else — no chrome, no formatting/state logic.
 *   (AAP §7.5.3.1, §0.6.5; the Figma "Finebank" Overview frame, node-id=443-2616.)
 *
 * CONTRACT (every point enforced below — AAP §0.6.5, §0.8.2, §7.5.3.1):
 *   • SERVER COMPONENT. There is intentionally NO `"use client"` directive and
 *     the function is NOT `async`: the page is a pure, static projection this
 *     phase (no interactivity, no awaited data). It renders `NavChart` — itself
 *     a `"use client"` component because Recharts measures the DOM — which is
 *     the correct server→client composition; this page needs no client boundary
 *     of its own (AAP §0.6.5).
 *   • STATIC DATA ONLY. Every value is a static in-memory import from
 *     `@/lib/mock-data`. There is no `fetch()`, no `async`/`await`, no API
 *     route, no database client, and no `lib/api/*` (AAP §0.3.2; the user's
 *     negative example forbids a `lib/api/holdings.ts`).
 *   • MONOSPACE NUMERICS. Every dollar/percent figure is PRE-FORMATTED here via
 *     `@/lib/format` and passed as a STRING into `KpiCard`, which renders it in
 *     `font-mono tabular-nums`. No raw numbers are rendered and no figure falls
 *     back to the body font (README L26; AAP §0.8.2). The brief's anchor figures
 *     `$468.2M` (AUM) and `+13.6%` (YTD) are therefore visible on screen. The
 *     as-of calendar DATE is textual (not a tabular figure), so — consistent
 *     with `TopBar`/`AlertsPanel` — it renders in the sans face.
 *   • TOKENS ONLY. Every color/spacing/radius/type resolves to a
 *     `tailwind.config.ts` token or a standard Tailwind scale utility — no
 *     inline `style`, no hex literals, no arbitrary `[…]` values (AAP §0.5.1).
 *   • NO CHROME. The `<html>`/`<body>`, the sidebar (`<nav>`), and the top bar
 *     (banner) are owned once by `app/layout.tsx`, which already wraps every
 *     route in `<main …>{children}</main>` with its own padding. This page
 *     renders ONLY the Overview content region and adds no outer page padding
 *     (AAP §0.8.2 "no duplication").
 *   • NO DOUBLE-WRAPPING. `KpiCard`, `NavChart`, and `AlertsPanel` each render
 *     their OWN bordered card container. They are placed directly into grid
 *     cells here; no extra card/border is wrapped around them (which would
 *     produce a nested double border).
 *
 * ROUTE / SLUG SYNC (AAP §0.7.5):
 *   The directory name `overview` (route `/overview`) is kept in lockstep with
 *   `lib/nav.ts` (`NAV_SECTIONS[0].href === "/overview"`), the redirect target
 *   in `app/page.tsx`, the README screen map, and the executive-deck diagram.
 */

import type { Metadata } from "next";

import KpiCard from "@/components/KpiCard";
import NavChart from "@/components/NavChart";
import AlertsPanel from "@/components/AlertsPanel";
import { account, navSeries, alerts } from "@/lib/mock-data";
import {
  formatCompactCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatDate,
  trendDirection,
} from "@/lib/format";

/**
 * Per-route metadata. Exports the short section label; the root layout's title
 * template (`"%s · Finebank"`) composes it into the branded document title
 * "Overview · Finebank", giving the landing route a distinct, descriptive
 * `<title>` rather than inheriting the generic root default.
 */
export const metadata: Metadata = {
  title: "Overview",
  description:
    "Portfolio overview: assets under management, daily P&L, year-to-date return, risk, NAV performance, and recent alerts for the institutional composite.",
};

/**
 * Overview screen — `/overview`.
 *
 * A synchronous, default-exported React Server Component. App Router page
 * components take no props; this one distributes the static `account`,
 * `navSeries`, and `alerts` constants into the shared presentational
 * components, pre-formatting every numeric figure through `@/lib/format` so it
 * renders in the monospace, tabular-aligned typeface.
 *
 * Structure (desktop-first, data-dense):
 *   1. HEADER      — the single `<h1>` screen title plus a muted context line
 *                    (mandate name + as-of date).
 *   2. KPI GRID    — four `KpiCard`s (AUM, Daily P&L, YTD Return, Risk),
 *                    responsive 1 → 2 → 4 columns.
 *   3. CONTENT ROW — the NAV chart in the wider column beside a compact alerts
 *                    summary, responsive 1 → 3 columns (chart spans 2).
 *
 * @returns The Overview content region. The surrounding shell (sidebar, top
 *   bar, and the `<main>` padding) is provided by `app/layout.tsx`, so nothing
 *   here re-declares that chrome.
 */
export default function OverviewPage() {
  // Precompute the as-of label once (mirrors the TopBar pattern). `formatDate`
  // fixes the time zone to UTC so a date-only ISO string never drifts a day in
  // negative-offset locales; the medium parts yield e.g. "Jun 28, 2024".
  const asOfLabel = formatDate(account.asOf, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/*
        SCREEN HEADER — the single <h1> landmark for this route plus a muted,
        institutional context line. The TopBar already carries the persistent
        account chrome, so this stays light: the mandate name and the as-of
        date (rendered in a semantic <time>, in the sans face because a calendar
        date is textual, not a tabular figure). Token-only, no invented content.
      */}
      <header className="space-y-1">
        <h1 className="font-sans text-2xl font-semibold text-text">Overview</h1>
        <p className="text-sm text-text-muted">
          {account.accountName} · As of{" "}
          <time dateTime={account.asOf} className="font-sans">
            {asOfLabel}
          </time>
        </p>
      </header>

      {/*
        KPI GRID — four headline statistics from `account`. Every value/change
        is a PRE-FORMATTED string from `@/lib/format`, so KpiCard renders it in
        font-mono tabular-nums; the required anchor figures "$468.2M" (AUM) and
        "+13.6%" (YTD) appear here. Responsive: 1 column on mobile, 2 from `sm`,
        4 from `xl`. Each KpiCard owns its own card — no extra wrapper is added.
      */}
      <section
        aria-label="Key portfolio metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Assets Under Management"
          value={formatCompactCurrency(account.aum)}
          hint={`Base currency · ${account.currency}`}
        />
        <KpiCard
          label="Daily P&L"
          value={formatSignedCurrency(account.dailyPnl, { compact: true })}
          change={formatSignedPercent(account.dailyPnlPercent)}
          direction={trendDirection(account.dailyPnl)}
        />
        <KpiCard
          label="YTD Return"
          value={formatSignedPercent(account.ytdReturnPercent)}
          direction={trendDirection(account.ytdReturnPercent)}
        />
        <KpiCard
          label="Risk"
          value={account.riskLevel}
          hint={`VaR ${formatPercent(account.varPercent)}`}
          direction="flat"
        />
      </section>

      {/*
        CONTENT ROW — the NAV/performance chart beside a compact alerts summary.
        Responsive: stacked on mobile, a 3-column grid from `lg` where the chart
        spans two columns and the alerts panel takes one. Both NavChart and
        AlertsPanel render their OWN bordered surface card, so each sits directly
        in its grid cell with only a `col-span` wrapper — never a second card.
      */}
      <section
        aria-label="Performance and recent alerts"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <NavChart data={navSeries} />
        </div>
        <div className="lg:col-span-1">
          <AlertsPanel alerts={alerts} maxItems={3} title="Recent Alerts" />
        </div>
      </section>
    </div>
  );
}
