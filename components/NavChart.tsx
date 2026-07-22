"use client";

// -----------------------------------------------------------------------------
// NavChart — NAV / performance time-series visualization (Recharts).
//
// This is the ONE chart in the Finebank institutional dashboard and, alongside
// `Sidebar`, one of only two `"use client"` components in the app. Recharts
// renders client-side (it measures the DOM through `ResponsiveContainer`), so
// the client boundary declared on the FIRST line above is mandatory — without
// it the App Router would try to render Recharts on the server and the build /
// runtime would error (AAP §0.6.5, §5.2.4).
//
// Consumed by `app/overview/page.tsx` as `<NavChart data={navSeries} />`, where
// `navSeries: NavPoint[]` comes from the static `@/lib/mock-data`.
//
// DESIGN-SYSTEM COMPLIANCE — the `currentColor` technique
// -----------------------------------------------------------------------------
// Recharts writes color *values* onto raw SVG (`stroke` / `fill`), so Tailwind
// utility CLASSES cannot color the geometry directly. To stay token-compliant
// (zero hardcoded hex — AAP §0.5.1) we exploit the single permitted raw value
// `currentColor`:
//
//   * The chart card carries the Tailwind text-color token `text-accent`, so
//     the CSS `color` cascading into the SVG resolves to the institutional
//     accent defined in `tailwind.config.ts` (`colors.accent.DEFAULT`).
//   * The series then uses `stroke="currentColor"` / `fill="currentColor"`,
//     inheriting that accent — the color still ORIGINATES from a theme token.
//   * Grid and axis LINES reuse `currentColor` dimmed with numeric
//     `strokeOpacity`, reading as muted neutrals without a second hardcoded
//     color. Axis TICK LABELS instead take an OPAQUE muted-text token via
//     `app/globals.css` so their contrast meets WCAG AA (a dimmed accent
//     failed); their color still originates from a theme token.
//
// The muted single-series area, hairline grid, and restrained fill deliver the
// institutional, data-dense aesthetic the brief demands (README L22-L26) — no
// bright gradients, no flashy fills.
// -----------------------------------------------------------------------------

import { useId, type CSSProperties } from "react";

import type { NavPoint } from "@/lib/types";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  isValidDateString,
} from "@/lib/format";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";

/**
 * Named chart layout/style constants.
 *
 * Every geometry and opacity value the chart hands to Recharts is centralized
 * here rather than scattered as inline magic numbers, so the chart's visual
 * rhythm is tunable from one place and each value is self-documenting. These are
 * Recharts component-API values (SVG geometry / opacities), NOT CSS style
 * values, so the zero-hardcoded-token rule (which governs colors/spacing/type)
 * does not apply — colors still originate from theme tokens via the
 * `currentColor` technique documented above.
 */
const CHART = {
  /** Default `ResponsiveContainer` height in px (overridable via the `height` prop). */
  defaultHeight: 300,
  /** Plot margins in px — small symmetric top/right; flush bottom/left to the axes. */
  margin: { top: 8, right: 8, bottom: 0, left: 0 },
  /** Y-axis gutter width in px reserved for the compact-currency tick labels. */
  yAxisWidth: 64,
  /** Minimum px gap between X-axis date ticks before Recharts thins them. */
  xAxisMinTickGap: 24,
  /** Opacity of the hairline horizontal gridlines. */
  gridOpacity: 0.12,
  /** Opacity of the axis baseline and the hover cursor rule. */
  axisLineOpacity: 0.2,
  /** NAV series stroke width in px. */
  seriesStrokeWidth: 2,
  /** NAV series area fill opacity (restrained, institutional). */
  seriesFillOpacity: 0.12,
  /** Radius in px of the active (hovered) data dot. */
  activeDotRadius: 4,
} as const;

/**
 * Public props for {@link NavChart}.
 *
 * The prop is named `data` (rather than `navSeries`) so the component reads as a
 * generic time-series chart; it maps 1:1 to `OverviewProps.navSeries`.
 */
export interface NavChartProps {
  /** NAV / performance series (from `lib/mock-data`). */
  data: NavPoint[];
  /** Optional pixel height for the `ResponsiveContainer`; defaults to `300`. */
  height?: number;
}

/**
 * Custom, token-styled tooltip for the NAV chart.
 *
 * Recharts injects `active`, `payload`, and `label` when it clones the element
 * passed to `<Tooltip content={...} />`; every field on `TooltipProps` is
 * optional, so this component is safe to instantiate as `<NavTooltip />`.
 *
 * The numeric value is rendered through `formatCurrency` inside a
 * `font-mono tabular-nums` cell so it aligns and matches the monospace-numeric
 * requirement; the date label is rendered through `formatDate`. The container
 * is styled entirely with theme tokens (`bg-surface`, `border-border`, …) — no
 * hardcoded colors.
 */
function NavTooltip({ active, payload, label }: TooltipProps<number, string>) {
  // Recharts calls the content on every mouse move; bail out when there is no
  // active point or the payload is empty/undefined.
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0];
  // `TooltipProps<number, string>` types `value` as `number | undefined`; guard
  // it defensively and fall back to an em dash for any non-finite reading.
  const numericValue = typeof point.value === "number" ? point.value : Number.NaN;
  // `label` is typed `any` by Recharts; it is the active point's x value (the
  // ISO date string). Coerce defensively before formatting.
  const dateLabel = typeof label === "string" ? label : String(label ?? "");

  return (
    <div className="rounded-badge border border-border bg-surface px-3 py-2 shadow-dropdown">
      {/* Date label is a figure → monospace tabular so it aligns with the value
          below and matches every other numeric surface (MJ-13). */}
      <p className="font-mono text-2xs uppercase tracking-wide tabular-nums text-text-muted">
        {formatDate(dateLabel, { month: "short", year: "numeric" })}
      </p>
      <p className="font-mono text-sm tabular-nums text-text">
        {Number.isFinite(numericValue) ? formatCurrency(numericValue) : "\u2014"}
      </p>
    </div>
  );
}

/**
 * Renders the NAV / performance series as a muted, single-series area chart.
 *
 * Behavior:
 *   - Every point is VALIDATED before rendering: a point is kept only when its
 *     `date` parses to a real date AND its `value` is a finite number. Points
 *     with an invalid/unparseable date or a NaN/Infinity value are dropped so
 *     malformed data can never reach Recharts (MJ-07).
 *   - When no valid points remain (absent, empty, or all-invalid `data`), the
 *     chart falls to a no-data placeholder rendered at a comparable height
 *     (AAP §5.2.3, §7.4.3) — we never hand Recharts an empty dataset.
 *   - Otherwise the valid series is drawn inside a `ResponsiveContainer` so it
 *     fills the width of its card while honoring the pixel `height`.
 *
 * ACCESSIBILITY (MJ-09): the `<figure>` is named by a visually-hidden
 * `<figcaption>` and described by a visually-hidden data-semantics summary
 * (period count + date range + latest value), and the `AreaChart` enables
 * Recharts' `accessibilityLayer` so the series is keyboard-navigable.
 *
 * SIZING (MJ-08): the `height` is carried into class-based sizing via the
 * `--nav-chart-height` CSS custom property consumed by the Tailwind arbitrary
 * utility `h-[var(--nav-chart-height)]`, so the actual `height` is applied
 * through the utility API rather than a raw inline `height` style. Recharts'
 * `ResponsiveContainer` legitimately requires a numeric `height` (a component
 * API, not a CSS style), so the chart itself receives `height` directly.
 *
 * @param data   - The NAV/performance points to plot.
 * @param height - Chart height in pixels (default `300`).
 */
export default function NavChart({
  data,
  height = CHART.defaultHeight,
}: NavChartProps) {
  // Stable, collision-free ids for the figure's accessible name/description
  // (this is a client component, so `useId` is available). Called
  // unconditionally BEFORE any early return to satisfy the rules of hooks.
  const titleId = useId();
  const descId = useId();

  // MJ-08: carry the height into class-based sizing via a CSS custom property.
  // The Tailwind utility `h-[var(--nav-chart-height)]` applies the actual
  // `height`, so no raw `height` CSS value is set inline.
  const heightVar = { "--nav-chart-height": `${height}px` } as CSSProperties;

  // MJ-07: keep only points with a REAL calendar date AND a finite NAV value,
  // so an invalid/impossible date or a NaN/Infinity reading can never reach
  // Recharts. `isValidDateString` (shared with `formatDate`) applies a strict
  // parse + calendar round-trip, so an impossible date such as "2024-02-30" —
  // which `new Date(...).getTime()` would silently ROLL FORWARD to Mar 1 and
  // accept — is correctly rejected here too (MJ-07).
  const validData = (data ?? []).filter(
    (point): point is NavPoint =>
      point != null &&
      typeof point.date === "string" &&
      isValidDateString(point.date) &&
      typeof point.value === "number" &&
      Number.isFinite(point.value),
  );

  // No-data / malformed guard: when no valid points remain, render the no-data
  // placeholder at a comparable (token-var) height instead of an empty chart.
  if (validData.length === 0) {
    return (
      <figure
        aria-label="NAV performance over time"
        className="flex h-[var(--nav-chart-height)] items-center justify-center rounded-card border border-border bg-surface p-4 text-sm text-text-muted"
        style={heightVar}
      >
        No performance data available
      </figure>
    );
  }

  // Data-semantics summary for assistive tech: period count + date range +
  // latest value, all rendered through the shared formatters.
  const firstLabel = formatDate(validData[0].date);
  const lastLabel = formatDate(validData[validData.length - 1].date);
  const latestValue = formatCompactCurrency(
    validData[validData.length - 1].value,
  );

  return (
    <figure
      aria-labelledby={titleId}
      aria-describedby={descId}
      // `text-accent` sets the CSS `color` that `currentColor` resolves to for
      // every SVG stroke/fill below — the series color originates from a token.
      className="rounded-card border border-border bg-surface p-4 text-accent"
    >
      {/* VISIBLE chart title (the figure's accessible name) plus a
          visually-hidden data-semantics description (period count + date range +
          latest value) for assistive tech. Previously the title was `sr-only`,
          leaving the chart with no on-screen heading; a visible institutional
          caption now labels it while the richer summary stays screen-reader-only.
          The title is dark primary ink (`text-text`) so it is NOT tinted by the
          figure's `text-accent` color context (which drives the SVG series). */}
      <figcaption
        id={titleId}
        className="mb-3 font-sans text-sm font-semibold text-text"
      >
        NAV Performance
      </figcaption>
      <p id={descId} className="sr-only">
        {`Area chart of net asset value across ${validData.length} periods, from ${firstLabel} to ${lastLabel}, latest ${latestValue}.`}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart accessibilityLayer data={validData} margin={CHART.margin}>
          {/* Hairline horizontal grid — muted via opacity, no vertical rules. */}
          <CartesianGrid
            stroke="currentColor"
            strokeOpacity={CHART.gridOpacity}
            vertical={false}
          />
          {/* X axis: month-end dates formatted "Jan 2024" via `formatDate`. Tick
              label COLOR and the monospace + `tabular-nums` face are BOTH set in
              `app/globals.css` on Recharts' emitted
              `.recharts-cartesian-axis-tick-value` class — Recharts strips
              `className` from the `tick` object, so neither can be set here. That
              rule pins an OPAQUE muted-text token at full opacity, which meets
              WCAG AA contrast; the prior accent dimmed to 0.65 opacity failed
              (~3.35:1). No `fill`/`fillOpacity` is set on `tick` so nothing
              competes with the accessible CSS color. */}
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value)}
            tickLine={false}
            axisLine={{
              stroke: "currentColor",
              strokeOpacity: CHART.axisLineOpacity,
            }}
            minTickGap={CHART.xAxisMinTickGap}
          />
          {/* Y axis: compact currency ticks ("$468.2M") via `formatCompactCurrency`.
              Tick color + monospace/`tabular-nums` face are applied via the same
              `app/globals.css` tick-value rule as the X axis (see note above);
              no `fill`/`fillOpacity` is set on `tick` here. */}
          <YAxis
            tickFormatter={(value) => formatCompactCurrency(value)}
            tickLine={false}
            axisLine={false}
            width={CHART.yAxisWidth}
            domain={["auto", "auto"]}
          />
          {/* Token-styled custom tooltip; subtle accent cursor line. */}
          <Tooltip
            content={<NavTooltip />}
            cursor={{ stroke: "currentColor", strokeOpacity: CHART.axisLineOpacity }}
          />
          {/* Single composite NAV series — restrained fill keeps it institutional. */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={CHART.seriesStrokeWidth}
            fill="currentColor"
            fillOpacity={CHART.seriesFillOpacity}
            dot={false}
            activeDot={{
              r: CHART.activeDotRadius,
              fill: "currentColor",
              strokeWidth: 0,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
