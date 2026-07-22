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
//   * Axes and gridlines reuse `currentColor` dimmed with numeric
//     `strokeOpacity` / `fillOpacity`, reading as muted neutrals without a
//     second hardcoded color.
//
// The muted single-series area, hairline grid, and restrained fill deliver the
// institutional, data-dense aesthetic the brief demands (README L22-L26) — no
// bright gradients, no flashy fills.
// -----------------------------------------------------------------------------

import { useId, type CSSProperties } from "react";

import type { NavPoint } from "@/lib/types";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
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
      <p className="text-2xs uppercase tracking-wide text-text-muted">
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
export default function NavChart({ data, height = 300 }: NavChartProps) {
  // Stable, collision-free ids for the figure's accessible name/description
  // (this is a client component, so `useId` is available). Called
  // unconditionally BEFORE any early return to satisfy the rules of hooks.
  const titleId = useId();
  const descId = useId();

  // MJ-08: carry the height into class-based sizing via a CSS custom property.
  // The Tailwind utility `h-[var(--nav-chart-height)]` applies the actual
  // `height`, so no raw `height` CSS value is set inline.
  const heightVar = { "--nav-chart-height": `${height}px` } as CSSProperties;

  // MJ-07: keep only points with a parseable date AND a finite NAV value, so an
  // invalid date or a NaN/Infinity reading can never reach Recharts.
  const validData = (data ?? []).filter(
    (point): point is NavPoint =>
      point != null &&
      typeof point.date === "string" &&
      !Number.isNaN(new Date(point.date).getTime()) &&
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
      {/* Visually-hidden accessible name + data-semantics description (MJ-09). */}
      <figcaption id={titleId} className="sr-only">
        NAV performance over time
      </figcaption>
      <p id={descId} className="sr-only">
        {`Area chart of net asset value across ${validData.length} periods, from ${firstLabel} to ${lastLabel}, latest ${latestValue}.`}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          accessibilityLayer
          data={validData}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          {/* Hairline horizontal grid — muted via opacity, no vertical rules. */}
          <CartesianGrid
            stroke="currentColor"
            strokeOpacity={0.12}
            vertical={false}
          />
          {/* X axis: month-end dates formatted "Jan 2024" via `formatDate`.
              `fill` / `fillOpacity` (applied via the `tick` object below) render
              the labels as muted `currentColor`. The monospace + `tabular-nums`
              face (MJ-06) is applied in `app/globals.css` on Recharts' emitted
              `.recharts-cartesian-axis-tick-value` class: Recharts strips
              `className` from the `tick` object, so the mono face cannot be set
              here and must be styled via that runtime class instead. */}
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value)}
            tick={{
              fill: "currentColor",
              fillOpacity: 0.65,
            }}
            tickLine={false}
            axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
            minTickGap={24}
          />
          {/* Y axis: compact currency ticks ("$468.2M") via `formatCompactCurrency`.
              Muted `currentColor` via `fill` / `fillOpacity`; the mono +
              `tabular-nums` face (MJ-06) that keeps the currency ticks aligned to
              the monospace grid is applied in `app/globals.css` (see the X axis
              note above for why it cannot be set through the `tick` object). */}
          <YAxis
            tickFormatter={(value) => formatCompactCurrency(value)}
            tick={{
              fill: "currentColor",
              fillOpacity: 0.65,
            }}
            tickLine={false}
            axisLine={false}
            width={64}
            domain={["auto", "auto"]}
          />
          {/* Token-styled custom tooltip; subtle accent cursor line. */}
          <Tooltip
            content={<NavTooltip />}
            cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
          />
          {/* Single composite NAV series — restrained fill keeps it institutional. */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            fill="currentColor"
            fillOpacity={0.12}
            dot={false}
            activeDot={{ r: 4, fill: "currentColor", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
