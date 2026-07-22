/**
 * app/holdings/page.tsx — Holdings screen (the `/holdings` route).
 * ---------------------------------------------------------------------------
 * The Holdings route of the "Finebank" institutional portfolio-oversight
 * dashboard (Next.js 14 App Router + TypeScript + Tailwind CSS). Per the brief
 * (README L16) this screen is a "Holdings table with weight, market value, and
 * change." It is ONE of the six one-route-per-Figma-screen pages, mounted at
 * the `/holdings` slug — kept in lockstep with `NAV_SECTIONS[1].href` in
 * `@/lib/nav`, the README screen map, and the executive-deck diagram
 * (AAP §0.7.5 route/config sync).
 *
 * THIN COMPOSITION LAYER (by design):
 *   This page deliberately does almost nothing. It imports the static
 *   `holdings` dataset and hands it to the first-party `HoldingsTable`
 *   component. ALL of the heavy lifting — the semantic `<table>`, the column
 *   set, monospace/tabular numeric alignment, the directional (+/-) coloring,
 *   the card container, the horizontal-scroll wrapper, and the empty state —
 *   lives INSIDE `HoldingsTable`. Keeping this page thin is precisely what
 *   enforces the brief's structural rules (one route per screen, shared layout,
 *   static data, monospace numerics) with zero duplication.
 *
 * CONTRACT (every point enforced below — AAP §0.6.5, §0.8.2, §7.5.3.2):
 *   • SERVER COMPONENT. There is intentionally NO `"use client"` directive and
 *     the function is NOT `async`: the table is a pure, static projection this
 *     phase (no sorting/filtering/interactivity, no awaited data). A synchronous
 *     React Server Component is the correct rendering model.
 *   • STATIC DATA ONLY. The dataset is a static in-memory import from
 *     `@/lib/mock-data`. There is no `fetch()`, no API route, no database
 *     client, and no `lib/api/*` anywhere (AAP §0.3.2; the user's negative
 *     example explicitly forbids a `lib/api/holdings.ts`).
 *   • MONOSPACE NUMERICS. The only figure this page renders itself (the
 *     positions count) is wrapped in `font-mono tabular-nums`; no dollar or
 *     percent figure is ever rendered in the body font at the page level
 *     (README L26; AAP §7.7.2). Every table figure is formatted and aligned
 *     inside `HoldingsTable`.
 *   • TOKENS ONLY. Every color/spacing/type resolves to a `tailwind.config.ts`
 *     token or a standard Tailwind scale utility — no inline `style`, no hex
 *     literals, no arbitrary `[…]` values (AAP §0.5.1).
 *   • NO CHROME. The `<html>`/`<body>`, the sidebar, and the top bar are owned
 *     once by `app/layout.tsx`, which already wraps every route in
 *     `<main className="flex-1 overflow-y-auto p-6">{children}</main>`. This
 *     page renders ONLY the Holdings content region and adds no outer page
 *     padding that would duplicate the shell's `p-6`.
 *   • INSTITUTIONAL, MUTED, DATA-DENSE aesthetic (README L22-25): a concise
 *     heading, a restrained muted summary line, and tight vertical rhythm.
 */

import type { Metadata } from "next";

import HoldingsTable from "@/components/HoldingsTable";
import { holdings } from "@/lib/mock-data";

/**
 * Per-route metadata (MN-07 — Holdings previously inherited the generic root
 * title). Exports the short section label; the root layout's title template
 * composes it into the branded document title "Holdings · Finebank".
 */
export const metadata: Metadata = {
  title: "Holdings",
  description:
    "Data-dense holdings table with weight, market value, and day change for the institutional portfolio.",
};

/**
 * Holdings screen — `/holdings`.
 *
 * A synchronous, default-exported React Server Component. App Router page
 * components take no props; this one composes a minimal page header with the
 * data-dense {@link HoldingsTable}, passing the static `holdings` array through
 * as an in-memory prop.
 *
 * @returns The Holdings content region: the page heading, a muted
 *   positions-count summary, and the holdings table. The surrounding shell
 *   (sidebar, top bar, and the `<main>` padding) is provided by
 *   `app/layout.tsx`, so nothing here re-declares that chrome.
 */
export default function HoldingsPage() {
  return (
    <section className="flex flex-col gap-6">
      {/*
        Page header — the single <h1> landmark for this route plus a muted,
        at-a-glance positions count. The count is the only figure the page
        renders directly, so it opts into the monospace + tabular-figures
        treatment (font-mono tabular-nums); the surrounding label stays in the
        sans body face. Kept intentionally minimal per the conservative default:
        no invented filters, dates, or export affordances.
      */}
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-xl font-semibold text-text">Holdings</h1>
        <p className="text-sm text-text-muted">
          <span className="font-mono tabular-nums">{holdings.length}</span> positions
        </p>
      </header>

      {/*
        Primary content — the data-dense holdings table. The component owns its
        own institutional card container, horizontal-scroll wrapper, semantic
        <table> markup, monospace/tabular numeric alignment, directional (+/-)
        coloring, and empty state. This page only supplies the typed rows, so it
        neither re-wraps the table in a card/border nor re-implements any of that
        markup.
      */}
      <HoldingsTable holdings={holdings} />
    </section>
  );
}
