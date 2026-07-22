// Monospace-friendly number & date formatting utilities for the Finebank
// institutional portfolio-oversight dashboard.
//
// Every numeric surface in the app — KPI cards, holdings-table cells, chart
// axes/tooltips, and alerts — renders its display strings through the pure
// functions below. Those strings are placed inside `font-mono tabular-nums`
// cells so that currency and percentage COLUMNS ALIGN VERTICALLY. That
// monospace-alignment requirement is explicit in the product brief
// ("Numbers/figures should use a monospace font for tabular alignment",
// README.md) and the technical specification (§7.7.2). To honour it, this
// module produces CONSISTENT-WIDTH, CONSISTENT-DECIMAL output: each formatter
// has a FIXED default decimal count so a column of values shares an identical
// fractional width and grouping.
//
// Design contract (all enforced below):
//   - Pure functions only: no side effects, no shared mutable state, no I/O,
//     no async, no network/persistence. Calling any function twice with the
//     same arguments always yields the same result.
//   - Built-in `Intl` APIs only (`Intl.NumberFormat` / `Intl.DateTimeFormat`).
//     No third-party formatting/date library (no numeral, date-fns, dayjs, …).
//   - The locale is HARD-CODED to `"en-US"` for deterministic, snapshot-stable
//     output that never depends on the runtime's locale.
//   - Percentages are already expressed in PERCENT UNITS (e.g. `13.6` means
//     13.6%), matching the JSDoc conventions in `lib/types.ts`; values are
//     NEVER multiplied by 100 here.
//   - This module is concerned with the STRING ONLY. Colour (positive /
//     negative) and font are applied by React components via Tailwind tokens —
//     no HTML, JSX, or class names are emitted here.
//
// The only import is the `TrendDirection` type from `lib/types.ts` (type-only,
// so the emitted module has zero runtime imports and is `isolatedModules`-safe).

import type { TrendDirection } from "./types";

/**
 * Locale used for every `Intl` formatter in this module. Hard-coded so output
 * is deterministic regardless of the host runtime's locale. Immutable constant.
 */
const LOCALE = "en-US" as const;

/**
 * Default ISO 4217 currency used when a caller does not specify one. Matches the
 * dashboard's base reporting currency (`AccountPortfolio.currency`). Immutable.
 */
const DEFAULT_CURRENCY = "USD" as const;

/**
 * Format a value as a full currency string with thousands grouping.
 *
 * Uses `Intl.NumberFormat` with `style: "currency"`. The default of **0**
 * decimal places yields whole-dollar output (no cents), so whole-dollar columns
 * align cleanly in a `tabular-nums` grid.
 *
 * @param value   - Monetary amount in the target `currency`'s base units.
 * @param options - Optional overrides.
 * @param options.currency - ISO 4217 currency code (default `"USD"`).
 * @param options.decimals - Fixed fraction digits (min = max, default `0`).
 * @returns The formatted currency string, e.g. `formatCurrency(1234567)` → `"$1,234,567"`.
 *
 * @example
 * formatCurrency(1234567);              // "$1,234,567"
 * formatCurrency(1234.5, { decimals: 2 }); // "$1,234.50"
 */
export function formatCurrency(
  value: number,
  options: { currency?: string; decimals?: number } = {},
): string {
  const { currency = DEFAULT_CURRENCY, decimals = 0 } = options;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a value as a compact currency string (e.g. thousands → `K`,
 * millions → `M`, billions → `B`).
 *
 * Identical to {@link formatCurrency} but with `notation: "compact"` and a
 * default of **1** decimal place — the formatter that produces the brief's
 * headline figure `"$468.2M"`. Ideal for KPI headlines where space is tight.
 *
 * @param value   - Monetary amount in the target `currency`'s base units.
 * @param options - Optional overrides.
 * @param options.currency - ISO 4217 currency code (default `"USD"`).
 * @param options.decimals - Fixed fraction digits (min = max, default `1`).
 * @returns The compact currency string, e.g. `formatCompactCurrency(468_200_000)` → `"$468.2M"`.
 *
 * @example
 * formatCompactCurrency(468_200_000); // "$468.2M"
 * formatCompactCurrency(1500);        // "$1.5K"
 */
export function formatCompactCurrency(
  value: number,
  options: { currency?: string; decimals?: number } = {},
): string {
  const { currency = DEFAULT_CURRENCY, decimals = 1 } = options;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage value that is ALREADY in percent units.
 *
 * The input is treated as a percent figure (e.g. `13.6` → `"13.6%"`); it is
 * NOT multiplied by 100. A fixed number of decimals keeps a column of percent
 * values uniformly wide for `tabular-nums` alignment.
 *
 * @param value    - Percentage value in percent units (e.g. `13.6` for 13.6%).
 * @param decimals - Fixed fraction digits (default `1`).
 * @returns The percentage string, e.g. `formatPercent(13.6)` → `"13.6%"`.
 *
 * @example
 * formatPercent(13.6);      // "13.6%"
 * formatPercent(7, 0);      // "7%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a signed percentage, prefixing an explicit `"+"` for positive values.
 *
 * Negative values already carry their `"-"` sign from `toFixed`, so no prefix
 * is added for them; zero is rendered without a sign (e.g. `"0.0%"`). Useful
 * for day-change / P&L percentage indicators whose direction must read at a
 * glance.
 *
 * @param value    - Signed percentage value in percent units.
 * @param decimals - Fixed fraction digits (default `1`).
 * @returns The signed percentage string.
 *
 * @example
 * formatSignedPercent(13.6);  // "+13.6%"
 * formatSignedPercent(-2.3);  // "-2.3%"
 * formatSignedPercent(0);     // "0.0%"
 */
export function formatSignedPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a signed currency amount, prefixing an explicit `"+"` or `"-"`.
 *
 * The sign is derived from `value` and prepended to the formatted magnitude of
 * `Math.abs(value)`; zero receives no sign. The magnitude is rendered through
 * {@link formatCurrency} by default, or {@link formatCompactCurrency} when
 * `options.compact` is `true`. `currency` and `decimals` are passed through to
 * the underlying formatter.
 *
 * @param value   - Signed monetary amount in the target `currency`'s base units.
 * @param options - Optional overrides.
 * @param options.currency - ISO 4217 currency code (default `"USD"`).
 * @param options.decimals - Fixed fraction digits for the underlying formatter.
 * @param options.compact  - When `true`, use compact notation (default `false`).
 * @returns The signed currency string.
 *
 * @example
 * formatSignedCurrency(6_320_000);                 // "+$6,320,000"
 * formatSignedCurrency(-82_800);                   // "-$82,800"
 * formatSignedCurrency(6_320_000, { compact: true }); // "+$6.3M"
 */
export function formatSignedCurrency(
  value: number,
  options: { currency?: string; decimals?: number; compact?: boolean } = {},
): string {
  const { compact = false, ...currencyOptions } = options;
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const magnitude = Math.abs(value);
  const formatted = compact
    ? formatCompactCurrency(magnitude, currencyOptions)
    : formatCurrency(magnitude, currencyOptions);
  return `${sign}${formatted}`;
}

/**
 * Format an ISO 8601 date string for display.
 *
 * Parses `iso` into a `Date` and formats it with `Intl.DateTimeFormat`. The
 * time zone is fixed to `"UTC"` (merged before caller options) so that a
 * date-only string such as `"2024-01-31"` never drifts to the previous month
 * in negative-offset locales. If `iso` cannot be parsed into a valid date, the
 * raw input is returned unchanged as a defensive fallback for malformed data
 * (per the technical specification's edge-case handling, §5.2.3).
 *
 * @param iso     - An ISO 8601 date or datetime string, e.g. `"2024-01-31"`.
 * @param options - `Intl.DateTimeFormat` options (default `{ month: "short", year: "numeric" }`).
 * @returns The formatted date string, or the raw `iso` if it is unparseable.
 *
 * @example
 * formatDate("2024-01-31");                               // "Jan 2024"
 * formatDate("2024-06-28", { dateStyle: "medium" });      // "Jun 28, 2024"
 * formatDate("not-a-date");                               // "not-a-date"
 */
export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" },
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options }).format(
    date,
  );
}

/**
 * Classify a signed numeric value into a directional {@link TrendDirection}.
 *
 * Encodes the sign of a change (P&L, day change, return) into a discriminated
 * label that components map to muted directional (+/-) styling.
 *
 * @param value - A signed numeric value.
 * @returns `"up"` when `value > 0`, `"down"` when `value < 0`, otherwise `"flat"`.
 *
 * @example
 * trendDirection(1);   // "up"
 * trendDirection(-1);  // "down"
 * trendDirection(0);   // "flat"
 */
export function trendDirection(value: number): TrendDirection {
  if (value > 0) {
    return "up";
  }
  if (value < 0) {
    return "down";
  }
  return "flat";
}
