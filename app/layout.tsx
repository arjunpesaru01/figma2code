/**
 * app/layout.tsx — Finebank institutional dashboard: the ROOT application shell.
 * ---------------------------------------------------------------------------
 * This is the single, shared App Router root layout that wraps EVERY route in
 * the project. It is the one place that:
 *
 *   1. Renders the document skeleton (`<html>` / `<body>`) — no other file in
 *      the app may render these.
 *   2. Wires the self-hosted `next/font` typefaces and exposes them to the
 *      whole document as the CSS custom properties `--font-sans` and
 *      `--font-mono` (the exact names `tailwind.config.ts` binds
 *      `fontFamily.sans` / `fontFamily.mono` to).
 *   3. Imports the single global stylesheet (`./globals.css`) exactly once.
 *   4. Renders the persistent chrome — `<Sidebar />` and `<TopBar />` — ONCE,
 *      around `{children}` (the active route).
 *
 * WHY THE CHROME LIVES HERE (structural, not by convention):
 *   The brief mandates "shared layout components — the sidebar and top bar must
 *   not be duplicated inside individual page files" (AAP §0.8.2, and the user's
 *   positive example §0.6.4). Because every route in the App Router is nested
 *   under this root layout, rendering `Sidebar` + `TopBar` here a single time
 *   means the navigation is physically impossible to drift out of sync across
 *   the six screens. No page re-declares the chrome; routes flow in via
 *   `{children}` and only `<main>`'s content changes as the user navigates.
 *
 * RENDERING MODEL — SERVER COMPONENT (no "use client"):
 *   This layout has no interactivity of its own, so it is a React Server
 *   Component. The client behavior lives INSIDE `Sidebar` (which is itself a
 *   `"use client"` component because it reads the live pathname via
 *   `usePathname`). Rendering a client component from a server layout is the
 *   correct, required composition (AAP §0.6.5). `TopBar` is likewise a server
 *   component. There is intentionally NO data fetching, `fetch()`, or server
 *   action here — the shell is a static, stateless frame (AAP §0.3.2).
 *
 * TYPOGRAPHY CONTRACT (the crux of the monospace-numeric system):
 *   `next/font` emits a CSS variable for each face when the `variable` option
 *   is set. We bind the sans/display face to `--font-sans` and the monospace
 *   face to `--font-mono`. `tailwind.config.ts` references those exact
 *   variables, so every `font-mono tabular-nums` numeric cell across all six
 *   screens resolves to the self-hosted monospace face with ZERO per-page
 *   wiring — and the fonts are self-hosted (no `<link>` / no CSS `@import`) so
 *   there is no layout shift (AAP §5.2.6). If either variable is ever unset,
 *   the Tailwind fallback stacks (`ui-sans-serif` / `ui-monospace`, …) keep
 *   text legible.
 *
 * DESIGN-SYSTEM COMPLIANCE (AAP §0.5):
 *   Third-party UI/CSS libraries are forbidden; the design system is the
 *   Tailwind theme tokens + `next/font` faces + first-party components.
 *   Consequently every class below resolves to a semantic token
 *   (`bg-background`, `text-text`, `font-sans`, …) or a standard Tailwind scale
 *   utility — there are no hardcoded hex values or arbitrary one-off sizes.
 */

import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

/* -------------------------------------------------------------------------- */
/* Self-hosted typefaces (next/font)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Display / body face — Inter.
 *
 * A clean, neutral institutional grotesk used for all non-numeric text. Inter
 * is a VARIABLE font, so no explicit `weight` array is required (the full
 * optical weight range is available). Exposed as `--font-sans`, which
 * `tailwind.config.ts` maps to `fontFamily.sans`; `app/globals.css` applies
 * `font-sans` to `<body>`, so this is the document default.
 *
 * `display: "swap"` renders immediately in the fallback face and swaps in Inter
 * once it loads, avoiding invisible text (FOIT). `next/font` self-hosts the
 * files at build time — there is no runtime request to Google's servers.
 */
const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

/**
 * Monospace / numeric face — IBM Plex Mono.
 *
 * A professional, highly legible monospace well-suited to dense financial
 * tables. It backs the project's core requirement that every currency and
 * percentage figure render in a monospace face with `tabular-nums` so columns
 * align vertically (README L26; AAP §7.7.2). Exposed as `--font-mono`, which
 * `tailwind.config.ts` maps to `fontFamily.mono`; numeric surfaces opt in with
 * `font-mono tabular-nums` at their own call sites (KpiCard, HoldingsTable,
 * chart labels) — the body is never globally forced to monospace.
 *
 * IBM Plex Mono is NOT a variable font, so the specific weights actually used
 * across the dashboard (400 regular, 500 medium, 600 semibold) are declared
 * explicitly; requesting only what is used keeps the self-hosted payload lean.
 */
const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono",
});

/* -------------------------------------------------------------------------- */
/* Route metadata                                                             */
/* -------------------------------------------------------------------------- */

/**
 * App Router document metadata. Next.js renders this into the `<head>` (title
 * + meta description) for every route unless a nested route overrides it. The
 * copy is deliberately institutional and professional, matching the muted,
 * trustworthy product tone (README L22-L25).
 */
export const metadata: Metadata = {
  title: "Finebank — Portfolio Oversight",
  description:
    "Institutional finance & banking administration dashboard for portfolio oversight.",
};

/* -------------------------------------------------------------------------- */
/* Root layout                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The root application shell.
 *
 * Structure (desktop-first, data-dense):
 *
 *   <html> (carries the --font-sans / --font-mono variable classes)
 *     <body> (institutional canvas via tokens)
 *       <div> fixed-height flex row — the app shell
 *         <Sidebar />               ← persistent left navigation rail
 *         <div> content column (flex-1, min-w-0)
 *           <TopBar />              ← persistent shared header
 *           <main>{children}</main> ← the active route; owns its own scroll
 *
 * SCROLL / "STAY PUT" MODEL:
 *   The shell row is fixed to the viewport height (`h-screen`) and clips its
 *   own overflow (`overflow-hidden`), so the page itself never scrolls.
 *   Instead, `<main>` is the sole vertical scroll region (`flex-1
 *   overflow-y-auto`). This is what keeps the `Sidebar` and `TopBar` visually
 *   pinned while the route content scrolls beneath them — the desktop
 *   application-shell behavior the brief calls for. (The `Sidebar` is a
 *   full-height rail and `TopBar` is sticky within the column, but the
 *   fixed-height shell is what guarantees the chrome stays put regardless of
 *   content length.)
 *
 *   `min-w-0` on the content column lets wide, data-dense tables scroll within
 *   their own container instead of forcing the whole column to overflow.
 *
 * LANDMARKS / ACCESSIBILITY:
 *   `lang="en"` is set on `<html>`. This layout renders exactly ONE `<main>`
 *   landmark around `{children}`; the `<nav>` landmark is provided by `Sidebar`
 *   and the banner/`<header>` landmark by `TopBar` — they are not duplicated
 *   here. The keyboard `:focus-visible` ring is defined globally in
 *   `app/globals.css`, so focus styling is consistent app-wide.
 *
 * @param props.children - The active route segment injected by the App Router.
 * @returns The document shell wrapping every route.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      {/*
        The body classes are intentionally idempotent with the base layer in
        `app/globals.css` (which also applies the canvas + sans font to
        `<body>`). Restating the semantic tokens here keeps the shell's intent
        explicit and self-documenting; `min-h-screen` guarantees the canvas
        fills short pages so the chrome never floats on bare white.
      */}
      <body className="min-h-screen bg-background text-text font-sans antialiased">
        {/* Fixed-height app shell: the row is exactly the viewport height and
            clips its overflow, so `<main>` (below) becomes the only scroll
            region and the Sidebar + TopBar stay put as content scrolls. */}
        <div className="flex h-screen overflow-hidden">
          {/* Persistent primary navigation — rendered ONCE for the whole app.
              The Sidebar is a client component (it reads the live pathname to
              highlight the active section) and owns its own fixed rail width
              (`w-sidebar`) and right border. */}
          <Sidebar />

          {/* Content column: the shared top bar stacked above the active route.
              `min-w-0` allows wide tables to scroll instead of overflowing;
              `flex-1` lets the column take all remaining horizontal space. */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Persistent shared header — rendered ONCE for the whole app. */}
            <TopBar />

            {/* The active route. It is the sole vertical scroll container so
                the chrome above/left of it remains fixed; `p-6` gives the
                data-dense screens comfortable, consistent padding from the
                Tailwind spacing scale. */}
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
