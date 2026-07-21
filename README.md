This is a greenfield project — there is no existing codebase yet.

Purpose: An institutional finance/banking admin dashboard for portfolio
oversight, styled for enterprise clients in asset management, custody,
and insurance (comparable to State Street, Bank of America, Liberty
Mutual use cases).

Intended tech stack:
- Next.js 14 (App Router), TypeScript
- Tailwind CSS for styling
- Recharts for data visualization (NAV/performance charts)
- Deployed on Vercel

Key workflows the UI should support:
- Portfolio/account overview with KPI summary (AUM, daily P&L, risk metrics)
- Holdings table with weight, market value, and change
- Performance chart (NAV over time)
- Alerts/compliance notifications panel
- Sidebar navigation across account sections (Overview, Holdings,
  Cash & Collateral, Corporate Actions, Compliance, Reporting)

Quirks / preferences:
- Design should feel institutional and trustworthy, not like a generic
  consumer fintech app — precise typography, data-dense tables, muted
  professional color palette rather than bright SaaS colors
- Numbers/figures should use a monospace font for tabular alignment
- Source of design: a Figma finance dashboard template (BankDash-style
  layout), attached separately in the Build prompt step
