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
 *   - Empty / malformed `data` (absent or zero-length) falls to a no-data
 *     placeholder rendered at a comparable height (AAP §5.2.3, §7.4.3) — we
 *     never hand Recharts an empty dataset.
 *   - Otherwise the series is drawn inside a `ResponsiveContainer` so it fills
 *     the width of its card while honoring the fixed pixel `height`.
 *
 * @param data   - The NAV/performance points to plot.
 * @param height - Chart height in pixels (default `300`).
 */
export default function NavChart({ data, height = 300 }: NavChartProps) {
  // Phase 2 — no-data / malformed guard, rendered FIRST. The dynamic pixel
  // height is a prop-driven layout dimension (matching the chart's own
  // `ResponsiveContainer height`), so it is applied inline; all *visual* values
  // (color, border, radius, spacing) still resolve to Tailwind tokens.
  if (!data || data.length === 0) {
    return (
      <figure
        aria-label="NAV performance over time"
        className="flex items-center justify-center rounded-card border border-border bg-surface p-4 text-sm text-text-muted"
        style={{ height }}
      >
        No performance data available
      </figure>
    );
  }

  return (
    <figure
      aria-label="NAV performance over time"
      // `text-accent` sets the CSS `color` that `currentColor` resolves to for
      // every SVG stroke/fill below — the series color originates from a token.
      className="rounded-card border border-border bg-surface p-4 text-accent"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {/* Hairline horizontal grid — muted via opacity, no vertical rules. */}
          <CartesianGrid
            stroke="currentColor"
            strokeOpacity={0.12}
            vertical={false}
          />
          {/* X axis: month-end dates formatted "Jan 2024" via `formatDate`. */}
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value)}
            tick={{ fill: "currentColor", fillOpacity: 0.65 }}
            tickLine={false}
            axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
            minTickGap={24}
          />
          {/* Y axis: compact currency ticks ("$468.2M") via `formatCompactCurrency`. */}
          <YAxis
            tickFormatter={(value) => formatCompactCurrency(value)}
            tick={{ fill: "currentColor", fillOpacity: 0.65 }}
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
