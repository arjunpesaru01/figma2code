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
 * FRAME CONTENT — REAL REPORTING SURFACE (MJ-04)
 * ------------------------------------------------------------------
 * This screen implements the actual reporting surface rather than generic
 * account KPIs: a summary band of report counts by status, a data-dense report
 * inventory table (name, period, format, status, generated date, size), and the
 * section-scoped alerts. Every value is sourced from the single typed
 * `reportingData` dataset in `@/lib/mock-data` (AAP §0.5.4: implement the frame
 * from typed data; never fabricate). The inventory table is the first-party
 * `ReportsTable` component, keeping this page a thin composition (AAP §0.5.1).
 *
 * RENDERS INSIDE THE SHARED SHELL (no chrome here)
 *   The application shell (`app/layout.tsx`) already renders the persistent
 *   `<Sidebar/>` and `<TopBar/>` and wraps every route in the single
 *   `<main>` landmark. This file renders ONLY the page's content sections — it
 *   does NOT re-declare the sidebar, top bar, or a second `<main>` (AAP §0.8.2
 *   "shared layout / no duplication").
 *
 * RENDERING MODEL — SERVER COMPONENT (load-bearing)
 *   There is intentionally NO `"use client"` directive. The page has no state,
 *   hooks, or event handlers; it composes STATIC data at render time and ships
 *   zero client JavaScript (AAP §0.6.5).
 *
 * STATIC DATA ONLY
 *   Every value is imported as a typed constant from `@/lib/mock-data` — the one
 *   and only data source in this phase. There is no `fetch()`, no API route, no
 *   database client, and no `lib/api/*` module anywhere (AAP §0.3.2).
 *
 * MONOSPACE NUMERICS
 *   Every genuine numeric figure (report counts, generated dates, file sizes) is
 *   rendered mono/tabular through `KpiCard` / `ReportsTable` (README L26;
 *   Technical Specification §7.7.2). All KPI labels are purely TEXTUAL — no
 *   numeric fragment renders in the sans label face (MJ-13). The period column
 *   labels (e.g. "Q2 2024") are pre-composed textual strings authored in the
 *   dataset, shown in the inventory table.
 *
 * TAILWIND TOKENS ONLY
 *   Third-party UI libraries are forbidden (AAP §0.3.2/§0.5). Every color,
 *   spacing, radius, and type value resolves to a `tailwind.config.ts` token or
 *   a standard Tailwind scale utility — zero hardcoded values.
 */

import type { Metadata } from "next";

import AlertsPanel from "@/components/AlertsPanel";
import KpiCard from "@/components/KpiCard";
import ReportsTable from "@/components/ReportsTable";
import { alerts, account, reportingData } from "@/lib/mock-data";
import { formatDate, formatQuantity } from "@/lib/format";

/**
 * Per-route metadata (MN-07 — Reporting previously inherited the generic root
 * title). Exports the short section label; the root layout's title template
 * composes it into "Reporting · Finebank".
 */
export const metadata: Metadata = {
  title: "Reporting",
  description:
    "Downloadable performance, holdings, risk, and compliance reports for the institutional portfolio.",
};

/**
 * Reporting screen server component.
 *
 * Composes the real reporting frame from the typed `reportingData` dataset: a
 * report-count summary band, the report inventory table, and the reporting-
 * scoped alerts — all from static mock data and first-party components. Renders
 * no application chrome (the shell owns the sidebar, top bar, and `<main>`).
 *
 * @returns The Reporting screen's content sections.
 */
export default function ReportingPage() {
  const { summary, reports } = reportingData;

  // Scope the single shared alerts feed to the Reporting category (mirrors the
  // Compliance screen's category filter). Exactly one alert currently matches
  // ("Quarterly report available"); if the filter is ever empty, `AlertsPanel`
  // renders its own built-in muted empty state, so no local fallback is added.
  const reportingAlerts = alerts.filter(
    (alert) => alert.category === "Reporting",
  );

  // As-of label for the header context line. This is a formatted CALENDAR DATE
  // (textual prose), so it stays in `font-sans` — only true numeric figures use
  // `font-mono tabular-nums` (README L26; the reviewer's MJ-12 nuance permits a
  // formatted calendar date in prose to remain sans).
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
          {`${account.accountName} · As of ${asOfLabel}`}
        </p>
      </header>

      {/* ── Report summary — counts by status (real reporting data only) ───
          Counts render mono via KpiCard; every label is purely textual (MJ-13). */}
      <section
        aria-label="Reporting summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Available"
          value={formatQuantity(summary.availableCount)}
          hint="Ready to download"
        />
        <KpiCard
          label="Generating"
          value={formatQuantity(summary.generatingCount)}
          hint="In progress"
        />
        <KpiCard
          label="Scheduled"
          value={formatQuantity(summary.scheduledCount)}
          hint="Queued to run"
        />
        <KpiCard
          label="Total Reports"
          value={formatQuantity(summary.totalCount)}
          hint="Tracked inventory"
        />
      </section>

      {/* ── Report inventory table — the real reporting surface ──────────── */}
      <section aria-labelledby="report-inventory-heading" className="space-y-3">
        <h2
          id="report-inventory-heading"
          className="font-sans text-base font-semibold text-text"
        >
          Report inventory
        </h2>
        <ReportsTable rows={reports} />
      </section>

      {/* ── Reporting notifications ──────────────────────────────────────
          `AlertsPanel` is a self-labeled <section> (it renders its own <h2>
          and empty state), so it is rendered directly. */}
      <AlertsPanel
        alerts={reportingAlerts}
        title="Reporting Alerts"
        id="alerts-panel-reporting"
      />
    </div>
  );
}
