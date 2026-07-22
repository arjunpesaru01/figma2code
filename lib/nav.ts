// lib/nav.ts
//
// Shared six-section route + label config for the Finebank dashboard.
//
// This module is the SINGLE SOURCE OF TRUTH for the sidebar navigation and the
// account-section route list. `components/Sidebar.tsx` imports `NAV_SECTIONS`
// to render the six section links and derives the active state from the current
// pathname (via `usePathname`). The route slugs below MUST stay in lockstep with
// the `app/**` directory names, the README screen map, and the executive deck's
// architecture diagram (AAP §0.7.5 route/config sync).
//
// Design constraints enforced here:
//   - Self-contained: NO imports of any kind (this file defines its own type).
//   - No icon library: `icon` is a plain string key that the Sidebar maps to an
//     inline SVG. Do NOT introduce `lucide-react`, `react-icons`, or similar.
//   - Order matters: array order is the sidebar display order.
//   - Framework-agnostic plain data + type (safe to import from any component).

/**
 * A single sidebar navigation entry.
 *
 * The shape is intentionally minimal: the Sidebar only needs a destination
 * (`href`), a display string (`label`), and an optional icon hint (`icon`).
 */
export interface NavSection {
  /**
   * Absolute route path. MUST match a corresponding `app/**` directory so that
   * Next.js file-system routing resolves the link and active-state highlighting
   * (path comparison against `usePathname`) works correctly.
   */
  href: string;
  /** Human-readable label rendered in the sidebar. */
  label: string;
  /**
   * Optional icon key. This is a stable, arbitrary identifier that the Sidebar
   * maps to an inline SVG glyph — it is NOT a package import. Keys are kept
   * lowercase and hyphen-free for readability.
   */
  icon?: string;
}

/**
 * Ordered list of the six account sections.
 *
 * This constant is the single source of truth for both routing and the sidebar.
 * The order defines the sidebar display order. The `href` values are the
 * canonical route slugs and MUST remain identical to the `app/**` directory
 * names:
 *   /overview, /holdings, /cash-collateral, /corporate-actions,
 *   /compliance, /reporting
 *
 * The landing route `/` redirects to `/overview` (handled in `app/page.tsx`,
 * not here).
 */
export const NAV_SECTIONS: NavSection[] = [
  { href: "/overview", label: "Overview", icon: "overview" },
  { href: "/holdings", label: "Holdings", icon: "holdings" },
  { href: "/cash-collateral", label: "Cash & Collateral", icon: "cash" },
  { href: "/corporate-actions", label: "Corporate Actions", icon: "actions" },
  { href: "/compliance", label: "Compliance", icon: "compliance" },
  { href: "/reporting", label: "Reporting", icon: "reporting" },
];
