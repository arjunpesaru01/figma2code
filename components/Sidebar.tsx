"use client";

/**
 * components/Sidebar.tsx — Primary navigation rail for the Finebank dashboard.
 * ---------------------------------------------------------------------------
 * A first-party CLIENT React component that renders the persistent left-hand
 * navigation for the institutional portfolio-oversight dashboard. It lists the
 * six account sections (Overview, Holdings, Cash & Collateral, Corporate
 * Actions, Compliance, Reporting — README L19-L20) and highlights the section
 * matching the current route.
 *
 * WHY THIS IS A CLIENT COMPONENT (`"use client"` on the very first line):
 *   Active-state highlighting is derived from the live URL via the
 *   `usePathname` hook from `next/navigation`. Hooks only run in Client
 *   Components, so the directive is load-bearing — without it the hook throws
 *   at build/render time (AAP §0.5.2, §0.6.5).
 *
 * SINGLE SOURCE OF TRUTH FOR LINKS (`@/lib/nav`):
 *   The section list is NOT hardcoded here. It is imported from `NAV_SECTIONS`
 *   so the sidebar, the `app/**` route directories, the README screen map, and
 *   the executive deck's architecture diagram all stay in lockstep (AAP
 *   §0.7.5). Reordering or renaming a section is a one-line change in
 *   `lib/nav.ts` and this component follows automatically.
 *
 * RENDERED ONCE, IN THE SHELL:
 *   This component is placed a single time inside the application shell
 *   (`app/layout.tsx`) alongside `TopBar`, wrapping every route's `{children}`.
 *   It is never copy-pasted into individual page files (AAP §0.8.2 "shared
 *   layout"; the user's positive example).
 *
 * RESPONSIVE BEHAVIOR (breakpoint-aware rail):
 *   The dashboard is desktop-first, but the rail must not starve the content
 *   column on narrow viewports. Below the `lg` breakpoint the rail collapses to
 *   an icon-only strip (`w-16`): the wordmark is hidden and each row centers its
 *   icon with its text label kept as `sr-only` (still the accessible name, plus
 *   a `title` tooltip for mouse users). From `lg` up it expands to the full
 *   `w-sidebar` (256px) rail with the wordmark and left-aligned icon+label. On a
 *   375px viewport this yields ~311px of content width instead of ~119px, so the
 *   data-dense screens remain usable without a separate mobile navigation.
 *
 * DESIGN-SYSTEM COMPLIANCE (AAP §0.3.2 / §0.5):
 *   Third-party UI/icon libraries are forbidden. This file uses semantic HTML
 *   (`<aside>` / `<nav>` / `<ul>` / `<a>`), Tailwind theme tokens from
 *   `tailwind.config.ts`, and INLINE SVG icons only. There is no `lucide-react`,
 *   `react-icons`, `@heroicons`, `clsx`, or any other package import. Every
 *   color / spacing / radius resolves to a token or a standard Tailwind scale
 *   utility — the only raw values permitted are `0`, `none`, `auto`, `inherit`,
 *   `currentColor`, and `transparent`.
 *
 * ACCESSIBILITY:
 *   - `<nav aria-label="Primary">` names the navigation landmark.
 *   - The active link carries `aria-current="page"`.
 *   - Icons are decorative (`aria-hidden="true"`, `focusable="false"`); the text
 *     label is the accessible name.
 *   - Keyboard focus is provided app-wide by the token-based `:focus-visible`
 *     rule in `app/globals.css` (`ring-2 ring-accent …`), which every anchor
 *     rendered here inherits — so no per-link focus utility is duplicated
 *     (avoiding a cascade conflict with that global rule).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { NAV_SECTIONS, type NavSection } from "@/lib/nav";

/* -------------------------------------------------------------------------- */
/* Inline icon set                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Shared wrapper for the sidebar's inline line-icons.
 *
 * Centralizing the `<svg>` boilerplate keeps every glyph visually consistent
 * (identical 24×24 viewBox, stroke weight, and rounded joins) and DRY, while
 * remaining pure inline SVG — no icon package is introduced. `currentColor`
 * makes each glyph inherit the link's text color, so the icon tints to the
 * accent when its row is active and stays muted otherwise, for free.
 */
function IconGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Brand mark — a restrained institutional lockup glyph: a rounded square
 * enclosing three ascending bars (a growth/analytics motif). Rendered in the
 * accent color via `currentColor`, it sits beside the "Finebank" wordmark.
 */
const BRAND_MARK: ReactNode = (
  <svg
    viewBox="0 0 24 24"
    className="h-7 w-7 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M8 15.5V13M12 15.5V10.5M16 15.5V8" />
  </svg>
);

/**
 * Icon map: the string key on `NavSection.icon` -> an inline SVG glyph.
 *
 * The keys mirror `NAV_SECTIONS` exactly (`overview`, `holdings`, `cash`,
 * `actions`, `compliance`, `reporting`). Each glyph is a simple, institutional
 * line-style icon. A missing/unknown key falls back to the `overview` glyph so
 * the sidebar never renders a hole (robustness for future sections added to
 * `lib/nav.ts`).
 */
const ICONS: Record<string, ReactNode> = {
  // Overview — dashboard: a 2×2 grid of panels (the KPI / summary board).
  overview: (
    <IconGlyph>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </IconGlyph>
  ),
  // Holdings — briefcase: the portfolio of positions under management.
  holdings: (
    <IconGlyph>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M3 12.5h18" />
    </IconGlyph>
  ),
  // Cash & Collateral — banknote: currency on hand and pledged collateral.
  cash: (
    <IconGlyph>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M5.5 12h.01M18.5 12h.01" />
    </IconGlyph>
  ),
  // Corporate Actions — calendar: scheduled events (dividends, splits, votes).
  actions: (
    <IconGlyph>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 3v3M16 3v3" />
      <path d="M8 14h.01M12 14h.01M16 14h.01" />
    </IconGlyph>
  ),
  // Compliance — shield with check: controls and attestations upheld.
  compliance: (
    <IconGlyph>
      <path d="M12 3l7 3v5c0 4.6-3.1 7.7-7 9-3.9-1.3-7-4.4-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </IconGlyph>
  ),
  // Reporting — document with folded corner: generated statements / reports.
  reporting: (
    <IconGlyph>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 9h1M9 13h6M9 17h6" />
    </IconGlyph>
  ),
};

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Persistent primary navigation rail.
 *
 * Takes no props: it is fully self-driven from `NAV_SECTIONS` and the current
 * pathname. Intended to be rendered exactly once in `app/layout.tsx`.
 *
 * @returns The sidebar `<aside>` landmark containing the brand lockup and the
 *          primary navigation list.
 */
export default function Sidebar() {
  // The live pathname (e.g. "/holdings"). Typed as `string` (non-null) in the
  // App Router — see next/navigation's `usePathname(): string`.
  const pathname = usePathname();

  /**
   * A section is active when the pathname equals its href, or is nested beneath
   * it (e.g. a future `/holdings/[id]` detail route keeps "Holdings"
   * highlighted). Exact match alone would suffice for the six flat routes, but
   * the prefix check is a cheap safeguard for nested segments. No slug is a
   * prefix of another, so at most one item is ever active.
   */
  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-full min-h-screen w-16 flex-col border-r border-border bg-surface lg:w-sidebar">
      {/* Brand / wordmark — aligned to the top-bar height so the sidebar header
          and the TopBar share the same baseline in the shell. On the collapsed
          rail (below `lg`) only the mark shows, centered; the "Finebank"
          wordmark appears from `lg` up when the full-width rail has room. */}
      <div className="flex h-topbar shrink-0 items-center justify-center gap-3 border-b border-border px-2 lg:justify-start lg:px-5">
        <span className="text-accent">{BRAND_MARK}</span>
        <span className="hidden font-sans text-base font-semibold tracking-tight text-text lg:inline">
          Finebank
        </span>
      </div>

      {/* Primary navigation — the six account sections, driven entirely by
          NAV_SECTIONS so the list stays in lockstep with the app/** routes. */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-4 lg:px-3">
        <ul className="flex flex-col gap-1">
          {NAV_SECTIONS.map((section: NavSection) => {
            const active = isActive(section.href);

            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  // On the collapsed rail the text label is `sr-only`, so a
                  // native tooltip surfaces the section name for sighted mouse
                  // users; the accessible name still comes from the label text.
                  title={section.label}
                  className={[
                    // Base: dense, comfortable row with a persistent (usually
                    // transparent) left indicator so the active bar never
                    // shifts the layout. Color transitions respect reduced
                    // motion via the motion-safe variant. The row centers its
                    // icon on the collapsed rail and left-aligns icon+label
                    // from `lg` up.
                    "group flex items-center justify-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm lg:justify-start",
                    "motion-safe:transition-colors motion-safe:ease-out",
                    active
                      ? // Active: soft accent well + accent ink + left bar.
                        "border-accent bg-accent-subtle font-medium text-accent"
                      : // Inactive: muted, with a subtle surface fill and full
                        // ink on hover.
                        "border-transparent font-normal text-text-muted hover:bg-surface-strong hover:text-text",
                  ].join(" ")}
                >
                  {section.icon ? (ICONS[section.icon] ?? ICONS.overview) : null}
                  <span className="truncate max-lg:sr-only">{section.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
