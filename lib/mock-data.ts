// Static, in-memory dataset for the Finebank institutional portfolio-oversight
// dashboard. This module is the ONE AND ONLY data source in the application.
//
// Design rules enforced here (see README.md and lib/types.ts):
//   - STATIC HARDCODED CONSTANTS ONLY. There is no backend, database, or external
//     API in this phase — no fetch(), no async/await, no data-access layer, and no
//     network or persistence import of any kind. Pages import these typed constants
//     directly and pass them to components as plain in-memory props.
//   - Every exported constant is explicitly annotated against the view-model
//     interfaces from lib/types.ts, so `tsc --noEmit` (strict) verifies that each
//     record has exactly the right fields and types.
//   - Percentages are in PERCENT UNITS (e.g. 13.6 means 13.6%); monetary amounts are
//     plain numbers in the account's base currency (USD); dates and timestamps are
//     ISO 8601 strings — all consistent with the conventions declared in lib/types.ts.
//   - Values model a realistic institutional multi-asset composite (muted and
//     professional), not toy numbers.
//
// Internal consistency guarantees (relied upon by the Overview and Holdings screens):
//   - navSeries[navSeries.length - 1].value === account.aum (chart endpoint reconciles
//     with the headline AUM KPI).
//   - For every holding, marketValue === quantity * price (exact).
//   - account.ytdReturnPercent (13.6) reconciles with the NAV series: growth from the
//     2023-12-31 year-start base (412,150,000) to the 2024-06-30 value (468,200,000)
//     is +13.60%.
//
// The only import is the type-only import below. Because lib/types.ts contains no
// runtime code, `import type` guarantees the import is fully erased at compile time.
import type {
  AccountPortfolio,
  Alert,
  Holding,
  NavPoint,
  OverviewProps,
  HoldingsProps,
} from "./types";

/**
 * Account-level KPI summary backing the Overview screen's KPI cards.
 *
 * Anchor figures required by the brief:
 *   - `aum` = 468,200,000 renders as "$468.2M" (headline AUM).
 *   - `ytdReturnPercent` = 13.6 renders as "13.6%" (year-to-date return).
 *
 * `dailyPnl` (+$6.32M) is internally consistent with `dailyPnlPercent` (+1.37%):
 * a +1.37% move on the prior-close base implies a gain of ~$6.33M.
 */
export const account: AccountPortfolio = {
  accountId: "ACC-100482",
  accountName: "Global Multi-Asset Composite",
  asOf: "2024-06-28",
  currency: "USD",
  aum: 468_200_000, // => "$468.2M" via the compact currency formatter
  dailyPnl: 6_320_000, // signed daily P&L in USD (+$6.3M)
  dailyPnlPercent: 1.37, // signed daily P&L as a percentage
  ytdReturnPercent: 13.6, // => "13.6%" year-to-date return
  riskLevel: "Moderate",
  varPercent: 2.1, // 1-day 95% Value-at-Risk, expressed as a percentage
};

/**
 * Top holdings of the diversified institutional composite (data-dense table rows).
 *
 * Invariants maintained for every row:
 *   - `marketValue` === `quantity * price` (exact — verified in validation).
 *   - `weight` === round(marketValue / account.aum * 100, 1), a percentage of the
 *     whole portfolio. The top 8 positions shown here sum to ~57% of AUM; the
 *     remaining ~43% sits in smaller positions not enumerated in this table.
 *   - `dayChangeValue` is the signed dollar change reconciling with
 *     `dayChangePercent` (the move from the prior close).
 *
 * The set intentionally mixes asset classes (Equity, Fixed Income, Commodity, Cash)
 * and both positive and negative day changes — plus a zero-change Cash line — so the
 * downstream table exercises its directional (+/-) styling across all cases.
 */
export const holdings: Holding[] = [
  {
    id: "h1",
    symbol: "AAPL",
    name: "Apple Inc.",
    assetClass: "Equity",
    quantity: 210_000,
    price: 214.29,
    marketValue: 45_000_900, // 210_000 * 214.29
    weight: 9.6,
    dayChangePercent: 0.82,
    dayChangeValue: 366_006,
  },
  {
    id: "h2",
    symbol: "MSFT",
    name: "Microsoft Corp.",
    assetClass: "Equity",
    quantity: 92_000,
    price: 447.5,
    marketValue: 41_170_000, // 92_000 * 447.50
    weight: 8.8,
    dayChangePercent: 0.54,
    dayChangeValue: 221_124,
  },
  {
    id: "h3",
    symbol: "UST 4.25% 2034",
    name: "U.S. Treasury Note 4.25% 2034",
    assetClass: "Fixed Income",
    quantity: 400_000,
    price: 98.75,
    marketValue: 39_500_000, // 400_000 * 98.75
    weight: 8.4,
    dayChangePercent: -0.12,
    dayChangeValue: -47_457,
  },
  {
    id: "h4",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    assetClass: "Equity",
    quantity: 300_000,
    price: 123.54,
    marketValue: 37_062_000, // 300_000 * 123.54
    weight: 7.9,
    dayChangePercent: -1.45,
    dayChangeValue: -545_306,
  },
  {
    id: "h5",
    symbol: "AGG",
    name: "iShares Core U.S. Aggregate Bond ETF",
    assetClass: "Fixed Income",
    quantity: 330_000,
    price: 98.2,
    marketValue: 32_406_000, // 330_000 * 98.20
    weight: 6.9,
    dayChangePercent: -0.08,
    dayChangeValue: -25_946,
  },
  {
    id: "h6",
    symbol: "BRK.B",
    name: "Berkshire Hathaway Inc. Class B",
    assetClass: "Equity",
    quantity: 70_000,
    price: 408.6,
    marketValue: 28_602_000, // 70_000 * 408.60
    weight: 6.1,
    dayChangePercent: 0.33,
    dayChangeValue: 94_076,
  },
  {
    id: "h7",
    symbol: "GLD",
    name: "SPDR Gold Shares",
    assetClass: "Commodity",
    quantity: 120_000,
    price: 218.75,
    marketValue: 26_250_000, // 120_000 * 218.75
    weight: 5.6,
    dayChangePercent: 0.47,
    dayChangeValue: 122_798,
  },
  {
    id: "h8",
    symbol: "USD",
    name: "U.S. Dollar Cash",
    assetClass: "Cash",
    quantity: 18_500_000,
    price: 1,
    marketValue: 18_500_000, // 18_500_000 * 1
    weight: 4.0,
    dayChangePercent: 0.0,
    dayChangeValue: 0,
  },
];

/**
 * NAV / performance time series consumed by the Recharts chart on the Overview screen.
 *
 * Twelve month-end points spanning 2023-07-31 through 2024-06-30. The path shows an
 * overall uptrend with two realistic drawdowns — a late-2023 pullback (Aug–Oct) and a
 * shallower April-2024 dip — before recovering to new highs.
 *
 * Reconciliation:
 *   - The FINAL point (2024-06-30) equals `account.aum` (468,200,000), so the chart
 *     endpoint matches the headline AUM KPI.
 *   - Growth from the 2023-12-31 year-start base (412,150,000) to the final value is
 *     +13.60%, matching `account.ytdReturnPercent`.
 */
export const navSeries: NavPoint[] = [
  { date: "2023-07-31", value: 412_400_000 },
  { date: "2023-08-31", value: 405_800_000 },
  { date: "2023-09-30", value: 398_200_000 },
  { date: "2023-10-31", value: 394_600_000 },
  { date: "2023-11-30", value: 404_300_000 },
  { date: "2023-12-31", value: 412_150_000 }, // year-start base for the YTD figure
  { date: "2024-01-31", value: 420_900_000 },
  { date: "2024-02-29", value: 429_700_000 }, // 2024 is a leap year
  { date: "2024-03-31", value: 440_500_000 },
  { date: "2024-04-30", value: 434_200_000 },
  { date: "2024-05-31", value: 453_600_000 },
  { date: "2024-06-30", value: 468_200_000 }, // === account.aum
];

/**
 * Alerts / compliance notifications backing the alerts panel and the Compliance screen.
 *
 * Exactly four notifications spanning every severity (`critical`, `warning`, `info`)
 * and drawing categories from the dashboard's account sections. Wording is muted and
 * professional, in keeping with the institutional tone.
 */
export const alerts: Alert[] = [
  {
    id: "a1",
    severity: "critical",
    title: "Concentration limit breach",
    message:
      "Equity allocation exceeds the 60% policy ceiling for this mandate. Rebalance before the next compliance review.",
    timestamp: "2024-06-28T13:42:00Z",
    category: "Compliance",
  },
  {
    id: "a2",
    severity: "warning",
    title: "Upcoming dividend ex-date",
    message:
      "AAPL trades ex-dividend on 2024-07-05. Confirm entitlement and position booking ahead of the record date.",
    timestamp: "2024-06-27T09:15:00Z",
    category: "Corporate Actions",
  },
  {
    id: "a3",
    severity: "warning",
    title: "Collateral shortfall risk",
    message:
      "Projected variation-margin calls may exceed the available USD cash buffer within five business days.",
    timestamp: "2024-06-26T16:20:00Z",
    category: "Cash & Collateral",
  },
  {
    id: "a4",
    severity: "info",
    title: "Quarterly report available",
    message:
      "The Q2 2024 performance and attribution report is ready for review and distribution.",
    timestamp: "2024-06-25T11:00:00Z",
    category: "Reporting",
  },
];

/**
 * Convenience bundle matching the composite props of the Overview screen.
 *
 * `app/overview/page.tsx` can import this single constant and distribute its members
 * to `KpiCard` (`account`), `NavChart` (`navSeries`), and `AlertsPanel` (`alerts`).
 */
export const overviewData: OverviewProps = {
  account,
  navSeries,
  alerts,
};

/**
 * Convenience bundle matching the composite props of the Holdings screen.
 *
 * `app/holdings/page.tsx` can import this single constant (or the granular `holdings`
 * array) and pass `holdings` to `HoldingsTable`.
 */
export const holdingsData: HoldingsProps = {
  holdings,
};
