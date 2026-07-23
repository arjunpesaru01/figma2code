// components/AlertsPanel.tsx
//
// AlertsPanel — the alerts / compliance notifications list for the Finebank
// institutional portfolio-oversight dashboard.
//
// ROLE IN THE SYSTEM
// ------------------------------------------------------------------
// A first-party presentational component (README L18: "Alerts/compliance
// notifications panel"). It is deliberately GENERIC so a single component
// serves BOTH screens that need it:
//   • app/overview/page.tsx   — a compact summary (e.g. `maxItems={3}`).
//   • app/compliance/page.tsx — the full list as the screen's primary content.
// The caller decides how many rows to show via `maxItems`; the component never
// owns or fetches data — the `alerts` array flows in as a plain prop sourced
// from `lib/mock-data.ts` (AAP §0.6.5 static-data / in-memory props).
//
// RENDERING MODEL
// ------------------------------------------------------------------
// This is a React SERVER COMPONENT. There is intentionally NO "use client"
// directive: the panel is pure, stateless presentation with no hooks, event
// handlers, or browser-only APIs, so it renders entirely on the server and
// ships zero client JavaScript. (AAP §0.6.5 lists only Sidebar and NavChart as
// client components.)
//
// STYLING CONTRACT (tailwind.config.ts is the single source of truth)
// ------------------------------------------------------------------
// Every color, radius, spacing, and type value resolves to a semantic Tailwind
// token declared in `tailwind.config.ts` or to a standard Tailwind scale
// utility — there are NO hardcoded hex/px values (AAP §0.5.1). Severity styling
// maps onto the confirmed MUTED institutional tokens so the palette reads as
// trustworthy enterprise chrome, never as bright/alarming consumer color
// (README L22-25):
//   • critical → `negative` (muted brick red)
//   • warning  → `warning`  (muted amber)   ← the dedicated `warning` token now
//                                              exists in tailwind.config.ts, so
//                                              per the agent brief we prefer it
//                                              over the earlier `accent` fallback.
//   • info     → `info`     (muted steel blue)
// Crucially, severity is ALSO conveyed as TEXT (an uppercase severity tag), so
// meaning is never encoded by color alone (WCAG — do not rely on color).
//
// NUMBER & DATE FORMATTING
// ------------------------------------------------------------------
// The event timestamp is an ISO 8601 string; it is rendered through
// `formatDate` from `lib/format.ts` (never the raw ISO string). A formatted
// date such as "Jun 28, 2024" is textual and renders in `font-sans`; the only
// genuinely numeric surfaces here (the total-count chip and the truncation
// footer counts) use `font-mono tabular-nums` to honor the monospace-numeric
// convention (README L26, Technical Specification §7.7.2).

import type { ReactNode } from "react";

import type { Alert, AlertSeverity, AlertMessagePart } from "@/lib/types";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
  formatQuantity,
  formatQuarter,
} from "@/lib/format";

/**
 * Props for {@link AlertsPanel}.
 *
 * The panel is intentionally minimal: it takes the data to display plus two
 * optional presentation knobs so the same component can back both the compact
 * Overview summary and the full Compliance surface.
 */
export interface AlertsPanelProps {
  /** Alerts to display (from `lib/mock-data.ts`). Renders an empty state when `[]`. */
  alerts: Alert[];
  /** Optional panel heading. Defaults to `"Alerts & Compliance"`. */
  title?: string;
  /**
   * Optional cap on the number of rows rendered (e.g. Overview shows 3-4).
   * When omitted (`undefined`), every alert is shown. `0` shows none; the value
   * is clamped to a nonnegative integer. When the list is capped, a muted
   * footer indicates how many of the total are visible.
   */
  maxItems?: number;
  /**
   * Optional explicit id for the panel heading, referenced by the section's
   * `aria-labelledby`. Provide a distinct value when more than one panel is
   * rendered on a page (or when a title's slug could collide with another
   * element's id) to guarantee unique ids. Falls back to a title-derived slug.
   */
  id?: string;
}

/**
 * Maps each {@link AlertSeverity} to the background-color token for its small
 * decorative severity dot. Institutional, desaturated hues only.
 */
const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: "bg-negative",
  warning: "bg-warning",
  info: "bg-info",
};

/**
 * Maps each {@link AlertSeverity} to the token classes for its text severity
 * badge — a soft tinted fill (`*-subtle`) plus the matching foreground color.
 * The badge carries the human-readable severity LABEL, so severity is legible
 * without relying on color perception.
 */
const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  critical: "bg-negative-subtle text-negative",
  warning: "bg-warning-subtle text-warning",
  info: "bg-info-subtle text-info",
};

/**
 * Human-readable severity labels shown inside the severity badge. Kept as an
 * explicit map (rather than derived from the union value) so the display text
 * is deterministic and decoupled from the underlying token keys.
 */
const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

/**
 * Derive a stable, valid HTML `id` for the panel heading from its title so the
 * root `<section>` can reference it via `aria-labelledby`. Pure and
 * server-safe (no `useId`), and namespaced to avoid collisions with unrelated
 * page ids. Falls back to a constant suffix if the title has no alphanumerics.
 */
function headingIdFor(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `alerts-panel-${slug || "heading"}`;
}

/**
 * Render an alert body (MJ-12).
 *
 * When the alert supplies structured `messageParts`, each fragment is rendered
 * inline: numeric / date / period parts go through the shared `lib/format`
 * helpers and render in `font-mono tabular-nums`, while plain `text` parts stay
 * as body sans prose (spacing is carried inside the text parts). This keeps
 * embedded figures — percentages, currency amounts, ISO dates, quarters — from
 * bypassing the shared formatters and the monospace-numeric contract. When no
 * parts are present, the plain `message` string is the fallback.
 *
 * @param alert - The alert whose body to render.
 * @returns The rendered message (a fragment list, or the fallback string).
 */
function renderAlertMessage(alert: Alert): ReactNode {
  const parts = alert.messageParts;
  if (!parts || parts.length === 0) {
    return alert.message;
  }
  return parts.map((part: AlertMessagePart, index: number) => {
    const key = `${alert.id}-part-${index}`;
    switch (part.kind) {
      case "text":
        return <span key={key}>{part.text}</span>;
      case "currency":
        return (
          <span key={key} className="font-mono tabular-nums">
            {part.compact
              ? formatCompactCurrency(part.value)
              : formatCurrency(part.value)}
          </span>
        );
      case "percent":
        return (
          <span key={key} className="font-mono tabular-nums">
            {formatPercent(part.value, part.decimals)}
          </span>
        );
      case "quantity":
        return (
          <span key={key} className="font-mono tabular-nums">
            {formatQuantity(part.value, part.decimals)}
          </span>
        );
      case "date":
        return (
          <time key={key} dateTime={part.iso} className="font-mono tabular-nums">
            {formatDate(part.iso, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        );
      case "period":
        return (
          <span key={key} className="font-mono tabular-nums">
            {formatQuarter(part.quarter, part.year)}
          </span>
        );
      default:
        return null;
    }
  });
}

/**
 * Alerts & Compliance notifications panel.
 *
 * Renders a data-dense, divider-separated list of {@link Alert} items inside a
 * bordered surface card. Each row shows a muted severity dot, the alert title,
 * an uppercase severity badge, the message, and a meta line with the category
 * and formatted timestamp. When `alerts` is empty, a muted "No active alerts"
 * message is shown instead of an empty list.
 *
 * @example
 * // Compact summary on the Overview screen:
 * <AlertsPanel alerts={alerts} maxItems={3} />
 *
 * @example
 * // Full list on the Compliance screen:
 * <AlertsPanel alerts={alerts} title="Compliance Notifications" />
 */
export default function AlertsPanel({
  alerts,
  title = "Alerts & Compliance",
  maxItems,
  id,
}: AlertsPanelProps) {
  // MN-01: distinguish `undefined` (no cap → show all) from a numeric cap, and
  // clamp the cap to a nonnegative integer so `maxItems={0}` shows ZERO rows
  // (fixing the old falsy bug that showed all) and a negative value never
  // triggers `slice`'s count-from-the-end behavior. `slice` returns a new
  // array, so `alerts` is never mutated.
  const cap =
    maxItems === undefined ? alerts.length : Math.max(0, Math.floor(maxItems));
  const rows = alerts.slice(0, cap);
  const isEmpty = alerts.length === 0;
  const isTruncated = rows.length < alerts.length;
  // MN-02: prefer an explicit caller-supplied id so multiple panels on a page
  // (or a title whose slug collides with another element) never produce
  // duplicate ids / `aria-labelledby` targets; fall back to the title slug.
  const headingId = id ?? headingIdFor(title);

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-card border border-border bg-surface p-5 shadow-card"
    >
      {/* Panel header: title + a muted total-count chip. */}
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2
          id={headingId}
          className="font-sans text-base font-semibold text-text"
        >
          {title}
        </h2>
        {!isEmpty && (
          <span className="rounded-badge bg-surface-strong px-2 py-0.5 font-mono text-xs tabular-nums text-text-muted">
            {alerts.length}
          </span>
        )}
      </header>

      {isEmpty ? (
        // Empty state — never render an empty <ul> (AAP no-data edge case).
        <p className="py-6 text-center font-sans text-sm text-text-muted">
          No active alerts
        </p>
      ) : rows.length > 0 ? (
        // Render the list ONLY when there is at least one row (MN-01): a caller
        // that passes `maxItems={0}` shows no list (just the header + the
        // "showing 0 of N" footer), never an empty <ul>.
        // role="list" is retained deliberately: Tailwind Preflight sets
        // `list-style: none`, which strips the implicit list role in Safari +
        // VoiceOver. `divide-y` draws institutional hairline row separators.
        <ul
          role="list"
          className="divide-y divide-border border-t border-border"
        >
          {rows.map((alert) => (
            <li key={alert.id} className="flex gap-3 py-3">
              {/* Decorative severity dot — color reinforces (never replaces)
                  the textual severity badge, so it is hidden from AT. */}
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-sans text-sm font-medium text-text">
                    {alert.title}
                  </p>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-badge px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide ${SEVERITY_BADGE[alert.severity]}`}
                  >
                    {SEVERITY_LABEL[alert.severity]}
                  </span>
                </div>
                <p className="mt-0.5 font-sans text-sm leading-snug text-text-muted">
                  {renderAlertMessage(alert)}
                </p>
                <p className="mt-1 font-sans text-xs text-text-muted">
                  <span>{alert.category}</span>
                  <span aria-hidden="true"> · </span>
                  {/* The timestamp is a figure: render it in `font-mono
                      tabular-nums` so dates align on the monospace grid, while
                      the category label stays in the sans face (MJ-13). */}
                  <time
                    dateTime={alert.timestamp}
                    className="font-mono tabular-nums"
                  >
                    {formatDate(alert.timestamp, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {isTruncated && (
        <footer className="mt-3 border-t border-border pt-3 font-sans text-xs text-text-muted">
          Showing{" "}
          <span className="font-mono tabular-nums">{rows.length}</span> of{" "}
          <span className="font-mono tabular-nums">{alerts.length}</span> alerts
        </footer>
      )}
    </section>
  );
}
