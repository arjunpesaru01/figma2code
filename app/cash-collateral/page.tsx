/**
 * app/cash-collateral/page.tsx — Cash & Collateral route ("/cash-collateral").
 * ---------------------------------------------------------------------------
 * The third of the six account sections in the "Finebank" institutional
 * portfolio-oversight dashboard (Overview, Holdings, Cash & Collateral,
 * Corporate Actions, Compliance, Reporting — README L19-20). Following the
 * strict one-route-per-screen structure (AAP §0.3.1, §0.8.2), this Figma frame
 * is reproduced as its own App Router route; the directory name `cash-collateral`
 * fixes the slug so it matches `lib/nav.ts` `NAV_SECTIONS[2].href` exactly.
 *
 * FRAME CONTENT — REAL CASH & COLLATERAL SURFACE (MJ-02)
 * ------------------------------------------------------------------
 * This screen implements the actual Cash & Collateral business surface rather
 * than generic account KPIs: a summary band of cash/collateral headline figures,
 * a cash-balances-by-currency table, a pledged/received collateral table, and
 * the section-scoped alerts. Every figure is sourced from the single typed
 * `cashCollateralData` dataset in `@/lib/mock-data` (AAP §0.5.4: implement the
 * frame from typed data; never fabricate values at the call site). The two
 * tables are the first-party `CashBalancesTable` / `CollateralTable` components,
 * keeping this page a thin composition (AAP §0.5.1).
 *
 * RENDERING MODEL — SERVER COMPONENT (load-bearing)
 * ------------------------------------------------------------------
 * There is intentionally NO `"use client"` directive. The page holds no state,
 * uses no hooks, and registers no event handlers, so it renders entirely on the
 * server as a React Server Component (AAP §0.6.5). All chrome (Sidebar + TopBar)
 * is provided ONCE by `app/layout.tsx`, whose `<main>` already applies the page
 * padding — so this file adds NO outer padding wrapper and renders NO navigation.
 *
 * DATA — STATIC, IN-MEMORY ONLY
 * ------------------------------------------------------------------
 * Composition draws EXCLUSIVELY from typed constants exported by
 * `@/lib/mock-data`; there is no `fetch()`, no async/await, no API route, no
 * database client, and no `lib/api/*` module (AAP §0.3.2 + the brief's negative
 * example).
 *
 * STYLING — TOKENS ONLY (tailwind.config.ts is the single source of truth)
 * ------------------------------------------------------------------
 * Every color, spacing, radius, and type value resolves to a semantic Tailwind
 * token or a standard Tailwind scale utility (AAP §0.5.1). Numeric figures are
 * pre-formatted through `@/lib/format` and rendered via `KpiCard` / the table
 * components, which apply `font-mono tabular-nums` (README L26). Every KPI label
 * is purely TEXTUAL (no numeric fragment in the sans label face — MJ-13).
 */

import type { Metadata } from "next";

import AlertsPanel from "@/components/AlertsPanel";
import CashBalancesTable from "@/components/CashBalancesTable";
import CollateralTable from "@/components/CollateralTable";
import KpiCard from "@/components/KpiCard";
import { alerts, cashCollateralData } from "@/lib/mock-data";
import { formatCompactCurrency, formatPercent } from "@/lib/format";

/**
 * App Router page metadata for the Cash & Collateral screen. The literal `&`
 * here is a plain string value (not JSX text), so no HTML entity escaping is
 * required. Rendered by Next.js into the document `<title>`/`<meta>` tags; the
 * root template turns this into "Cash & Collateral · Finebank".
 */
export const metadata: Metadata = {
  title: "Cash & Collateral",
  description:
    "Cash positions by currency and pledged/received collateral coverage for the institutional portfolio.",
};

/**
 * Cash & Collateral route ("/cash-collateral").
 *
 * Composes the real frame from the typed `cashCollateralData` dataset: a summary
 * KPI band, the cash-balances table, the collateral table, and section alerts —
 * all through first-party components that enforce monospace numerics and
 * token-only styling.
 *
 * @returns The Cash & Collateral screen element.
 */
export default function CashCollateralPage() {
  const { summary, cashBalances, collateral } = cashCollateralData;

  // Narrow the shared, section-agnostic alerts feed to only the Cash &
  // Collateral notifications (the seeded dataset includes a collateral-shortfall
  // warning that reconciles with the sub-100% coverage below). The empty-filter
  // case is handled by `AlertsPanel`'s own empty state.
  const cashAlerts = alerts.filter((a) => a.category === "Cash & Collateral");

  return (
    <div className="flex flex-col gap-6">
      {/* 1) Page header — the single <h1> for the route (the layout owns the
          surrounding landmarks). The ampersand uses the `&amp;` HTML entity in
          JSX text to stay clean under `react/no-unescaped-entities`. */}
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-semibold text-text">
          Cash &amp; Collateral
        </h1>
        <p className="font-sans text-sm text-text-muted">
          Cash positions by currency and collateral coverage, in the account base
          currency.
        </p>
      </header>

      {/* 2) Summary KPIs — headline cash/collateral figures from the typed
          summary. Labels are purely textual; values render mono via KpiCard. */}
      <section
        aria-label="Cash and collateral summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Total Cash"
          value={formatCompactCurrency(summary.totalCashBase)}
          hint="Across all currencies"
        />
        <KpiCard
          label="Available Cash"
          value={formatCompactCurrency(summary.availableCashBase)}
          hint="Unencumbered"
        />
        <KpiCard
          label="Collateral Pledged"
          value={formatCompactCurrency(summary.collateralPledgedBase)}
          hint="Posted to counterparties"
        />
        <KpiCard
          label="Collateral Coverage"
          value={formatPercent(summary.collateralCoveragePercent)}
          hint="Posted vs. margin requirement"
        />
      </section>

      {/* 3) Cash balances by currency. */}
      <section aria-labelledby="cash-balances-heading" className="space-y-3">
        <h2
          id="cash-balances-heading"
          className="font-sans text-base font-semibold text-text"
        >
          Cash balances
        </h2>
        <CashBalancesTable rows={cashBalances} />
      </section>

      {/* 4) Pledged and received collateral. */}
      <section aria-labelledby="collateral-heading" className="space-y-3">
        <h2
          id="collateral-heading"
          className="font-sans text-base font-semibold text-text"
        >
          Collateral positions
        </h2>
        <CollateralTable rows={collateral} />
      </section>

      {/* 5) Section-relevant alerts. `AlertsPanel` renders its own empty state,
          so no extra guard is needed. The literal `&` inside the `title`
          attribute string is fine — the unescaped-entities rule applies to JSX
          text children, not to attribute string literals. */}
      <AlertsPanel
        alerts={cashAlerts}
        title="Cash & Collateral Alerts"
        id="alerts-panel-cash-collateral"
      />
    </div>
  );
}
