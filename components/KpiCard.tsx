/**
 * components/KpiCard.tsx — Reusable institutional KPI / statistic card.
 * ---------------------------------------------------------------------------
 * A first-party PRESENTATIONAL React component for the "Finebank" institutional
 * portfolio-oversight dashboard (Next.js 14 App Router + TypeScript + Tailwind).
 * It renders a single headline statistic — e.g. Assets Under Management (AUM),
 * daily P&L, YTD return, or a risk metric — as one card in the responsive KPI
 * grid on the Overview screen (README: "Portfolio/account overview with KPI
 * summary (AUM, daily P&L, risk metrics)").
 *
 * DESIGN-SYSTEM ROLE
 * Third-party UI libraries are forbidden by the brief (no MUI / Ant Design /
 * Bootstrap / styled-components / CSS-in-JS — AAP §0.3.2/§0.5). Consequently
 * this component, the Tailwind theme tokens in `tailwind.config.ts`, and the
 * `next/font` faces wired in `app/layout.tsx` ARE the design system. The card
 * is built exclusively from semantic HTML + Tailwind utility classes that
 * resolve to theme tokens; there are ZERO hardcoded hex/size values.
 *
 * RENDERING MODEL — SERVER COMPONENT (load-bearing)
 * There is intentionally NO `"use client"` directive. The card holds no state,
 * uses no hooks, and has no event handlers, so it renders entirely on the
 * server as a React Server Component (AAP §0.6.5: `"use client"` only where
 * interactivity truly requires it). Keeping it server-rendered means the KPI
 * grid ships zero client JS for these cards.
 *
 * FORMAT-AGNOSTIC BY DESIGN (key insight)
 * The card receives ALREADY-FORMATTED display strings (`value`, `change`) plus
 * a `direction`. All number/percent/currency formatting lives in `@/lib/format`
 * and is applied by the caller (e.g. `app/overview/page.tsx`) — NOT here. This
 * keeps one card reusable across AUM (currency), P&L (signed currency), YTD
 * (signed percent), and risk (percent/label) without embedding any formatting
 * or locale logic. This module therefore imports NO data or formatting module;
 * its only imports are the `TrendDirection` type and React's `ReactNode` type.
 *
 * MONOSPACE NUMERICS (CRITICAL)
 * The primary `value` and the optional `change` render in `font-mono
 * tabular-nums` — never the body sans face — so that currency and percentage
 * figures use tabular (fixed-width) glyphs and align vertically when several
 * cards sit side by side (README: "Numbers/figures should use a monospace font
 * for tabular alignment"; AAP §0.8.2 negative example).
 *
 * ACCESSIBILITY
 *   - The card uses a `<dl>`/`<dt>`/`<dd>` micro-structure so the KPI label is
 *     programmatically associated with its value (term → definition).
 *   - Direction is never conveyed by color alone: the sign already present in
 *     the formatted `change` string, the caret SHAPE, and an `sr-only` word
 *     ("increase"/"decrease"/"no change") all restate it for assistive tech.
 *   - The optional caller icon and the directional caret are purely decorative
 *     and are hidden from the accessibility tree via `aria-hidden`.
 */

import type { ReactNode } from "react";

import type { TrendDirection } from "@/lib/types";

/**
 * Maps a {@link TrendDirection} to the semantic Tailwind text-color TOKEN used
 * to tint the change figure. These are class strings that resolve to the
 * institutional directional roles declared in `tailwind.config.ts`
 * (`positive` = muted pine green, `negative` = muted brick red) plus the muted
 * text role for a neutral/flat delta. NO raw hex is used anywhere.
 */
const CHANGE_COLOR: Record<TrendDirection, string> = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-text-muted",
};

/**
 * Screen-reader-only word appended after the change figure so the trend
 * direction is announced textually (not by color alone) to assistive tech.
 * The visible `+`/`-` sign in the formatted string reinforces the same meaning.
 */
const CHANGE_SR_LABEL: Record<TrendDirection, string> = {
  up: "increase",
  down: "decrease",
  flat: "no change",
};

/**
 * Public props for {@link KpiCard}.
 *
 * Exported as a named export for convenience so call sites and tests can
 * annotate props explicitly; the component itself is the module's DEFAULT
 * export (imported downstream as `import KpiCard from "@/components/KpiCard"`).
 */
export interface KpiCardProps {
  /**
   * Short KPI label, e.g. "Assets Under Management". Typically a plain string,
   * but accepts a `ReactNode` so a label that unavoidably contains a numeric
   * fragment (e.g. "Next 30 Days") can wrap that fragment in
   * `font-mono tabular-nums`, keeping every numeric descendant on the monospace
   * grid rather than in the sans label face (MJ-13). Prefer purely textual
   * labels where possible; use mono fragments only for genuine numerics.
   */
  label: ReactNode;
  /**
   * Pre-formatted display value (produced by `@/lib/format` at the call site),
   * e.g. `"$468.2M"`. Rendered in `font-mono tabular-nums`.
   */
  value: string;
  /**
   * Optional pre-formatted signed change, e.g. `"+13.6%"` or `"-$82,800"`.
   * Rendered in `font-mono tabular-nums` and tinted by {@link KpiCardProps.direction}.
   */
  change?: string;
  /**
   * Direction that drives the change color and caret
   * (`up` → positive, `down` → negative, `flat` → muted). Defaults to `"flat"`.
   */
  direction?: TrendDirection;
  /** Optional secondary caption, e.g. `"YTD"` or `"As of Jun 28, 2024"`. */
  hint?: string;
  /**
   * Optional inline-SVG icon slot (an institutional line icon). No icon
   * library is used — pass inline SVG only. Rendered decoratively and hidden
   * from assistive tech.
   */
  icon?: ReactNode;
}

/**
 * A tiny, decorative directional caret rendered inline as SVG.
 *
 * Sizing is controlled by Tailwind utilities (`h-3 w-3`), the fill inherits the
 * surrounding change color via `currentColor`, and the `viewBox` is preserved
 * so the glyph scales crisply (UI7). It carries `aria-hidden` because direction
 * is already conveyed textually by the change sign and the `sr-only` word.
 *
 * The path/rect coordinate numbers below are SVG GEOMETRY (not CSS style
 * values), so the zero-hardcoded-style-values rule does not apply to them.
 */
function DirectionCaret({ direction }: { direction: TrendDirection }): JSX.Element {
  let shape: JSX.Element;
  if (direction === "up") {
    // Upward triangle: apex at top, base along the bottom.
    shape = <path d="M6 3.5 10 8.5 2 8.5 Z" />;
  } else if (direction === "down") {
    // Downward triangle: apex at bottom, base along the top.
    shape = <path d="M6 8.5 2 3.5 10 3.5 Z" />;
  } else {
    // Flat: a short, rounded horizontal bar (neutral delta).
    shape = <rect x="2.5" y="5.25" width="7" height="1.5" rx="0.75" />;
  }

  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      {shape}
    </svg>
  );
}

/**
 * Renders a single institutional KPI statistic card.
 *
 * @example
 * ```tsx
 * <KpiCard
 *   label="Assets Under Management"
 *   value="$468.2M"
 *   change="+13.6%"
 *   direction="up"
 *   hint="YTD"
 * />
 * ```
 *
 * @param props - See {@link KpiCardProps}.
 * @returns The KPI card element.
 */
export default function KpiCard({
  label,
  value,
  change,
  direction = "flat",
  hint,
  icon,
}: KpiCardProps): JSX.Element {
  // Treat empty strings as "absent" so callers can pass `""` without rendering
  // an empty, mis-styled row (UI8: never render meaningless empty content).
  const hasChange = typeof change === "string" && change.length > 0;
  const hasHint = typeof hint === "string" && hint.length > 0;

  return (
    <article className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-5 shadow-card">
      {/*
        Label → value association via a description list. Preflight already
        zeroes the default `<dd>` margin, so no reset utility is required.
      */}
      <dl className="flex min-w-0 flex-col gap-2">
        <dt className="font-sans text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </dt>
        <dd className="flex flex-col gap-1">
          {/* Primary figure — the monospace-critical element. */}
          <span className="font-mono text-2xl font-semibold leading-tight tabular-nums text-text">
            {value}
          </span>

          {(hasChange || hasHint) && (
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {hasChange && (
                <span
                  className={`inline-flex items-center gap-1 font-mono text-sm font-medium tabular-nums ${CHANGE_COLOR[direction]}`}
                >
                  <DirectionCaret direction={direction} />
                  <span>{change}</span>
                  <span className="sr-only">{CHANGE_SR_LABEL[direction]}</span>
                </span>
              )}
              {hasHint && (
                <span className="font-sans text-xs text-text-muted">{hint}</span>
              )}
            </span>
          )}
        </dd>
      </dl>

      {/* Optional decorative icon slot (inline SVG supplied by the caller). */}
      {icon && (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center text-text-muted"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
    </article>
  );
}
