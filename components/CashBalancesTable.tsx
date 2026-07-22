/**
 * components/CashBalancesTable.tsx — Cash balances by currency (Cash & Collateral).
 * ---------------------------------------------------------------------------
 * A FIRST-PARTY presentational React component for the "Finebank" institutional
 * portfolio-oversight dashboard (Next.js 14 App Router + TypeScript + Tailwind).
 * It renders the account's cash positions — one row per currency / account
 * bucket — as a single, data-dense, semantic HTML `<table>`. Consumed by
 * `app/cash-collateral/page.tsx`, which passes the static `cashCollateralData`
 * cash-balance rows from `@/lib/mock-data`.
 *
 * WHY A DEDICATED COMPONENT (AAP §0.5.1, MJ-02):
 *   The AAP mandates first-party components over ad-hoc markup inside pages, and
 *   the review requires "reusable semantic presentation" for the Cash &
 *   Collateral frame. This component extracts the cash-balances table markup so
 *   the page stays a thin composition (mirroring how `HoldingsTable` backs the
 *   `/holdings` route), and so its semantic/monospace/token rules are enforced
 *   in one place rather than re-implemented per page.
 *
 * DESIGN CONTRACT (all enforced below — AAP §0.5 / §7.7.2 / §5.2.3):
 *   • SERVER COMPONENT. No `"use client"`, no hooks, no browser APIs — a pure,
 *     static projection of its `rows` prop.
 *   • SEMANTIC MARKUP. Real `<table>`/`<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>`
 *     with a visually-hidden (`sr-only`) `<caption>`; column headers use
 *     `<th scope="col">` and each row is identified by a `<th scope="row">`
 *     carrying its currency code.
 *   • MONOSPACE NUMERICS (README L26). EVERY numeric cell — the native-currency
 *     balance, the base-currency balance, and the available percentage — is
 *     `font-mono tabular-nums text-right`, and the numeric column headers share
 *     that monospace rhythm so they align with the figures beneath.
 *   • FORMATTING IS DELEGATED to `@/lib/format`: native balances render in their
 *     OWN ISO currency (so the symbol reflects the currency), base balances in
 *     USD, and the available share as a percentage.
 *   • ZERO HARDCODED STYLE VALUES. Every color / spacing / radius resolves to a
 *     `tailwind.config.ts` token or a standard Tailwind scale utility.
 *   • INSTITUTIONAL, MUTED, DATA-DENSE aesthetic (README L22-25).
 */

import type { CashBalance } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/format";

/**
 * Public props for {@link CashBalancesTable}. `rows` is the ordered set of cash
 * balances to render (may be empty, in which case an explicit empty state is
 * shown — never a blank `<tbody>`).
 */
export interface CashBalancesTableProps {
  /** Cash-balance rows to render (from `cashCollateralData.cashBalances`). */
  rows: CashBalance[];
}

/** Horizontal alignment role for a column (drives header + cell text-align). */
type ColumnAlign = "left" | "right";

/** Declarative descriptor for a table column header. */
interface ColumnDef {
  /** Stable React key / identifier for the column. */
  id: string;
  /** Visible header label. */
  label: string;
  /** Text columns are `"left"`; numeric columns are `"right"`. */
  align: ColumnAlign;
}

/**
 * Ordered column definitions — a single source of truth so the `<thead>`
 * renders DRY and the empty-state `colSpan` always matches the real column
 * count (`COLUMNS.length`).
 */
const COLUMNS: readonly ColumnDef[] = [
  { id: "currency", label: "Currency", align: "left" },
  { id: "accountType", label: "Account", align: "left" },
  { id: "balance", label: "Balance", align: "right" },
  { id: "balanceBase", label: "Balance (USD)", align: "right" },
  { id: "availablePercent", label: "Available", align: "right" },
];

/**
 * Shared cell class fragments (centralised so padding/typography stay identical
 * across cells and the monospace-alignment contract cannot drift). Mirrors the
 * conventions established in `HoldingsTable`.
 */
const HEADER_CELL_BASE =
  "px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-muted whitespace-nowrap";
const HEADER_CELL_TEXT = `${HEADER_CELL_BASE} text-left font-sans`;
const HEADER_CELL_NUMERIC = `${HEADER_CELL_BASE} text-right font-mono tabular-nums`;
const NUMERIC_CELL =
  "px-3 py-2 align-middle text-right font-mono tabular-nums whitespace-nowrap text-text";
const TEXT_CELL = "px-3 py-2 align-middle text-left font-sans whitespace-nowrap";

/**
 * Cash balances table.
 *
 * Renders a semantic table of {@link CashBalance} rows with monospace,
 * vertically-aligned numeric columns. When `rows` is empty, a single muted
 * full-width row communicates the empty state rather than an empty body.
 *
 * @param props - {@link CashBalancesTableProps}.
 * @returns The cash-balances table wrapped in an institutional card container.
 */
export default function CashBalancesTable({ rows }: CashBalancesTableProps) {
  const isEmpty = rows.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Cash balances by currency</caption>

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
                  No cash balances to display
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-subtle motion-safe:transition-colors"
                >
                  {/* Row header: the ISO currency code identifies the row. */}
                  <th scope="row" className={`${TEXT_CELL} font-normal`}>
                    <span className="font-mono font-semibold tabular-nums text-text">
                      {row.currency}
                    </span>
                  </th>

                  <td className={`${TEXT_CELL} text-text-muted`}>
                    {row.accountType}
                  </td>

                  {/* Native-currency balance — full precision, rendered in its
                      OWN currency so the symbol reflects the row's currency
                      (e.g. €, £, ¥). Full (not compact) figures match the
                      `HoldingsTable` convention and keep the column exact. */}
                  <td className={NUMERIC_CELL}>
                    {formatCurrency(row.balance, { currency: row.currency })}
                  </td>

                  {/* Base-currency (USD) balance — full precision so the column
                      sums EXACTLY to the Total Cash summary KPI ($32,200,000). */}
                  <td className={NUMERIC_CELL}>
                    {formatCurrency(row.balanceBase)}
                  </td>

                  {/* Unencumbered / available share as a percentage. */}
                  <td className={NUMERIC_CELL}>
                    {formatPercent(row.availablePercent)}
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
