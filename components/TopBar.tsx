// components/TopBar.tsx
//
// Shared institutional TOP BAR (shell chrome) for the Finebank
// portfolio-oversight dashboard (Next.js 14 App Router + TypeScript + Tailwind).
//
// WHERE THIS LIVES IN THE APP
// ---------------------------------------------------------------------------
// This component is rendered EXACTLY ONCE, inside the application shell
// (`app/layout.tsx`), as the horizontal header that sits above `{children}` and
// to the right of the persistent `Sidebar`. Because the shell renders it a
// single time and every route is nested under that layout, the chrome is never
// copy-pasted per page — which is the structural way this project satisfies the
// brief's "shared layout components / no duplication" mandate (AAP §0.8.2 and
// the user's positive example). The top bar is HORIZONTAL CHROME ONLY: it shows
// the account/portfolio context and a few restrained status affordances. It
// deliberately does NOT render navigation — the six section links are the
// `Sidebar`'s responsibility.
//
// DESIGN SYSTEM COMPLIANCE (AAP §0.5)
// ---------------------------------------------------------------------------
// Third-party UI libraries are forbidden; the design system is Tailwind tokens
// (from `tailwind.config.ts`) + `next/font` faces + first-party components.
// Consequently EVERY color, spacing, radius, and type value below resolves to a
// semantic token or a standard Tailwind scale utility — there are zero one-off
// hex values or magic numbers. Notably the bar height uses the dedicated
// `topbar` spacing token (`h-topbar` = 72px, the "shared top bar height"
// declared in the config) rather than an ad-hoc height, and the surface reads
// as elevated chrome (`bg-surface` white) against the muted `bg-background`
// canvas set on `<body>` in `app/globals.css`.
//
// RENDERING MODEL
// ---------------------------------------------------------------------------
// This is a React SERVER COMPONENT. There is intentionally NO "use client"
// directive: nothing here is interactive (no hooks, no event handlers, no
// state). The bar renders only static account context and status affordances.
// Should a working search or menu ever be specified, that interactive piece
// belongs in its own small `"use client"` component, keeping this shell chrome
// server-rendered and cheap — a non-functional focusable control is never
// rendered here, as it would be a broken affordance / keyboard focus trap.
//
// STATIC-DATA-ONLY CONTRACT
// ---------------------------------------------------------------------------
// The account context comes from the single static `account` composite in
// `@/lib/mock-data` (imported as `defaultAccount`), so the shell can render
// `<TopBar />` with no props. There is no fetch/async/state of any kind, which
// keeps the component consistent with the project's static-data-only rule.

import type { AccountPortfolio } from "@/lib/types";
import { account as defaultAccount } from "@/lib/mock-data";
import { formatCompactCurrency, formatDate } from "@/lib/format";

/**
 * Public props for {@link TopBar}.
 *
 * The single prop is OPTIONAL: `app/layout.tsx` renders `<TopBar />` with no
 * props and the component falls back to the static mock `account`. An explicit
 * `account` may be supplied to override the displayed context (e.g. in a future
 * multi-account scenario or a Storybook/testing harness) without changing the
 * component's markup.
 */
export interface TopBarProps {
  /**
   * Account context to display. Defaults to the static mock account
   * (`@/lib/mock-data`) so the application shell can render `<TopBar />` with
   * zero required props while remaining fully static.
   */
  account?: AccountPortfolio;
}

/**
 * Derive up to two uppercase initials from an account/mandate name for the
 * identity avatar (e.g. `"Global Multi-Asset Composite"` → `"GM"`).
 *
 * A pure, side-effect-free helper evaluated at module/render scope — it is NOT
 * a React hook, so it is safe inside this server component. Whitespace is
 * collapsed defensively and empty input yields an empty string, so a malformed
 * or blank name can never crash the render (per the spec's edge-case handling).
 *
 * @param name - The account / mandate display name.
 * @returns Up to two uppercase initial letters, or `""` for a blank name.
 */
function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Shared institutional top bar rendered once in the application shell.
 *
 * Layout is a single horizontal `<header>` (the shell's banner landmark) split
 * into two clusters via `justify-between`:
 *
 *   - LEFT — account context: an "Account" eyebrow, the account/mandate name
 *     (the primary context), and a muted meta line carrying the as-of date and
 *     the reporting currency.
 *   - RIGHT — restrained status chrome: the headline AUM figure (monospace,
 *     tabular figures), a muted risk badge, and an identity avatar with the
 *     account initials.
 *
 * All numeric figures — the AUM and the as-of DATE — render in `font-mono
 * tabular-nums` via the shared `@/lib/format` helpers so every figure aligns to
 * the same monospace grid used across the dashboard (MJ-13).
 *
 * @param props - See {@link TopBarProps}. `account` defaults to the static mock.
 * @returns The top bar header element.
 */
export default function TopBar({ account = defaultAccount }: TopBarProps) {
  // Precompute display strings once. `formatDate` fixes the time zone to UTC so
  // a date-only ISO string never drifts a day in negative-offset locales; the
  // medium date parts yield e.g. "Jun 30, 2024".
  const asOfLabel = formatDate(account.asOf, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  // Compact headline AUM, e.g. "$468.2M". Rendered in the monospace face below.
  const aumLabel = formatCompactCurrency(account.aum);
  const initials = deriveInitials(account.accountName);

  return (
    <header className="sticky top-0 z-20 flex h-topbar items-center justify-between gap-4 border-b border-border bg-surface px-6">
      {/* LEFT CLUSTER — account / portfolio context. `min-w-0` lets the name
          truncate instead of overflowing the flex row on narrow widths. */}
      <div className="flex min-w-0 flex-col justify-center">
        <span className="text-2xs font-medium uppercase tracking-wider text-text-subtle">
          Account
        </span>
        <p className="truncate text-base font-semibold leading-tight text-text">
          {account.accountName}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
          <span className="truncate">
            As of{" "}
            <time dateTime={account.asOf} className="font-mono tabular-nums">
              {asOfLabel}
            </time>
          </span>
          {/* Reporting currency as a compact, ticker-like tag (monospace). */}
          <span className="rounded-badge bg-surface-strong px-1.5 py-0.5 font-mono text-2xs font-medium tracking-wide text-text-muted">
            {account.currency}
          </span>
        </div>
      </div>

      {/* RIGHT CLUSTER — restrained institutional status chrome. `shrink-0`
          keeps these fixed-size affordances from being squeezed by the name. */}
      <div className="flex shrink-0 items-center gap-4">
        {/* NOTE: a decorative read-only search field previously lived here. It
            was removed because a focusable-but-inert control is a broken
            affordance / keyboard focus trap (it announced "search" but had no
            behavior). Functional search is out of scope this phase — the AAP
            defines the top bar as account-context chrome only (§0.5.2), lists no
            search component (§0.7.1), and forbids client state (§0.3.2). If a
            working search is ever specified, it belongs in its own small
            `"use client"` child so this shell chrome stays server-rendered. */}

        {/* Headline AUM — persistent portfolio context across every screen.
            Monospace + tabular figures satisfy the numeric-alignment mandate. */}
        <div className="hidden flex-col items-end justify-center sm:flex">
          <span className="text-2xs font-medium uppercase tracking-wider text-text-subtle">
            AUM
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-text">
            {aumLabel}
          </span>
        </div>

        {/* Muted risk badge — qualitative classification (not a numeric). */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-2xs font-medium uppercase tracking-wider text-text-subtle">
            Risk
          </span>
          <span className="rounded-badge bg-surface-strong px-2 py-0.5 text-xs font-medium text-text-muted">
            {account.riskLevel}
          </span>
        </div>

        {/* Vertical divider separating status metrics from the identity avatar. */}
        <span
          aria-hidden="true"
          className="hidden h-8 w-px bg-border sm:block"
        />

        {/* Identity avatar with account initials. Marked decorative because the
            full account name is already announced in the left cluster; the
            circle is non-interactive, so no minimum touch-target applies. */}
        <div
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-subtle text-xs font-semibold text-accent"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
