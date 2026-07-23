// app/compliance/page.tsx
//
// Compliance screen — the alerts / compliance notifications surface for the
// Finebank institutional portfolio-oversight dashboard (Next.js 14 App Router +
// TypeScript + Tailwind CSS). This is the 5th of six account sections
// (Overview, Holdings, Cash & Collateral, Corporate Actions, COMPLIANCE,
// Reporting — README L19-L20) and is served at the route `/compliance`.
//
// ROLE IN THE SYSTEM
// ---------------------------------------------------------------------------
// This page renders the "Alerts/compliance notifications panel" (README L18)
// as a full-screen surface. It is a THIN, DECLARATIVE COMPOSITION: it wires the
// static `alerts` dataset into the shared first-party `AlertsPanel` component
// and nothing more. It deliberately re-implements NO list/table markup — all
// row rendering, severity styling, timestamp formatting, and the empty state
// live inside `AlertsPanel`, which is shared with the Overview screen (there it
// is shown compact via `maxItems={3}`; here it shows the FULL list).
//
// The reusable `AlertsPanel` + the Tailwind theme tokens (`tailwind.config.ts`)
// + the `next/font` faces are the ENTIRE design system for this screen, because
// third-party UI libraries are forbidden (no MUI / Ant Design / Bootstrap /
// styled-components / CSS-in-JS — AAP §0.3.2, §0.5).
//
// RENDERING MODEL — SERVER COMPONENT
// ---------------------------------------------------------------------------
// There is intentionally NO "use client" directive. This page has no
// interactivity, hooks, state, event handlers, or browser-only APIs, so it
// renders entirely on the server and ships zero client JavaScript (AAP §0.6.5:
// only `Sidebar` and `NavChart` are client components). The component is also
// intentionally NOT `async` — there is nothing to await; the data is a static,
// in-memory constant.
//
// DISPLAY-ONLY — NO BUSINESS LOGIC
// ---------------------------------------------------------------------------
// The Compliance surface only DISPLAYS notifications. There is NO rules engine,
// NO regulatory-processing logic, and NO filtering / severity computation here
// (AAP §0.3.2, §5.2.5). The static `alerts` array is passed straight through to
// `AlertsPanel` exactly as authored in `lib/mock-data.ts`.
//
// STATIC-DATA-ONLY CONTRACT
// ---------------------------------------------------------------------------
// Data is imported directly from `@/lib/mock-data`. There is NO `fetch()`, NO
// API route, NO database client, NO `lib/api/*` data-access module, no `async`
// data loading, and no network or persistence layer of any kind (AAP §0.3.2;
// the user's negative example explicitly forbids external data-access modules).
//
// STYLING CONTRACT (tailwind.config.ts is the single source of truth)
// ---------------------------------------------------------------------------
// Every color / spacing / radius / type value resolves to a semantic Tailwind
// token declared in `tailwind.config.ts` or to a standard Tailwind scale
// utility — there are NO hardcoded hex/px values and no inline `style`
// (AAP §0.5.1). The only header colors used are the semantic text roles
// (`text-text`, `text-text-muted`) and the display face (`font-sans`); the
// muted institutional severity styling is owned entirely by `AlertsPanel`
// (critical → `negative`, warning → `warning`, info → `info`) and is NOT
// overridden here (README L22-25 muted/professional, never bright/alarming).
//
// LAYOUT AWARENESS — DO NOT DOUBLE-PAD
// ---------------------------------------------------------------------------
// The application shell (`app/layout.tsx`) renders the persistent `Sidebar` +
// `TopBar` and wraps every route's content in
// `<main className="flex-1 overflow-y-auto p-6">{children}</main>`. Therefore
// this page must NOT render any shell chrome and must NOT re-add the outer
// `p-6` padding. Instead it uses an inner vertical-rhythm container
// (`space-y-6`) for spacing between the header and the panel — satisfying the
// "shared layout components / no duplication" mandate structurally
// (AAP §0.8.2; the user's positive example).
//
// ROUTE / SLUG SYNC (AAP §0.7.5)
// ---------------------------------------------------------------------------
// The directory name `compliance` (route `/compliance`) is kept in lockstep
// with `lib/nav.ts` (`NAV_SECTIONS[4].href === "/compliance"`), the README
// screen map, and the executive deck's architecture diagram. Do not rename the
// folder or change the slug.

import type { Metadata } from "next";

import AlertsPanel from "@/components/AlertsPanel";
import { alerts } from "@/lib/mock-data";

/**
 * Per-route metadata (MN-07 — Compliance previously inherited the generic root
 * title). Exports the short section label; the root layout's title template
 * composes it into the branded document title "Compliance · Finebank".
 */
export const metadata: Metadata = {
  title: "Compliance",
  description:
    "Active alerts and compliance notifications across all account sections of the portfolio.",
};

/**
 * Compliance route page (`/compliance`).
 *
 * A pure, synchronous React Server Component. It renders a minimal institutional
 * screen header followed by the full alerts / compliance list:
 *
 *   - HEADER — an `<h1>` screen title ("Compliance") in the display face plus a
 *     short muted sub-line describing the surface. This is the single `<h1>` for
 *     the screen; the layout provides the page-level landmarks and `AlertsPanel`
 *     provides its own `<section>` with an accessible `<h2>` heading.
 *   - CONTENT — `<AlertsPanel>` rendered with the FULL `alerts` array and the
 *     Compliance-specific heading. `maxItems` is intentionally OMITTED so every
 *     alert is shown (the Overview screen is the one that caps the list). When
 *     `alerts` is empty, `AlertsPanel` renders its own "No active alerts" empty
 *     state, so this page needs no empty-state logic of its own.
 *
 * @returns The Compliance screen content, to be wrapped by the shared shell in
 *   `app/layout.tsx`.
 */
export default function CompliancePage() {
  return (
    <div className="space-y-6">
      {/* Screen header — the single <h1> for this route. Institutional, muted,
          token-only. Kept short: the panel below carries the detail. */}
      <header className="space-y-1">
        <h1 className="font-sans text-2xl font-semibold text-text">
          Compliance
        </h1>
        <p className="text-sm text-text-muted">
          Active alerts and compliance notifications across all account sections.
        </p>
      </header>

      {/* Primary content — the FULL alerts list. `title` overrides AlertsPanel's
          default ("Alerts & Compliance") for the Compliance screen heading, and
          `maxItems` is deliberately omitted so the entire list is shown. */}
      <AlertsPanel alerts={alerts} title="Compliance & Alerts" />
    </div>
  );
}
