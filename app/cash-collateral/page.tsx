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
 * RENDERING MODEL — SERVER COMPONENT (load-bearing)
 * ------------------------------------------------------------------
 * There is intentionally NO `"use client"` directive. The page holds no state,
 * uses no hooks, and registers no event handlers, so it renders entirely on the
 * server as a React Server Component (AAP §0.6.5: the client directive is used
 * only where interactivity truly requires it — here it does not). All of the
 * chrome (Sidebar + TopBar) is provided ONCE by `app/layout.tsx`, whose `<main>`
 * already applies the page padding — so this file adds NO outer padding wrapper
 * and renders NO navigation of its own (avoids duplicate chrome + double padding).
 *
 * DATA — STATIC, IN-MEMORY ONLY
 * ------------------------------------------------------------------
 * Composition draws EXCLUSIVELY from the typed constants exported by
 * `@/lib/mock-data`; there is no `fetch()`, no async/await, no API route, no
 * database client, and no `lib/api/*` module (AAP §0.3.2 + the brief's explicit
 * negative example). Because the authoritative composition of this frame is the
 * Figma "Finebank" Cash & Collateral frame, which is not programmatically
 * extractable in this environment (AAP §0.10.1/§0.10.2), the page deliberately
 * does NOT fabricate cash/collateral-specific metrics that do not exist in the
 * single data source. Instead it surfaces a small band of REAL account context
 * KPIs (reporting currency, AUM, VaR/risk) and the section-relevant alerts. If
 * the frame later requires genuine cash/collateral figures, they must be ADDED
 * to `lib/mock-data.ts` (the single source of truth) — never hardcoded here and
 * never fetched (AAP §0.5.4 gap inventory).
 *
 * STYLING — TOKENS ONLY (tailwind.config.ts is the single source of truth)
 * ------------------------------------------------------------------
 * Every color, spacing, radius, and type value resolves to a semantic Tailwind
 * token declared in `tailwind.config.ts` or to a standard Tailwind scale utility
 * (AAP §0.5.1). There are ZERO hardcoded hex/px/arbitrary values here. Numeric
 * figures are pre-formatted through `@/lib/format` and rendered via `KpiCard`,
 * which applies `font-mono tabular-nums` so currency/percentage values use
 * tabular (fixed-width) glyphs (README L26 monospace-numeric requirement).
 */

import type { Metadata } from "next";

import AlertsPanel from "@/components/AlertsPanel";
import KpiCard from "@/components/KpiCard";
import { alerts, account } from "@/lib/mock-data";
import { formatCompactCurrency, formatPercent } from "@/lib/format";

/**
 * App Router page metadata for the Cash & Collateral screen. The literal `&`
 * here is a plain string value (not JSX text), so no HTML entity escaping is
 * required. Rendered by Next.js into the document `<title>`/`<meta>` tags.
 */
export const metadata: Metadata = {
  title: "Cash & Collateral — Finebank",
  description:
    "Cash positions, reporting currency, and collateral coverage for the institutional portfolio.",
};

/**
 * Cash & Collateral route ("/cash-collateral").
 *
 * A thin, presentational composition: it filters the shared alerts down to this
 * section and surfaces a compact band of real account-context KPIs — all through
 * first-party components that already enforce monospace numerics and token-only
 * styling. This keeps the page fully compliant with the one-route-per-screen,
 * shared-shell, static-data-only, and monospace-numeric mandates while honoring
 * the "do not invent content" rule for this under-specified Figma frame.
 *
 * @returns The Cash & Collateral screen element.
 */
export default function CashCollateralPage() {
  // Narrow the shared, section-agnostic alerts feed to only the Cash &
  // Collateral notifications. The seeded dataset includes at least one such
  // alert (a collateral-shortfall warning), so this yields a populated list;
  // the empty-filter case is handled by `AlertsPanel`'s own empty state.
  const cashAlerts = alerts.filter((a) => a.category === "Cash & Collateral");

  return (
    <div className="flex flex-col gap-6">
      {/* 1) Page header — single <h1> for the route (the layout owns the
          surrounding landmarks). The ampersand uses the `&amp;` HTML entity in
          JSX text to stay clean under `react/no-unescaped-entities`. */}
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-semibold text-text">
          Cash &amp; Collateral
        </h1>
        <p className="font-sans text-sm text-text-muted">
          Cash positions, reporting currency, and collateral coverage for the
          account.
        </p>
      </header>

      {/* 2) Context KPIs — built EXCLUSIVELY from real `account` fields
          (reporting currency, AUM, VaR/risk). Rendering through `KpiCard`
          guarantees each figure is `font-mono tabular-nums`. No `change`/
          `direction` is passed: a static cash-context snapshot has no
          meaningful signed delta, so the cards render neutral. */}
      <section
        aria-label="Cash context"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <KpiCard
          label="Reporting Currency"
          value={account.currency}
          hint="Base currency"
        />
        <KpiCard
          label="Assets Under Management"
          value={formatCompactCurrency(account.aum)}
          hint="Total portfolio"
        />
        <KpiCard
          label="Value at Risk (1-day, 95%)"
          value={formatPercent(account.varPercent)}
          hint={account.riskLevel}
        />
      </section>

      {/* 3) Section-relevant alerts. `AlertsPanel` renders its own empty state,
          so no extra guard is needed. The literal `&` inside the `title`
          attribute string is fine — the unescaped-entities rule applies to JSX
          text children, not to attribute string literals. */}
      <AlertsPanel alerts={cashAlerts} title="Cash & Collateral Alerts" />
    </div>
  );
}
