/**
 * app/reporting/page.tsx — Reporting screen (route `/reporting`).
 * ---------------------------------------------------------------------------
 * One of the SIX account sections of the "Finebank" institutional
 * portfolio-oversight dashboard (Next.js 14 App Router + TypeScript + Tailwind).
 * Per the one-route-per-Figma-frame mandate this screen is its OWN route and is
 * NEVER combined with another section behind tabs/toggles (README L19-L20; AAP
 * §0.8.2). It is the sixth entry in the shared navigation
 * (`lib/nav.ts` → `NAV_SECTIONS[5].href === "/reporting"`).
 *
 * RENDERS INSIDE THE SHARED SHELL (no chrome here)
 *   The application shell (`app/layout.tsx`) already renders the persistent
 *   `<Sidebar/>` and `<TopBar/>` and wraps every route in the single
 *   `<main className="flex-1 overflow-y-auto p-6">{children}</main>` landmark.
 *   Therefore this file renders ONLY the page's content sections — it does NOT
 *   re-declare the sidebar, top bar, or a second `<main>` (doing so would
 *   duplicate chrome and break the single-landmark accessibility contract;
 *   AAP §0.8.2 "shared layout / no duplication").
 *
 * RENDERING MODEL — SERVER COMPONENT (load-bearing)
 *   There is intentionally NO `"use client"` directive. The page has no state,
 *   hooks, or event handlers; it composes STATIC data at render time and ships
 *   zero client JavaScript (AAP §0.6.5 — only genuinely interactive pieces such
 *   as `Sidebar` and `NavChart` are client components, and neither appears
 *   here). This keeps the Reporting route fully server-rendered.
 *
 * STATIC DATA ONLY
 *   Every value is imported as a typed constant from `@/lib/mock-data` — the one
 *   and only data source in this phase. There is no `fetch()`, no API route, no
 *   database client, and no `lib/api/*` module anywhere (AAP §0.3.2; the user's
 *   negative example explicitly forbids external data access).
 *
 * MONOSPACE NUMERICS
 *   Every genuine numeric figure (AUM, daily P&L, VaR, and the signed YTD /
 *   day-change deltas) is pre-formatted through `@/lib/format` and rendered by
 *   `KpiCard`, which places `value`/`change` inside `font-mono tabular-nums`
 *   cells so currency and percentage figures align on a fixed-width grid
 *   (README L26; Technical Specification §7.7.2). The header's as-of date is
 *   TEXTUAL (a formatted calendar date), so it stays in `font-sans`.
 *
 * TAILWIND TOKENS ONLY
 *   Third-party UI libraries are forbidden (AAP §0.3.2/§0.5). Every color,
 *   spacing, radius, and type value resolves to a `tailwind.config.ts` token or
 *   a standard Tailwind scale utility — there are zero hardcoded hex values,
 *   inline color styles, or arbitrary one-off values.
 *
 * COMPOSITION (under-specified Figma frame → thin, shared-component build)
 *   The Reporting frame is under-specified (AAP §7.5.3.4, §0.5.4 gap A3), so
 *   this screen is composed exclusively from EXISTING first-party components and
 *   EXISTING static data — no fabricated reports dataset (AAP conservative
 *   default). It mirrors the Compliance screen's pattern (filter the shared
 *   alerts feed by category) and adds a report-context summary built only from
 *   real `account` fields:
 *     1. Page header  — the section title plus the account / as-of / currency
 *        context line.
 *     2. Report summary — the headline institutional figures the periodic
 *        report covers (AUM, daily P&L, risk), reusing `KpiCard`
 *        (README L15 "KPI summary (AUM, daily P&L, risk metrics)").
 *     3. Reporting notifications — `AlertsPanel` scoped to the "Reporting"
 *        category (e.g. "Quarterly report available").
 */

import KpiCard from "@/components/KpiCard";
import AlertsPanel from "@/components/AlertsPanel";
import { account, alerts } from "@/lib/mock-data";
import {
  formatCompactCurrency,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
  formatDate,
  trendDirection,
} from "@/lib/format";

/**
 * Reporting screen server component.
 *
 * Composes the reporting context header, a summary of the report's headline
 * figures, and the reporting-scoped alerts — all from static mock data and
 * shared first-party components. Renders no application chrome (the shell owns
 * the sidebar, top bar, and the single `<main>` landmark).
 *
 * @returns The Reporting screen's content sections.
 */
export default function ReportingPage() {
  // Scope the single shared alerts feed to the Reporting category. This mirrors
  // the Compliance screen (which filters to `"Compliance"`); category strings
  // are exact-case. Exactly one alert currently matches ("Quarterly report
  // available"); if the filter is ever empty, `AlertsPanel` renders its own
  // built-in muted empty state, so no local fallback is added here.
  const reportingAlerts = alerts.filter(
    (alert) => alert.category === "Reporting",
  );

  // As-of label for the header context line. This is a formatted CALENDAR DATE
  // (textual), not a numeric figure, so it is rendered in `font-sans` — only
  // true numeric figures use `font-mono tabular-nums`.
  const asOfLabel = formatDate(account.asOf, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <header className="space-y-1">
        <h1 className="font-sans text-2xl font-semibold text-text">Reporting</h1>
        <p className="font-sans text-sm text-text-muted">
          {`${account.accountName} · As of ${asOfLabel} · ${account.currency}`}
        </p>
      </header>

      {/* ── Report summary — headline figures (real account data only) ──── */}
      <section aria-labelledby="reporting-summary-heading" className="space-y-3">
        <h2
          id="reporting-summary-heading"
          className="font-sans text-base font-semibold text-text"
        >
          Report summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/*
            Portfolio size, with the year-to-date return as the signed,
            direction-tinted change. `value`/`change` are pre-formatted strings;
            `direction` is derived from the sign of the datum (data-driven, so it
            stays correct if the underlying figure ever changes).
          */}
          <KpiCard
            label="Assets Under Management"
            value={formatCompactCurrency(account.aum)}
            change={formatSignedPercent(account.ytdReturnPercent)}
            direction={trendDirection(account.ytdReturnPercent)}
            hint="YTD return"
          />
          {/* Daily profit & loss, with the signed daily percentage as change. */}
          <KpiCard
            label={"Daily P&L"}
            value={formatSignedCurrency(account.dailyPnl, { compact: true })}
            change={formatSignedPercent(account.dailyPnlPercent)}
            direction={trendDirection(account.dailyPnl)}
            hint="Today"
          />
          {/* Risk metric — 1-day 95% Value-at-Risk as a percentage. */}
          <KpiCard
            label="1-Day 95% VaR"
            value={formatPercent(account.varPercent)}
            hint="Value at risk"
          />
        </div>
      </section>

      {/* ── Reporting notifications ──────────────────────────────────────
          `AlertsPanel` is a self-labeled <section> (it renders its own <h2>
          from `title` and its own empty state), so it is rendered directly
          without an extra wrapping heading. */}
      <AlertsPanel alerts={reportingAlerts} title="Reporting" />
    </div>
  );
}
