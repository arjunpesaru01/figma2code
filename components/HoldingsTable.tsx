/**
 * components/HoldingsTable.tsx — Data-dense portfolio holdings table.
 * ---------------------------------------------------------------------------
 * A FIRST-PARTY presentational React component for the "Finebank" institutional
 * portfolio-oversight dashboard (Next.js 14 App Router + TypeScript + Tailwind).
 * It renders the portfolio holdings as a single, data-dense, semantic HTML
 * `<table>` (README L16: "Holdings table with weight, market value, and change").
 * Consumed by `app/holdings/page.tsx`, which passes the static `holdings` array
 * from `@/lib/mock-data`.
 *
 * DESIGN CONTRACT (all enforced below — see the AAP §0.5 / §7.7.2 / §5.2.3):
 *   • SERVER COMPONENT. This file intentionally does NOT declare `"use client"`
 *     and uses no hooks or browser APIs. Sorting/filtering are out of scope this
 *     phase; the table is a pure, static projection of its `holdings` prop.
 *   • SEMANTIC MARKUP. Real `<table>`/`<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>` —
 *     never a grid of `<div>`s. A visually-hidden (`sr-only`) `<caption>` names
 *     the table for assistive technology; column headers use `<th scope="col">`
 *     and each row is identified by a `<th scope="row">` carrying its symbol.
 *   • MONOSPACE NUMERICS (the flagship requirement, README L26). EVERY numeric
 *     cell is `font-mono tabular-nums text-right` so currency, percentage, and
 *     weight columns share a uniform fractional width and align vertically.
 *     Text columns (symbol / name / asset class) stay left-aligned `font-sans`.
 *   • FORMATTING IS DELEGATED to `@/lib/format` so decimal precision is
 *     consistent per column (unit price 2dp, market value 0dp, percentages 1dp),
 *     which is precisely what keeps each column's fractional width uniform. A
 *     raw number is never rendered directly, and figures never fall back to the
 *     body font.
 *   • DIRECTIONAL (+/-) STYLING via tokens. The two day-change columns are
 *     colored by the sign of the change through `trendDirection()` mapped over
 *     `CHANGE_COLOR` — no hardcoded hex. Direction is ALSO conveyed textually by
 *     the leading `+`/`-` in the formatted string, so color is never the sole
 *     signal (accessibility).
 *   • ZERO HARDCODED STYLE VALUES. Every color / spacing / radius resolves to a
 *     `tailwind.config.ts` token or a standard Tailwind scale utility.
 *   • INSTITUTIONAL, MUTED, DATA-DENSE aesthetic (README L22-25): tight row
 *     padding, subtle `border-border` dividers, a restrained token-based hover —
 *     deliberately unlike a bright consumer-fintech app.
 */

import type { Holding, TrendDirection } from "@/lib/types";
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
  trendDirection,
} from "@/lib/format";

/**
 * Public props for {@link HoldingsTable}. Mirrors `HoldingsProps` from
 * `@/lib/types`; `holdings` is the ordered set of rows to render (may be empty,
 * in which case an explicit empty state is shown — never a blank `<tbody>`).
 */
export interface HoldingsTableProps {
  /** Rows rendered in the data-dense holdings table. */
  holdings: Holding[];
}

/**
 * Maps a {@link TrendDirection} to the semantic Tailwind text-color token used
 * for the day-change columns. Gains read as the muted institutional
 * `text-positive` (pine green), losses as `text-negative` (brick red), and a
 * flat (zero) change as the neutral `text-text-muted`. Token classes only — no
 * raw hex ever appears at a call site.
 */
const CHANGE_COLOR: Record<TrendDirection, string> = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-text-muted",
};

/** Horizontal alignment role for a column (drives header + cell text-align). */
type ColumnAlign = "left" | "right";

/** Declarative descriptor for a table column header. */
interface ColumnDef {
  /** Stable React key / identifier for the column. */
  id: string;
  /** Visible header label. */
  label: string;
  /**
   * Alignment: text columns are `"left"`; every numeric column is `"right"` so
   * its header sits directly above the right-aligned monospace figures.
   */
  align: ColumnAlign;
}

/**
 * Ordered column definitions. Kept as a single source of truth so the `<thead>`
 * renders DRY and the empty-state `colSpan` always matches the real column
 * count (`COLUMNS.length`). The set covers the README-required weight, market
 * value, and change, plus the identifying and context columns.
 */
const COLUMNS: readonly ColumnDef[] = [
  { id: "symbol", label: "Symbol", align: "left" },
  { id: "assetClass", label: "Asset Class", align: "left" },
  { id: "quantity", label: "Quantity", align: "right" },
  { id: "price", label: "Price", align: "right" },
  { id: "marketValue", label: "Market Value", align: "right" },
  { id: "weight", label: "Weight", align: "right" },
  { id: "dayChangePercent", label: "Day Change %", align: "right" },
  { id: "dayChangeValue", label: "Day Change $", align: "right" },
];

/**
 * Shared cell class fragments. Centralised so padding/typography stay identical
 * across every cell and the monospace-alignment contract cannot drift.
 *   - HEADER_CELL: muted uppercase label typography in the SANS face; the
 *     per-column alignment utility is appended at render time.
 *   - NUMERIC_CELL: the monospace + tabular-nums + right-align combo applied to
 *     EVERY figure; the color (primary ink or a directional token) is appended
 *     at render time.
 *   - TEXT_CELL: left-aligned sans body for the identifying / context columns.
 * `whitespace-nowrap` keeps every cell on a single line so the dense table
 * scrolls horizontally (via the `overflow-x-auto` wrapper) instead of wrapping
 * and breaking vertical alignment on narrow viewports (desktop-first).
 */
const HEADER_CELL =
  "px-3 py-2 font-sans text-xs font-medium uppercase tracking-wide text-text-muted whitespace-nowrap";
const NUMERIC_CELL =
  "px-3 py-2 align-middle text-right font-mono tabular-nums whitespace-nowrap";
const TEXT_CELL = "px-3 py-2 align-middle text-left font-sans whitespace-nowrap";

/**
 * Data-dense holdings table.
 *
 * Renders a semantic table of portfolio {@link Holding} rows with monospace,
 * vertically-aligned numeric columns and directional (+/-) coloring on the two
 * day-change columns. When `holdings` is empty, a single muted full-width row
 * communicates the empty state rather than rendering an empty body.
 *
 * @param props - {@link HoldingsTableProps}.
 * @returns The holdings table wrapped in an institutional card container.
 */
export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  const isEmpty = holdings.length === 0;

  return (
    // Institutional card container: white surface, hairline border, clipped
    // corners. The inner wrapper enables horizontal scrolling for the dense
    // grid on narrow viewports without breaking the page layout.
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* Screen-reader-only caption: names the table for assistive tech
              without adding visible chrome to the dense institutional layout. */}
          <caption className="sr-only">Portfolio holdings</caption>

          <thead className="bg-surface-strong">
            <tr className="border-b border-border">
              {COLUMNS.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`${HEADER_CELL} ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isEmpty ? (
              // Explicit empty state — never an empty <tbody> (AAP §5.2.3).
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-8 text-center font-sans text-sm text-text-muted"
                >
                  No holdings to display
                </td>
              </tr>
            ) : (
              holdings.map((holding) => {
                // Direction derived once from the percentage change and applied
                // to BOTH change columns so the %/$ pair is colored consistently.
                const changeColor =
                  CHANGE_COLOR[trendDirection(holding.dayChangePercent)];

                return (
                  <tr
                    key={holding.id}
                    className="hover:bg-surface-subtle motion-safe:transition-colors"
                  >
                    {/* Row header: identifies the row by instrument symbol with a
                        muted secondary name line beneath. `font-normal` overrides
                        the UA <th> bold; the symbol span opts back into semibold. */}
                    <th scope="row" className={`${TEXT_CELL} font-normal`}>
                      <span className="block font-semibold text-text">
                        {holding.symbol}
                      </span>
                      <span className="block text-xs text-text-muted">
                        {holding.name}
                      </span>
                    </th>

                    <td className={`${TEXT_CELL} text-text-muted`}>
                      {holding.assetClass}
                    </td>

                    {/* Quantity is a share/unit count (not currency): grouped via
                        toLocaleString, still inside a mono tabular-nums cell. */}
                    <td className={`${NUMERIC_CELL} text-text`}>
                      {holding.quantity.toLocaleString("en-US")}
                    </td>

                    {/* Unit price — cents precision (2dp). */}
                    <td className={`${NUMERIC_CELL} text-text`}>
                      {formatCurrency(holding.price, { decimals: 2 })}
                    </td>

                    {/* Market value — whole dollars (default 0dp). */}
                    <td className={`${NUMERIC_CELL} text-text`}>
                      {formatCurrency(holding.marketValue)}
                    </td>

                    {/* Portfolio weight — percent, 1dp. */}
                    <td className={`${NUMERIC_CELL} text-text`}>
                      {formatPercent(holding.weight)}
                    </td>

                    {/* Day change % — signed + sign-colored. */}
                    <td className={`${NUMERIC_CELL} ${changeColor}`}>
                      {formatSignedPercent(holding.dayChangePercent)}
                    </td>

                    {/* Day change $ — signed + sign-colored. */}
                    <td className={`${NUMERIC_CELL} ${changeColor}`}>
                      {formatSignedCurrency(holding.dayChangeValue)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
