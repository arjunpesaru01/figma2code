// View-model interfaces (source of truth for all typed props). No runtime code.
//
// This module is the FOUNDATIONAL base of the dependency graph for the Finebank
// institutional portfolio-oversight dashboard. Every page under `app/**` and every
// component under `components/**` imports its interfaces via the `@/lib/*` path alias
// (e.g. `import type { Holding } from "@/lib/types";`).
//
// Conventions enforced across every view model below:
//   - Percentages are expressed in PERCENT UNITS, not 0-1 fractions
//     (e.g. `13.6` means 13.6%). `lib/format.ts` and `lib/mock-data.ts` rely on this.
//   - Monetary amounts are plain numbers in the account's base currency
//     (see `AccountPortfolio.currency`).
//   - Dates and timestamps are ISO 8601 STRINGS (never `Date` objects) so that the
//     static data serializes cleanly and React Server Components can pass them as
//     plain props without hydration mismatches.
//   - Signed values (P&L, day change) use the numeric sign to encode direction;
//     `TrendDirection` labels that direction for directional (+/-) styling.
//
// This file contains ONLY type declarations — no imports, no runtime values.

/** Directional trend for signed values (P&L, holdings change). */
export type TrendDirection = "up" | "down" | "flat";

/** Severity levels for alerts / compliance notifications. */
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Account-level KPI summary shown on the Overview screen.
 *
 * Backs the KPI cards (AUM, daily P&L, YTD return, risk) at the top of the
 * Overview route. All monetary figures are in the account's base `currency`.
 */
export interface AccountPortfolio {
  /** Stable unique identifier for the account. */
  accountId: string;
  /** Human-readable account / mandate name shown in the header. */
  accountName: string;
  /** As-of date (ISO 8601 date string, e.g. "2024-06-28"). */
  asOf: string;
  /** Reporting currency (ISO 4217), e.g. "USD". */
  currency: string;
  /** Assets under management in base currency, e.g. 468_200_000. */
  aum: number;
  /** Daily profit & loss in base currency (signed). */
  dailyPnl: number;
  /** Daily P&L as a percentage (signed), e.g. 1.37. */
  dailyPnlPercent: number;
  /** Year-to-date return percentage (signed), e.g. 13.6. */
  ytdReturnPercent: number;
  /** Qualitative risk classification, e.g. "Moderate". */
  riskLevel: string;
  /** Numeric risk metric (e.g. 1-day 95% VaR as a percentage). */
  varPercent: number;
}

/**
 * A single portfolio holding row for the data-dense table.
 *
 * Backs each row of the Holdings table. Numeric fields render in a monospace,
 * tabular-figures cell for vertical column alignment; `dayChangePercent` /
 * `dayChangeValue` drive the directional (+/-) styling.
 */
export interface Holding {
  /** Stable unique identifier for the holding row. */
  id: string;
  /** Ticker / instrument symbol, e.g. "AAPL". */
  symbol: string;
  /** Full instrument or issuer name. */
  name: string;
  /** Asset-class grouping, e.g. "Equity", "Fixed Income". */
  assetClass: string;
  /** Number of units / shares held. */
  quantity: number;
  /** Price per unit in base currency. */
  price: number;
  /** Market value in base currency. */
  marketValue: number;
  /** Portfolio weight as a percentage (0-100). */
  weight: number;
  /** Day change as a percentage (signed). */
  dayChangePercent: number;
  /** Day change in base currency (signed). */
  dayChangeValue: number;
}

/** A single NAV / performance time-series point consumed by the Recharts chart. */
export interface NavPoint {
  /** Point date (ISO 8601 date string, e.g. "2024-01-31"). */
  date: string;
  /** NAV value at the given date. */
  value: number;
}

/**
 * An alert / compliance notification.
 *
 * Backs the alerts/compliance panel; `severity` maps to a muted severity style
 * and `category` labels the originating section.
 */
export interface Alert {
  /** Stable unique identifier for the alert. */
  id: string;
  /** Severity level driving the muted severity styling. */
  severity: AlertSeverity;
  /** Short alert headline. */
  title: string;
  /** Descriptive alert body text. */
  message: string;
  /** Event timestamp (ISO 8601 datetime string). */
  timestamp: string;
  /** Originating section/category, e.g. "Compliance", "Reporting". */
  category: string;
}

/**
 * Composite props for the Overview screen.
 *
 * The Overview route distributes these to `KpiCard` (`account`),
 * `NavChart` (`navSeries`), and `AlertsPanel` (`alerts`).
 */
export interface OverviewProps {
  /** Account-level KPI summary. */
  account: AccountPortfolio;
  /** NAV / performance time series for the chart. */
  navSeries: NavPoint[];
  /** Alerts / compliance notifications to display. */
  alerts: Alert[];
}

/**
 * Composite props for the Holdings screen.
 *
 * The Holdings route passes `holdings` to `HoldingsTable`.
 */
export interface HoldingsProps {
  /** Rows rendered in the data-dense holdings table. */
  holdings: Holding[];
}
