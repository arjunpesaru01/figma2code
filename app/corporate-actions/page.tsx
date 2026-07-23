/**
 * app/corporate-actions/page.tsx — Corporate Actions route ("/corporate-actions").
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
 * ONLY the Corporate Actions screen body — never combined screens, tabs, or
 * toggles (AAP §0.8.2 negative example). The directory name (`corporate-actions`)
 * fixes the route to exactly `/corporate-actions`, kept in lockstep with
 * `lib/nav.ts` `NAV_SECTIONS[3].href`, the README screen map, and the
 * executive-deck architecture diagram (AAP §0.7.5).
 *
 * FRAME CONTENT — REAL CORPORATE-ACTIONS SURFACE (MJ-03)
 * ------------------------------------------------------------------
 * This screen implements the actual events surface rather than generic account
 * KPIs: a summary band of event counts, a data-dense events table (type,
 * description, ex/pay dates, election deadline, status), and the section-scoped
 * alerts. Every value is sourced from the single typed `corporateActionsData`
 * dataset in `@/lib/mock-data` (AAP §0.5.4: implement the frame from typed data;
 * never fabricate values). The events table is the first-party
 * `CorporateActionsTable` component, keeping this page a thin composition
 * (AAP §0.5.1).
 *
 * RENDERING MODEL — SERVER COMPONENT (load-bearing)
 * ------------------------------------------------------------------
 * There is intentionally NO `"use client"` directive. The screen is pure,
 * stateless presentation — no hooks, no event handlers, no browser-only APIs —
 * so it renders entirely on the server and ships zero client JavaScript of its
 * own (AAP §0.6.5).
 *
 * STATIC DATA ONLY
 * ------------------------------------------------------------------
 * Every value is sourced from the single in-memory dataset in
 * `lib/mock-data.ts`; there is no `fetch()`, no `async` data loading, no API
 * route, no database client, and no `lib/api/*` module (AAP §0.3.2).
 *
 * MONOSPACE NUMERICS & TOKENS
 * ------------------------------------------------------------------
 * Every numeric figure is rendered mono/tabular through `KpiCard` (counts) or
 * `CorporateActionsTable` (dates). The one KPI label containing a genuine
 * number ("Next 30 Days") wraps that number in `font-mono tabular-nums` via the
 * `ReactNode` label so no numeric descendant falls back to the sans face
 * (README L26; MJ-13). Every color/spacing/type value resolves to a
 * `tailwind.config.ts` token — zero hardcoded values (AAP §0.5.1).
 */

import type { Metadata } from "next";

import AlertsPanel from "@/components/AlertsPanel";
import CorporateActionsTable from "@/components/CorporateActionsTable";
import KpiCard from "@/components/KpiCard";
import { alerts, corporateActionsData } from "@/lib/mock-data";
import { formatQuantity } from "@/lib/format";

/**
 * Per-route metadata. Exports the short section label; the root layout's title
 * template composes it into the branded document title "Corporate Actions ·
 * Finebank" (so the suffix is not restated here — MN-07).
 */
export const metadata: Metadata = {
  title: "Corporate Actions",
  description:
    "Upcoming and recent corporate action events, elections, and settlement dates affecting the portfolio.",
};

/**
 * Corporate Actions screen.
 *
 * Composes the real frame from the typed `corporateActionsData` dataset: a
 * summary count band, the events table, and the section-scoped alerts. Renders
 * no application chrome (the shell owns the sidebar, top bar, and the single
 * `<main>` landmark).
 *
 * @returns The Corporate Actions page body.
 */
export default function CorporateActionsPage(): JSX.Element {
  const { summary, events } = corporateActionsData;

  // Scope the single shared alerts feed to this section. The mock dataset
  // includes an "upcoming dividend ex-date" alert here; if the filter were ever
  // empty, `AlertsPanel` renders its own muted empty state.
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
        Summary counts — headline event counts from the typed summary. Counts
        render mono via KpiCard. The "Next 30 Days" label carries a genuine
        number, so that number is wrapped in `font-mono tabular-nums` (the label
        accepts a ReactNode) rather than falling back to the sans label face
        (MJ-13). The other labels are purely textual.
      */}
      <section
        aria-label="Corporate actions summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Pending"
          value={formatQuantity(summary.pendingCount)}
          hint="Awaiting settlement"
        />
        <KpiCard
          label="Elections Required"
          value={formatQuantity(summary.electionsRequiredCount)}
          hint="Instruction needed"
        />
        <KpiCard
          label={
            <>
              Next <span className="font-mono tabular-nums">30</span> Days
            </>
          }
          value={formatQuantity(summary.next30DaysCount)}
          hint="Ex-date or deadline soon"
        />
        <KpiCard
          label="Total Events"
          value={formatQuantity(summary.totalCount)}
          hint="Tracked this period"
        />
      </section>

      {/* Events table — the real corporate-actions surface. */}
      <section aria-labelledby="corporate-actions-events-heading" className="space-y-3">
        <h2
          id="corporate-actions-events-heading"
          className="font-sans text-base font-semibold text-text"
        >
          Events
        </h2>
        <CorporateActionsTable rows={events} />
      </section>

      {/*
        Section alerts — the shared panel, filtered to the Corporate Actions
        category. `title` overrides the panel's default heading; `maxItems` is
        omitted so the full filtered set is shown.
      */}
      <AlertsPanel
        alerts={corporateActionsAlerts}
        title="Corporate Actions Alerts"
        id="alerts-panel-corporate-actions"
      />
    </div>
  );
}
