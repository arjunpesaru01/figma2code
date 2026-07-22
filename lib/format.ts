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
 * Maximum fraction digits accepted by `Number.prototype.toFixed` and
 * `Intl.NumberFormat`. Precision beyond this range throws a `RangeError`, so
 * every caller-supplied `decimals` is clamped into `[0, MAX_FRACTION_DIGITS]`
 * before use (MN-05).
 */
const MAX_FRACTION_DIGITS = 20 as const;

/**
 * Deterministic "no data" glyph (an em dash) returned when a numeric formatter
 * is handed a NON-FINITE value (`NaN` / `±Infinity`). It matches the
 * placeholder already used by `NavChart`'s tooltip and the section tables, so a
 * bad datum degrades to a consistent, readable dash instead of leaking `"NaN"`
 * or `"∞"` into a `tabular-nums` numeric cell (MN-05).
 */
const NON_FINITE_FALLBACK = "\u2014" as const;

/**
 * Clamp a caller-supplied fraction-digit count into the valid, non-throwing
 * range for `toFixed` / `Intl.NumberFormat`.
 *
 * A non-finite or non-integer input is floored, and the result is clamped to
 * `[0, MAX_FRACTION_DIGITS]`, so an out-of-range or fractional `decimals` can
 * never throw a `RangeError` — it degrades deterministically instead (MN-05).
 *
 * @param decimals - Requested fraction digits (possibly invalid).
 * @returns A safe integer in `[0, MAX_FRACTION_DIGITS]`.
 */
function clampDecimals(decimals: number): number {
  if (!Number.isFinite(decimals)) {
    return 0;
  }
  return Math.min(Math.max(Math.floor(decimals), 0), MAX_FRACTION_DIGITS);
}

/**
 * Round a value to `decimals` fraction digits using DECIMAL half-expansion
 * (round half AWAY FROM ZERO), independent of IEEE-754 binary artifacts.
 *
 * `Number.prototype.toFixed` rounds the underlying binary double, so a value a
 * developer authors as `1.45` (stored as `1.44999…`) rounds DOWN to `1.4` — the
 * defect behind MJ-11. This helper instead rescales through the number's
 * SHORTEST round-trip string form (`` `${magnitude}e${decimals}` ``), which
 * recovers the intended decimal (`"1.45"` → `"1.45e1"` → exactly `14.5`),
 * rounds that non-negative magnitude with `Math.round` (so halves always expand
 * upward), then rescales back and reapplies the sign last. Thus `-1.45` → `-1.5`
 * and `1.45` → `1.5`, while already-clean values are untouched (`13.6` → `13.6`,
 * `-2.3` → `-2.3`).
 *
 * @param value    - The finite value to round (callers guard non-finite first).
 * @param decimals - Non-negative fraction digits (already clamped).
 * @returns The decimal-rounded number.
 */
function roundHalfAwayFromZero(value: number, decimals: number): number {
  const sign = value < 0 ? -1 : 1;
  const magnitude = Math.abs(value);
  // Rescale via the shortest round-trip string so the intended decimal — not
  // the binary approximation — is what gets rounded. Guard the pathological
  // case where `magnitude` is small/large enough that `Number.prototype.toString`
  // emits exponential notation (e.g. `1e-7`), which would make the template
  // `` `${magnitude}e${decimals}` `` a malformed `"1e-7e1"` that parses to `NaN`
  // (and would otherwise leak "NaN" into a numeric cell, MN-05). In that regime
  // the binary approximation is already exact enough, so fall back to arithmetic
  // scaling; the string path still governs every realistic decimal (1.45 → 1.5).
  const rescaled = Number(`${magnitude}e${decimals}`);
  const rounded = Number.isFinite(rescaled)
    ? Math.round(rescaled)
    : Math.round(magnitude * 10 ** decimals);
  const result = Number(`${rounded}e-${decimals}`);
  return sign * (Number.isFinite(result) ? result : rounded / 10 ** decimals);
}

/**
 * Whether `iso` denotes a valid, real calendar date/instant.
 *
 * Returns `true` only when `iso` (a) parses to a real `Date` AND (b) — for a
 * date-only `YYYY-MM-DD` string — round-trips its UTC year/month/day exactly.
 * The round-trip guard rejects IMPOSSIBLE dates such as `"2024-02-30"` that
 * `new Date` would otherwise silently roll forward into March (the defect
 * behind MJ-07 in `NavChart`). Datetime strings carrying a time/offset
 * component are validated by the parse check alone, so a UTC-normalized instant
 * that legitimately lands on a different calendar day is not rejected.
 *
 * Exported so the single strict-validation rule is shared by `formatDate` (its
 * malformed-input guard) and `NavChart` (its point filter), rather than being
 * re-implemented divergently at each site.
 *
 * @param iso - Candidate ISO 8601 date or datetime string.
 * @returns `true` when the string denotes a real calendar date/instant.
 *
 * @example
 * isValidDateString("2024-06-30"); // true
 * isValidDateString("2024-02-30"); // false (impossible → would roll to Mar 1)
 * isValidDateString("not-a-date"); // false
 */
export function isValidDateString(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  // Strict calendar guard for date-only inputs (`YYYY-MM-DD`): `new Date`
  // silently rolls impossible dates over (e.g. "2024-02-30" -> Mar 1), so
  // round-trip the parsed UTC components against the literal input.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() + 1 !== Number(month) ||
      date.getUTCDate() !== Number(day)
    ) {
      return false;
    }
  }
  return true;
}

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
  // Non-finite guard (MN-05): never leak "NaN" / "∞" into a numeric cell.
  if (!Number.isFinite(value)) {
    return NON_FINITE_FALLBACK;
  }
  const { currency = DEFAULT_CURRENCY, decimals = 0 } = options;
  const fractionDigits = clampDecimals(decimals);
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
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
  // Non-finite guard (MN-05): never leak "NaN" / "∞" into a numeric cell.
  if (!Number.isFinite(value)) {
    return NON_FINITE_FALLBACK;
  }
  const { currency = DEFAULT_CURRENCY, decimals = 1 } = options;
  const fractionDigits = clampDecimals(decimals);
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Format a bare count / quantity (e.g. a share or unit count) with thousands
 * grouping — the single, central formatter for non-currency, non-percentage
 * integer quantities.
 *
 * Uses `Intl.NumberFormat` with the default `"decimal"` style (NOT currency, so
 * no `$`, and NOT percent). The default of **0** fraction digits yields a whole
 * grouped integer; pass `decimals` for fractional quantities (e.g. fund units).
 * Output belongs in a `font-mono tabular-nums` cell so quantity columns align
 * to the same monospace grid as the currency/percentage columns — which is why
 * quantities go through this shared helper rather than a raw `toLocaleString`
 * at the call site (MN-03).
 *
 * @param value    - The count / quantity to format.
 * @param decimals - Fixed fraction digits (min = max, default `0`).
 * @returns The grouped quantity string, e.g. `formatQuantity(12500)` → `"12,500"`.
 *
 * @example
 * formatQuantity(12500);        // "12,500"
 * formatQuantity(1234.5, 2);    // "1,234.50"
 */
export function formatQuantity(value: number, decimals = 0): string {
  // Non-finite guard (MN-05): never leak "NaN" / "∞" into a numeric cell.
  if (!Number.isFinite(value)) {
    return NON_FINITE_FALLBACK;
  }
  const fractionDigits = clampDecimals(decimals);
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
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
  // Non-finite guard (MN-05): never leak "NaN" / "∞" into a numeric cell.
  if (!Number.isFinite(value)) {
    return NON_FINITE_FALLBACK;
  }
  const fractionDigits = clampDecimals(decimals);
  // Decimal half-expansion rounding (MJ-11): round the intended decimal, not
  // the raw binary double, so an authored `-1.45` renders as `-1.5%` (not the
  // `-1.4%` that a plain `toFixed` on the `1.44999…` double would produce).
  const rounded = roundHalfAwayFromZero(value, fractionDigits);
  return `${rounded.toFixed(fractionDigits)}%`;
}

/**
 * Format a signed percentage, prefixing an explicit `"+"` for positive values.
 *
 * The value is FIRST rounded to the requested display precision, then the sign
 * is derived from that rounded display value — so a magnitude that rounds to
 * zero (e.g. `0.04` at 1 decimal) renders as an unsigned `"0.0%"` rather than a
 * misleading `"+0.0%"` or `"-0.0%"`. Negative zero is normalized away. Positive
 * values get an explicit `"+"`, negatives keep `"-"`, and a displayed zero gets
 * no sign. Useful for day-change / P&L percentage indicators whose direction
 * must read at a glance.
 *
 * @param value    - Signed percentage value in percent units.
 * @param decimals - Fixed fraction digits (default `1`).
 * @returns The signed percentage string.
 *
 * @example
 * formatSignedPercent(13.6);   // "+13.6%"
 * formatSignedPercent(-2.3);   // "-2.3%"
 * formatSignedPercent(0);      // "0.0%"
 * formatSignedPercent(0.04);   // "0.0%"  (rounds to zero → no sign)
 * formatSignedPercent(-0.04);  // "0.0%"  (rounds to zero → no sign)
 */
export function formatSignedPercent(value: number, decimals = 1): string {
  // Non-finite guard (MN-05): never leak "NaN" / "∞" into a numeric cell.
  if (!Number.isFinite(value)) {
    return NON_FINITE_FALLBACK;
  }
  const fractionDigits = clampDecimals(decimals);
  // Round to the display precision with DECIMAL half-expansion (MJ-11) BEFORE
  // choosing a sign — so an authored `-1.45` becomes `-1.5` (not `-1.4`) and a
  // near-zero input that rounds to zero (e.g. `0.04` at 1 dp) is not given a
  // false "+"/"-". `rounded === 0` also collapses negative zero to unsigned.
  const rounded = roundHalfAwayFromZero(value, fractionDigits);
  const normalized = rounded === 0 ? 0 : rounded;
  const sign = normalized > 0 ? "+" : normalized < 0 ? "-" : "";
  return `${sign}${Math.abs(normalized).toFixed(fractionDigits)}%`;
}

/**
 * Format a signed currency amount, prefixing an explicit `"+"` or `"-"`.
 *
 * The magnitude (`Math.abs(value)`) is rendered through {@link formatCurrency}
 * by default, or {@link formatCompactCurrency} when `options.compact` is `true`.
 * The sign is then derived from the ROUNDED DISPLAY value: if the magnitude
 * formats identically to zero (e.g. `"$0"` or `"$0.0"`), no sign is added — so a
 * sub-unit value never renders as a misleading `"-$0"` / `"+$0"`. `currency` and
 * `decimals` are passed through to the underlying formatter.
 *
 * @param value   - Signed monetary amount in the target `currency`'s base units.
 * @param options - Optional overrides.
 * @param options.currency - ISO 4217 currency code (default `"USD"`).
 * @param options.decimals - Fixed fraction digits for the underlying formatter.
 * @param options.compact  - When `true`, use compact notation (default `false`).
 * @returns The signed currency string.
 *
 * @example
 * formatSignedCurrency(6_320_000);                    // "+$6,320,000"
 * formatSignedCurrency(-82_800);                      // "-$82,800"
 * formatSignedCurrency(6_320_000, { compact: true }); // "+$6.3M"
 * formatSignedCurrency(-0.3);                          // "$0"  (rounds to zero → no sign)
 */
export function formatSignedCurrency(
  value: number,
  options: { currency?: string; decimals?: number; compact?: boolean } = {},
): string {
  // Non-finite guard (MN-05): never emit a malformed "+—" / "-—"; degrade to
  // the same deterministic dash the underlying formatters return.
  if (!Number.isFinite(value)) {
    return NON_FINITE_FALLBACK;
  }
  const { compact = false, ...currencyOptions } = options;
  const magnitude = Math.abs(value);
  const formatted = compact
    ? formatCompactCurrency(magnitude, currencyOptions)
    : formatCurrency(magnitude, currencyOptions);
  // Derive the sign from the ROUNDED DISPLAY value, not the raw input: when the
  // magnitude formats identically to zero (a sub-cent / sub-unit value rounding
  // to "$0" / "$0.0"), emit no sign so we never render a misleading "-$0"/"+$0".
  const zeroFormatted = compact
    ? formatCompactCurrency(0, currencyOptions)
    : formatCurrency(0, currencyOptions);
  const sign =
    formatted === zeroFormatted ? "" : value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatted}`;
}

/**
 * Format an ISO 8601 date string for display.
 *
 * Parses `iso` into a `Date` and formats it with `Intl.DateTimeFormat`. The
 * time zone is fixed to `"UTC"` — applied AFTER any caller `options` so it can
 * never be overridden — so a date-only string such as `"2024-01-31"` never
 * drifts to the previous month in negative-offset locales.
 *
 * Malformed input is handled defensively (per the technical specification's
 * edge-case handling, §5.2.3): the raw `iso` is returned unchanged when either
 * (a) it does not parse to a valid date, or (b) it is a date-only string whose
 * calendar components do not round-trip — i.e. an impossible date such as
 * `"2024-02-30"` that JavaScript would otherwise silently roll forward into
 * March.
 *
 * @param iso     - An ISO 8601 date or datetime string, e.g. `"2024-01-31"`.
 * @param options - `Intl.DateTimeFormat` options (default `{ month: "short", year: "numeric" }`).
 * @returns The formatted date string, or the raw `iso` if it is malformed.
 *
 * @example
 * formatDate("2024-01-31");                          // "Jan 2024"
 * formatDate("2024-06-28", { dateStyle: "medium" }); // "Jun 28, 2024"
 * formatDate("2024-02-30");                          // "2024-02-30" (impossible date → raw)
 * formatDate("not-a-date");                          // "not-a-date"
 */
export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" },
): string {
  // Malformed / impossible input is handled defensively (AAP §5.2.3): return
  // the raw `iso` unchanged when it does not denote a real calendar date. The
  // strict parse + calendar round-trip rule (which rejects impossible dates
  // like "2024-02-30" that `new Date` would roll forward) lives in the shared
  // `isValidDateString` helper, so `NavChart`'s point filter applies the exact
  // same check rather than a divergent re-implementation (MJ-07).
  if (!isValidDateString(iso)) {
    return iso;
  }
  // `timeZone: "UTC"` is spread LAST so a caller-supplied `timeZone` cannot
  // override the fixed-UTC display contract — a date-only string such as
  // "2024-01-31" never drifts to the previous month in negative-offset locales.
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" }).format(
    new Date(iso),
  );
}

/**
 * Format a calendar quarter + year as a period label, e.g. `"Q2 2024"`.
 *
 * Centralises period rendering so a quarter modeled structurally (a `quarter`
 * number 1–4 plus a `year`) is never embedded as a raw literal in prose — the
 * numeric parts (`2`, `2024`) then render inside a `font-mono tabular-nums`
 * fragment at the call site, satisfying the numeric-contract requirement
 * (MJ-12).
 *
 * @param quarter - Calendar quarter, `1`–`4`.
 * @param year    - Four-digit calendar year.
 * @returns The period label, e.g. `formatQuarter(2, 2024)` → `"Q2 2024"`.
 *
 * @example
 * formatQuarter(2, 2024); // "Q2 2024"
 * formatQuarter(4, 2023); // "Q4 2023"
 */
export function formatQuarter(quarter: number, year: number): string {
  // Validate the quarter (an integer 1–4) and a plausible calendar year
  // (integer within 1–9999) (MN-05): an out-of-range quarter such as `9` or a
  // non-finite/implausible year must not render a nonsensical "Q9 2024" label.
  // Degrade to the deterministic no-data dash instead.
  if (
    !Number.isInteger(quarter) ||
    quarter < 1 ||
    quarter > 4 ||
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999
  ) {
    return NON_FINITE_FALLBACK;
  }
  return `Q${quarter} ${year}`;
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
  // Explicit non-finite guard (MN-05): a `NaN` input is treated as a NEUTRAL,
  // no-direction result rather than silently falling through the comparisons
  // below to an implicit "flat". (`Infinity` / `-Infinity` intentionally still
  // map to "up" / "down" so a legitimately extreme signed change keeps its
  // direction.)
  if (Number.isNaN(value)) {
    return "flat";
  }
  if (value > 0) {
    return "up";
  }
  if (value < 0) {
    return "down";
  }
  return "flat";
}
