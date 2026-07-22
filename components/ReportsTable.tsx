/**
 * components/ReportsTable.tsx — Report inventory table (Reporting screen).
 * ---------------------------------------------------------------------------
 * A FIRST-PARTY presentational React component for the "Finebank" institutional
 * portfolio-oversight dashboard. It renders the report inventory — one row per
 * report — as a single, data-dense, semantic HTML `<table>`. Consumed by
 * `app/reporting/page.tsx`, which passes the static `reportingData.reports`
 * rows from `@/lib/mock-data`.
 *
 * WHY A DEDICATED COMPONENT (AAP §0.5.1, MJ-04):
 *   Extracts the report-inventory markup so the Reporting page stays a thin
 *   composition and its semantic / monospace / token rules live in one place
 *   (mirroring `HoldingsTable`), satisfying the review's requirement for
 *   "semantic report presentation" backed by real typed report/period/status/
 *   format data.
 *
 * DESIGN CONTRACT (AAP §0.5 / §7.7.2 / §5.2.3):
 *   • SERVER COMPONENT — no `"use client"`, no hooks, pure static projection.
 *   • SEMANTIC MARKUP — real table elements + `sr-only` `<caption>`; column
 *     headers `<th scope="col">`; each row keyed by report name via
 *     `<th scope="row">`.
 *   • MONOSPACE NUMERICS (README L26) — the generated date and file-size columns
 *     render `font-mono tabular-nums text-right` (the date inside a `<time>`),
 *     so they align vertically; a not-yet-generated report shows a muted em dash.
 *   • FORMAT + STATUS conveyed by TEXT chips/badges (never color alone) on muted
 *     institutional token tints.
 *   • ZERO HARDCODED STYLE VALUES — every value resolves to a
 *     `tailwind.config.ts` token or standard Tailwind scale utility.
 */

import type { ReportItem, ReportStatus } from "@/lib/types";
import { formatDate, formatQuantity } from "@/lib/format";

/**
 * Public props for {@link ReportsTable}. `rows` is the ordered set of reports
 * to render (may be empty → explicit empty state).
 */
export interface ReportsTableProps {
  /** Report rows to render (from `reportingData.reports`). */
  rows: ReportItem[];
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
  { id: "name", label: "Report", align: "left" },
  { id: "period", label: "Period", align: "left" },
  { id: "format", label: "Format", align: "left" },
  { id: "status", label: "Status", align: "left" },
  { id: "generatedOn", label: "Generated", align: "right" },
  { id: "sizeKb", label: "Size", align: "right" },
];

/**
 * Maps a {@link ReportStatus} to its token-tinted badge classes. Institutional,
 * desaturated hues only. The visible label carries the meaning, so color is
 * never the sole signal (WCAG).
 */
const STATUS_BADGE: Record<ReportStatus, string> = {
  available: "bg-positive-subtle text-positive",
  generating: "bg-warning-subtle text-warning",
  scheduled: "bg-info-subtle text-info",
  archived: "bg-surface-strong text-text-muted",
};

/** Human-readable status labels shown inside the badge. */
const STATUS_LABEL: Record<ReportStatus, string> = {
  available: "Available",
  generating: "Generating",
  scheduled: "Scheduled",
  archived: "Archived",
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
const NUMERIC_CELL =
  "px-3 py-2 align-middle text-right font-mono tabular-nums whitespace-nowrap text-text";
const TEXT_CELL = "px-3 py-2 align-middle text-left font-sans whitespace-nowrap";

/**
 * Report inventory table.
 *
 * Renders a semantic table of {@link ReportItem} rows with monospace,
 * vertically-aligned generated-date and size columns, plus muted format/status
 * badges. When `rows` is empty, a single muted full-width row communicates the
 * empty state.
 *
 * @param props - {@link ReportsTableProps}.
 * @returns The report inventory table wrapped in an institutional card container.
 */
export default function ReportsTable({ rows }: ReportsTableProps) {
  const isEmpty = rows.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Report inventory</caption>

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
                  No reports to display
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-subtle motion-safe:transition-colors"
                >
                  <th scope="row" className={`${TEXT_CELL} font-normal`}>
                    <span className="font-semibold text-text">{row.name}</span>
                  </th>

                  <td className={`${TEXT_CELL} text-text-muted`}>
                    {row.period}
                  </td>

                  {/* Output format — a neutral monospace chip so the short
                      uppercase codes (PDF / XLSX / CSV) read as data tokens. */}
                  <td className={TEXT_CELL}>
                    <span className="inline-flex items-center rounded-badge bg-surface-strong px-2 py-0.5 font-mono text-xs font-medium tracking-wide text-text-muted">
                      {row.format}
                    </span>
                  </td>

                  <td className={TEXT_CELL}>
                    <span
                      className={`inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>

                  {/* Generation date — mono tabular inside a <time>; em dash when
                      the report has not been generated yet. */}
                  <td className={NUMERIC_CELL}>
                    {row.generatedOn ? (
                      <time dateTime={row.generatedOn}>
                        {formatDate(row.generatedOn, DATE_OPTS)}
                      </time>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>

                  {/* File size in KB — grouped via the shared quantity formatter;
                      em dash when not yet available. */}
                  <td className={NUMERIC_CELL}>
                    {row.sizeKb !== undefined ? (
                      `${formatQuantity(row.sizeKb)} KB`
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
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
