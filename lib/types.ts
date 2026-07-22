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
 * A single structural fragment of an alert message.
 *
 * An alert body often mixes prose with embedded FIGURES — a percentage, a
 * currency amount, a calendar date, a quarter/period. Storing those figures as
 * raw literals inside a plain `message` string forces them to render as body
 * (sans) prose, bypassing the shared formatters and the monospace-numeric
 * requirement. Modeling the message as an ordered list of typed parts lets the
 * `AlertsPanel` route every numeric/date/period fragment through `lib/format`
 * and render it in `font-mono tabular-nums`, while plain `text` parts stay as
 * sans prose (MJ-12). The union is discriminated by `kind`.
 */
export type AlertMessagePart =
  /** Plain prose (rendered in the body sans face). Include surrounding spaces. */
  | { kind: "text"; text: string }
  /** A monetary amount rendered via `formatCurrency` / `formatCompactCurrency`. */
  | { kind: "currency"; value: number; compact?: boolean }
  /** A percentage (in percent units) rendered via `formatPercent`. */
  | { kind: "percent"; value: number; decimals?: number }
  /** A bare count/quantity rendered via `formatQuantity`. */
  | { kind: "quantity"; value: number; decimals?: number }
  /** An ISO 8601 date rendered via `formatDate`. */
  | { kind: "date"; iso: string }
  /** A calendar quarter + year rendered via `formatQuarter`, e.g. "Q2 2024". */
  | { kind: "period"; quarter: number; year: number };

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
  /** Descriptive alert body text (plain-text fallback / accessible source). */
  message: string;
  /**
   * Optional structured message parts. When present, the panel renders these
   * ordered fragments — routing numeric/date/period parts through the shared
   * formatters in `font-mono tabular-nums` — instead of the plain `message`
   * (which remains the fallback when parts are absent). See {@link AlertMessagePart}.
   */
  messageParts?: AlertMessagePart[];
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

/* -------------------------------------------------------------------------- */
/* Cash & Collateral screen                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A cash balance held in a single currency (one row of the cash-balances table
 * on the Cash & Collateral screen). `balance` is the amount in `currency`;
 * `balanceBase` is that amount converted to the account's base currency (USD)
 * so the column totals reconcile with the summary KPIs.
 */
export interface CashBalance {
  /** Stable unique identifier for the row. */
  id: string;
  /** Holding currency (ISO 4217), e.g. "USD", "EUR". */
  currency: string;
  /** Account bucket, e.g. "Settlement", "Margin", "Custody". */
  accountType: string;
  /** Balance in the row's own `currency`. */
  balance: number;
  /** Balance converted to the account base currency (USD). */
  balanceBase: number;
  /** Unencumbered / available portion as a percentage (0–100). */
  availablePercent: number;
}

/**
 * A pledged or received collateral position (one row of the collateral table).
 * `direction` distinguishes collateral the account has POSTED (`"pledged"`)
 * from collateral it HOLDS (`"received"`); `postedValue` is `marketValue` net
 * of `haircutPercent`.
 */
export interface CollateralPosition {
  /** Stable unique identifier for the row. */
  id: string;
  /** Counterparty name, e.g. "JPMorgan". */
  counterparty: string;
  /** Collateral instrument description, e.g. "US Treasury 4.25% 2034". */
  instrument: string;
  /** Whether the account posted (`"pledged"`) or holds (`"received"`) it. */
  direction: "pledged" | "received";
  /** Gross market value in base currency. */
  marketValue: number;
  /** Haircut applied as a percentage (0–100). */
  haircutPercent: number;
  /** Value after haircut in base currency (`marketValue * (1 - haircut/100)`). */
  postedValue: number;
}

/**
 * Headline KPIs for the Cash & Collateral screen. All monetary figures are in
 * the account base currency (USD); `collateralCoveragePercent` is posted
 * collateral as a percentage of the margin requirement (< 100 ⇒ shortfall).
 */
export interface CashCollateralSummary {
  /** Total cash across all currencies, in base currency. */
  totalCashBase: number;
  /** Unencumbered/available cash, in base currency. */
  availableCashBase: number;
  /** Total collateral posted (pledged), in base currency. */
  collateralPledgedBase: number;
  /** Total collateral held (received), in base currency. */
  collateralReceivedBase: number;
  /** Current margin requirement, in base currency. */
  marginRequirementBase: number;
  /** Posted collateral ÷ margin requirement, as a percentage. */
  collateralCoveragePercent: number;
}

/**
 * Composite data for the Cash & Collateral screen: the summary KPIs plus the
 * cash-balances and collateral tables.
 */
export interface CashCollateralData {
  /** Headline KPI summary. */
  summary: CashCollateralSummary;
  /** Cash balances by currency/account. */
  cashBalances: CashBalance[];
  /** Pledged and received collateral positions. */
  collateral: CollateralPosition[];
}

/* -------------------------------------------------------------------------- */
/* Corporate Actions screen                                                   */
/* -------------------------------------------------------------------------- */

/** The kind of corporate-action event. */
export type CorporateActionType =
  | "dividend"
  | "split"
  | "merger"
  | "rights"
  | "tender"
  | "vote";

/** Processing status of a corporate-action event. */
export type CorporateActionStatus =
  | "pending"
  | "confirmed"
  | "elected"
  | "processed";

/**
 * A single corporate-action event (one row of the events table on the
 * Corporate Actions screen). `electionDeadline` is present only for elective
 * events that require an instruction.
 */
export interface CorporateAction {
  /** Stable unique identifier for the event. */
  id: string;
  /** Affected security ticker/symbol, e.g. "AAPL". */
  security: string;
  /** Full security/issuer name. */
  securityName: string;
  /** Event type. */
  type: CorporateActionType;
  /** Short human description, e.g. "Quarterly cash dividend $0.25/share". */
  description: string;
  /** Ex-date (ISO 8601 date string). */
  exDate: string;
  /** Pay/effective date (ISO 8601 date string). */
  payDate: string;
  /** Processing status. */
  status: CorporateActionStatus;
  /** Election deadline (ISO 8601 date string) for elective events, if any. */
  electionDeadline?: string;
}

/**
 * Headline KPIs for the Corporate Actions screen (event counts).
 */
export interface CorporateActionsSummary {
  /** Number of events still pending. */
  pendingCount: number;
  /** Number of elective events awaiting an instruction. */
  electionsRequiredCount: number;
  /** Number of events with an ex-date/deadline within the next 30 days. */
  next30DaysCount: number;
  /** Total number of tracked events. */
  totalCount: number;
}

/**
 * Composite data for the Corporate Actions screen: the summary KPIs plus the
 * events table.
 */
export interface CorporateActionsData {
  /** Headline KPI summary. */
  summary: CorporateActionsSummary;
  /** Corporate-action events. */
  events: CorporateAction[];
}

/* -------------------------------------------------------------------------- */
/* Reporting screen                                                           */
/* -------------------------------------------------------------------------- */

/** Availability/processing status of a report. */
export type ReportStatus = "available" | "generating" | "scheduled" | "archived";

/** Output format of a generated report. */
export type ReportFormat = "PDF" | "XLSX" | "CSV";

/**
 * A single report in the reporting inventory (one row of the reports table on
 * the Reporting screen). `generatedOn` and `sizeKb` are present only once a
 * report is `"available"` or `"archived"`.
 */
export interface ReportItem {
  /** Stable unique identifier for the report. */
  id: string;
  /** Report name, e.g. "Performance & Attribution". */
  name: string;
  /** Reporting period label, e.g. "Q2 2024" or "Jun 2024". */
  period: string;
  /** Output format. */
  format: ReportFormat;
  /** Availability/processing status. */
  status: ReportStatus;
  /** Generation date (ISO 8601 date string) when available/archived. */
  generatedOn?: string;
  /** File size in kilobytes when available/archived. */
  sizeKb?: number;
}

/**
 * Headline KPIs for the Reporting screen (report counts by status).
 */
export interface ReportingSummary {
  /** Number of reports ready to download. */
  availableCount: number;
  /** Number of reports scheduled to run. */
  scheduledCount: number;
  /** Number of reports currently generating. */
  generatingCount: number;
  /** Total number of tracked reports. */
  totalCount: number;
}

/**
 * Composite data for the Reporting screen: the summary KPIs plus the report
 * inventory table.
 */
export interface ReportingData {
  /** Headline KPI summary. */
  summary: ReportingSummary;
  /** Report inventory rows. */
  reports: ReportItem[];
}
