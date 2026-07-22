/**
 * Root landing route ("/") for the Finebank institutional dashboard.
 *
 * The application follows a strict one-route-per-screen structure: every Figma
 * screen has its own App Router route under `app/` — `/overview`, `/holdings`,
 * `/cash-collateral`, `/corporate-actions`, `/compliance`, and `/reporting`.
 * The root path itself owns no screen of its own; it simply forwards visitors
 * to the first section (Overview) so the app always opens on a real screen
 * rather than a blank or duplicated landing page. Keeping `/` as a thin
 * redirect (instead of re-hosting the Overview UI here) preserves that
 * one-route-per-screen structure and keeps `app/overview/page.tsx` the single
 * source of truth for the Overview screen.
 *
 * Implementation notes — each point below is load-bearing; do not "simplify"
 * them away:
 *   - This is a React Server Component. There is intentionally NO "use client"
 *     directive: `redirect()` runs on the server during render, before any
 *     markup would be streamed to the browser.
 *   - `redirect` is imported from "next/navigation" (the App Router API), NOT
 *     from the legacy "next/router" (Pages Router), which does not work here.
 *   - `redirect()` performs the navigation by throwing Next.js's internal
 *     `NEXT_REDIRECT` control-flow signal. It never returns, so this component
 *     never renders JSX, and the call must NOT be wrapped in try/catch —
 *     catching would swallow the signal and break the redirect.
 *   - The target "/overview" is the canonical first-section slug and is kept in
 *     lockstep with `lib/nav.ts` (`NAV_SECTIONS[0].href`) and the
 *     `app/overview/` route directory (AAP §0.7.5 route/config sync).
 */

import { redirect } from "next/navigation";

/**
 * Landing entry point for the root path `/`.
 *
 * Immediately performs a server-side redirect to the Overview screen. The
 * function returns no value and renders no markup: `redirect()` interrupts
 * rendering by throwing the Next.js redirect signal, so control never reaches
 * a `return` statement.
 */
export default function RootPage() {
  redirect("/overview");
}
