/**
 * components/CorporateActionsTable.tsx — Corporate action events table.
 * ---------------------------------------------------------------------------
 * A FIRST-PARTY presentational React component for the "Finebank" institutional
 * portfolio-oversight dashboard. It renders upcoming and recent corporate-action
 * events — one row per event — as a single, data-dense, semantic HTML `<table>`.
 * Consumed by `app/corporate-actions/page.tsx`, which passes the static
 * `corporateActionsData.events` rows from `@/lib/mock-data`.
 *
 * WHY A DEDICATED COMPONENT (AAP §0.5.1, MJ-03):
 *   Extracts the events-table markup so the Corporate Actions page stays a thin
 *   composition and its semantic / monospace / token rules live in one place
 *   (mirroring `HoldingsTable`), satisfying the review's requirement for
 *   "reusable event/list/table UI" backed by real typed event/status/date data.
 *
 * DESIGN CONTRACT (AAP §0.5 / §7.7.2 / §5.2.3):
 *   • SERVER COMPONENT — no `"use client"`, no hooks, pure static projection.
 *   • SEMANTIC MARKUP — real table elements + `sr-only` `<caption>`; column
 *     headers `<th scope="col">`; each row keyed by security via
 *     `<th scope="row">`.
 *   • MONOSPACE DATES — the ex-date, pay-date, and election-deadline columns are
 *     structured, column-aligned data, so each renders inside a `<time>` element
 *     in `font-mono tabular-nums text-right` for clean vertical alignment (the
 *     same treatment the alerts panel gives embedded dates). A missing election
 *     deadline shows a muted em dash.
 *   • STATUS conveyed by a TEXT badge (never color alone) on a muted
 *     institutional token tint.
 *   • ZERO HARDCODED STYLE VALUES — every value resolves to a
 *     `tailwind.config.ts` token or standard Tailwind scale utility.
 */

import type { CorporateAction, CorporateActionStatus, CorporateActionType } from "@/lib/types";
import { formatDate } from "@/lib/format";

/**
 * Public props for {@link CorporateActionsTable}. `rows` is the ordered set of
 * events to render (may be empty → explicit empty state).
 */
export interface CorporateActionsTableProps {
  /** Event rows to render (from `corporateActionsData.events`). */
  rows: CorporateAction[];
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
  { id: "security", label: "Security", align: "left" },
  { id: "type", label: "Type", align: "left" },
  { id: "description", label: "Description", align: "left" },
  { id: "exDate", label: "Ex-Date", align: "right" },
  { id: "payDate", label: "Pay Date", align: "right" },
  { id: "electionDeadline", label: "Election By", align: "right" },
  { id: "status", label: "Status", align: "left" },
];

/** Human-readable labels for each corporate-action type. */
const TYPE_LABEL: Record<CorporateActionType, string> = {
  dividend: "Dividend",
  split: "Split",
  merger: "Merger",
  rights: "Rights",
  tender: "Tender",
  vote: "Vote",
};

/**
 * Maps a {@link CorporateActionStatus} to its token-tinted badge classes.
 * Institutional, desaturated hues only. The visible label carries the meaning,
 * so color is never the sole signal (WCAG).
 */
const STATUS_BADGE: Record<CorporateActionStatus, string> = {
  pending: "bg-warning-subtle text-warning",
  confirmed: "bg-info-subtle text-info",
  elected: "bg-accent-subtle text-accent",
  processed: "bg-positive-subtle text-positive",
};

/** Human-readable status labels shown inside the badge. */
const STATUS_LABEL: Record<CorporateActionStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  elected: "Elected",
  processed: "Processed",
};

/** Fixed options for the compact calendar dates in this table. */
const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

/** Shared cell class fragments (mirrors `HoldingsTable`). */
const HEADER_CELL_BASE =
  "px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-muted whitespace-nowrap";
const HEADER_CELL_TEXT = `${HEADER_CELL_BASE} text-left font-sans`;
const HEADER_CELL_NUMERIC = `${HEADER_CELL_BASE} text-right font-mono tabular-nums`;
const DATE_CELL =
  "px-3 py-2 align-middle text-right font-mono tabular-nums whitespace-nowrap text-text";
const TEXT_CELL = "px-3 py-2 align-middle text-left font-sans whitespace-nowrap";

/**
 * A single column-aligned date cell. Renders the ISO date through `formatDate`
 * inside a semantic `<time>` (with a machine-readable `dateTime`), in monospace
 * tabular figures so the date columns align vertically. A missing/undefined
 * date renders a muted em dash.
 *
 * @param iso - ISO 8601 date string, or `undefined` when the date is not set.
 * @returns The date cell content.
 */
function DateCell({ iso }: { iso?: string }) {
  if (!iso) {
    return <span className="text-text-muted">—</span>;
  }
  return <time dateTime={iso}>{formatDate(iso, DATE_OPTS)}</time>;
}

/**
 * Corporate action events table.
 *
 * Renders a semantic table of {@link CorporateAction} rows with monospace,
 * vertically-aligned date columns and a muted status badge. When `rows` is
 * empty, a single muted full-width row communicates the empty state.
 *
 * @param props - {@link CorporateActionsTableProps}.
 * @returns The events table wrapped in an institutional card container.
 */
export default function CorporateActionsTable({ rows }: CorporateActionsTableProps) {
  const isEmpty = rows.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Corporate action events</caption>

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
                  No corporate actions to display
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-subtle motion-safe:transition-colors"
                >
                  {/* Row header: symbol (mono, so tickers align) + issuer name. */}
                  <th scope="row" className={`${TEXT_CELL} font-normal`}>
                    <span className="block font-mono font-semibold tabular-nums text-text">
                      {row.security}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {row.securityName}
                    </span>
                  </th>

                  <td className={`${TEXT_CELL} text-text`}>
                    {TYPE_LABEL[row.type]}
                  </td>

                  <td className={`${TEXT_CELL} text-text-muted`}>
                    {row.description}
                  </td>

                  <td className={DATE_CELL}>
                    <DateCell iso={row.exDate} />
                  </td>

                  <td className={DATE_CELL}>
                    <DateCell iso={row.payDate} />
                  </td>

                  <td className={DATE_CELL}>
                    <DateCell iso={row.electionDeadline} />
                  </td>

                  <td className={TEXT_CELL}>
                    <span
                      className={`inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
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
