/**
 * components/CollateralTable.tsx — Collateral positions (Cash & Collateral).
 * ---------------------------------------------------------------------------
 * A FIRST-PARTY presentational React component for the "Finebank" institutional
 * portfolio-oversight dashboard. It renders pledged and received collateral —
 * one row per position — as a single, data-dense, semantic HTML `<table>`.
 * Consumed by `app/cash-collateral/page.tsx`, which passes the static
 * `cashCollateralData.collateral` rows from `@/lib/mock-data`.
 *
 * WHY A DEDICATED COMPONENT (AAP §0.5.1, MJ-02):
 *   Extracts the collateral-table markup so the Cash & Collateral page stays a
 *   thin composition and the semantic / monospace / token rules live in one
 *   place (mirroring `HoldingsTable`), satisfying the review's requirement for
 *   "reusable semantic presentation" of the actual frame content.
 *
 * DESIGN CONTRACT (AAP §0.5 / §7.7.2 / §5.2.3):
 *   • SERVER COMPONENT — no `"use client"`, no hooks, pure static projection.
 *   • SEMANTIC MARKUP — real table elements + `sr-only` `<caption>`; column
 *     headers `<th scope="col">`; each row keyed by counterparty via
 *     `<th scope="row">`.
 *   • MONOSPACE NUMERICS (README L26) — market value, haircut, and posted value
 *     render `font-mono tabular-nums text-right`; numeric headers share that
 *     rhythm.
 *   • DIRECTION conveyed by a TEXT badge (never color alone): "Pledged"
 *     (posted out) vs "Received" (held), each on a muted institutional token
 *     tint. Because the label is textual, meaning is not encoded by color alone
 *     (WCAG).
 *   • ZERO HARDCODED STYLE VALUES — every value resolves to a
 *     `tailwind.config.ts` token or standard Tailwind scale utility.
 */

import FigureText from "@/components/FigureText";
import type { CollateralPosition } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/format";

/**
 * Public props for {@link CollateralTable}. `rows` is the ordered set of
 * collateral positions to render (may be empty → explicit empty state).
 */
export interface CollateralTableProps {
  /** Collateral rows to render (from `cashCollateralData.collateral`). */
  rows: CollateralPosition[];
}

/** Horizontal alignment role for a column. */
type ColumnAlign = "left" | "right";

/** Declarative descriptor for a table column header. */
interface ColumnDef {
  id: string;
  label: string;
  align: ColumnAlign;
}

/** Ordered column definitions (single source of truth for `<thead>` + colSpan). */
const COLUMNS: readonly ColumnDef[] = [
  { id: "counterparty", label: "Counterparty", align: "left" },
  { id: "instrument", label: "Instrument", align: "left" },
  { id: "direction", label: "Direction", align: "left" },
  { id: "marketValue", label: "Market Value", align: "right" },
  { id: "haircutPercent", label: "Haircut", align: "right" },
  { id: "postedValue", label: "Posted Value", align: "right" },
];

/**
 * Maps a collateral {@link CollateralPosition.direction} to its token-tinted
 * badge classes. Institutional, desaturated hues only: "pledged" uses the navy
 * accent tint (collateral posted OUT), "received" uses the muted steel-blue
 * info tint (collateral HELD). The visible label ("Pledged" / "Received")
 * carries the meaning, so color is never the sole signal.
 */
const DIRECTION_BADGE: Record<CollateralPosition["direction"], string> = {
  pledged: "bg-accent-subtle text-accent",
  received: "bg-info-subtle text-info",
};

/** Human-readable direction labels shown inside the badge. */
const DIRECTION_LABEL: Record<CollateralPosition["direction"], string> = {
  pledged: "Pledged",
  received: "Received",
};

/** Shared cell class fragments (mirrors `HoldingsTable`). */
const HEADER_CELL_BASE =
  "px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-muted whitespace-nowrap";
const HEADER_CELL_TEXT = `${HEADER_CELL_BASE} text-left font-sans`;
const HEADER_CELL_NUMERIC = `${HEADER_CELL_BASE} text-right font-mono tabular-nums`;
const NUMERIC_CELL =
  "px-3 py-2 align-middle text-right font-mono tabular-nums whitespace-nowrap text-text";
const TEXT_CELL = "px-3 py-2 align-middle text-left font-sans whitespace-nowrap";

/**
 * Collateral positions table.
 *
 * Renders a semantic table of {@link CollateralPosition} rows with monospace,
 * vertically-aligned numeric columns and a muted direction badge. When `rows`
 * is empty, a single muted full-width row communicates the empty state.
 *
 * @param props - {@link CollateralTableProps}.
 * @returns The collateral table wrapped in an institutional card container.
 */
export default function CollateralTable({ rows }: CollateralTableProps) {
  const isEmpty = rows.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* MJ-15: keyboard-focusable (`tabIndex={0}`), named
          (`role="region"` + `aria-label`) horizontal scroll region so
          keyboard-only users can scroll the grid; the global `:focus-visible`
          rule (app/globals.css) supplies the visible focus ring. */}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Pledged and received collateral"
        tabIndex={0}
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Pledged and received collateral</caption>

          <thead className="bg-surface-strong">
            <tr className="border-b border-border">
              {COLUMNS.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={
                    column.align === "right"
                      ? HEADER_CELL_NUMERIC
                      : HEADER_CELL_TEXT
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isEmpty ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-8 text-center font-sans text-sm text-text-muted"
                >
                  No collateral positions to display
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-subtle motion-safe:transition-colors"
                >
                  <th scope="row" className={`${TEXT_CELL} font-normal`}>
                    <span className="font-semibold text-text">
                      {row.counterparty}
                    </span>
                  </th>

                  <td className={`${TEXT_CELL} text-text-muted`}>
                    {/* Instrument descriptions embed bond figures (e.g.
                        "US Treasury 4.25% 2034"); FigureText renders those
                        numeric fragments monospace while the words stay sans
                        (MJ-13). The outer span inherits the cell's muted color. */}
                    <FigureText>{row.instrument}</FigureText>
                  </td>

                  <td className={TEXT_CELL}>
                    <span
                      className={`inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-medium ${DIRECTION_BADGE[row.direction]}`}
                    >
                      {DIRECTION_LABEL[row.direction]}
                    </span>
                  </td>

                  {/* Gross market value — whole dollars (base currency). */}
                  <td className={NUMERIC_CELL}>
                    {formatCurrency(row.marketValue)}
                  </td>

                  {/* Haircut applied — percentage, 1dp. */}
                  <td className={NUMERIC_CELL}>
                    {formatPercent(row.haircutPercent)}
                  </td>

                  {/* Value after haircut — whole dollars (base currency). */}
                  <td className={NUMERIC_CELL}>
                    {formatCurrency(row.postedValue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
