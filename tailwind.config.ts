import type { Config } from "tailwindcss";

/**
 * Tailwind CSS configuration — Finebank institutional finance dashboard.
 *
 * SINGLE SOURCE OF TRUTH for the design system.
 * ------------------------------------------------------------------
 * The brief forbids third-party UI libraries (no MUI / Ant Design /
 * Bootstrap / styled-components / CSS-in-JS). Consequently the design
 * system for this project is composed of exactly three things:
 *
 *   1. The Tailwind theme tokens defined in THIS file.
 *   2. The `next/font` faces wired up in `app/layout.tsx`
 *      (exposed as the CSS variables `--font-sans` and `--font-mono`).
 *   3. The first-party React components under `components/`.
 *
 * Every color, radius, shadow, and type value used anywhere in the six
 * screens must resolve to a token declared here (or a standard Tailwind
 * scale utility). There are NO one-off hex values scattered across
 * components — a uniform visual change made here propagates to every
 * screen automatically.
 *
 * DESIGN DIRECTION (README L22-L26):
 *   Institutional, trustworthy, and data-dense — a muted, professional
 *   palette rather than a bright consumer-fintech aesthetic. The chrome
 *   is a light theme with cool slate/navy neutrals, a single restrained
 *   navy-indigo accent, and desaturated directional (gain/loss) colors.
 *   Numeric figures render in a monospace face with tabular figures so
 *   currency and percentage columns align vertically.
 *
 * TAILWIND MODEL:
 *   Classic Tailwind 3.4 JS/TS `Config` object (NOT the v4 CSS-first
 *   model). Tokens are added under `theme.extend` so Tailwind's default
 *   scales remain available; we augment them, we do not replace them.
 *
 * TOKEN PROVENANCE (RECONCILED — authoritative institutional design system):
 *   These semantic tokens ARE the project's institutional design system —
 *   they are the committed, authoritative values, not placeholders (AAP
 *   §0.5.3). Each role is derived to satisfy the muted-institutional mandate
 *   above: a light, cool slate/navy neutral ramp for `background`/`surface`/
 *   `border`/`text`; a single restrained navy-indigo `accent`; and a
 *   desaturated `positive`/`negative` pair for directional (gain/loss)
 *   figures.
 *
 *   The Figma "Finebank" frames are the per-screen visual reference, but their
 *   contents are NOT programmatically extractable in this environment
 *   (no authenticated Figma API access — AAP §0.10.2). This token set is
 *   therefore the reconciled, finalized single source of truth for the
 *   institutional palette/type/spacing across all implemented screens; it is
 *   not re-derived per component and no component defines colors independently
 *   (AAP §0.5.3, §0.7.5). Where an objective quality bar applies, every
 *   text/graphical foreground role has been verified to clear WCAG 2.1 AA
 *   contrast on the surfaces it renders against (see the per-role notes in
 *   `colors` below). Because the roles are semantic, tuning any value here
 *   propagates uniformly to every consuming component with no per-component
 *   edits.
 */
const config: Config = {
  /**
   * Content globs — Tailwind scans these files for class names and
   * tree-shakes everything unused. These MUST cover the entire app
   * surface; a missing path silently purges real styles and breaks the
   * UI at build time. The project is TypeScript-only, so `.ts`/`.tsx`
   * fully covers `app/`, `components/`, and any class strings in `lib/`.
   */
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      /**
       * SEMANTIC COLOR ROLES.
       *
       * Components reference roles (`bg-surface`, `text-text-muted`,
       * `text-positive`, `border-border`, `bg-accent` …) — never raw
       * hex. Each role exposes a `DEFAULT` plus a small set of variants
       * so common surfaces (subtle fills, strong dividers, soft status
       * tints) also resolve to tokens instead of arbitrary values.
       *
       * All hues are deliberately desaturated for an institutional tone;
       * none are neon / bright-SaaS.
       */
      colors: {
        // App canvas — a cool, muted light gray (softer than pure white
        // so white cards read as elevated surfaces against it).
        background: "#f2f4f8",

        // Card / panel fills.
        surface: {
          DEFAULT: "#ffffff", // primary card / panel
          subtle: "#f8fafc", // alternating rows, muted panels
          strong: "#eef1f6", // inset wells, table headers
        },

        // Dividers / strokes / hairlines.
        border: {
          DEFAULT: "#e3e8ef", // standard divider
          subtle: "#eef1f6", // faint separators inside dense tables
          strong: "#cdd5e0", // emphasized / structural dividers
        },

        // Text roles. `text-text` is primary; `text-text-muted` secondary.
        // Every text role is tuned to clear WCAG 2.1 AA (>=4.5:1 for normal
        // text) on the surfaces it is used against — `surface` (#ffffff),
        // `background` (#f2f4f8), and `surface-strong` (#eef1f6):
        //   DEFAULT 15.6:1, muted 5.8:1, subtle 5.2:1 (white) — all pass.
        text: {
          DEFAULT: "#1c2634", // primary — deep slate / navy
          muted: "#5b6676", // secondary — labels, captions (5.82:1 on white)
          // tertiary — eyebrows, meta, muted graphical icons. Darkened from the
          // previous #8792a3 (3.15:1 white / 2.86:1 bg — WCAG AA FAIL) to a
          // still-muted slate that clears 4.5:1 on white (5.17:1), the app
          // background (4.70:1), and surface-strong (4.57:1) while remaining a
          // clear tertiary step below `muted` (UI-01).
          subtle: "#646e7b",
          inverted: "#f8fafc", // text on dark / accent surfaces
        },

        // Directional value colors (gains / losses). Desaturated,
        // institutional — used by KpiCard (P&L) and HoldingsTable (+/-).
        positive: {
          DEFAULT: "#15774a", // muted pine green
          strong: "#0f5c39", // emphasized gain
          subtle: "#e6f2ec", // soft tint for badges / row highlights
        },
        negative: {
          DEFAULT: "#b23b3b", // muted brick red
          strong: "#8f2d2d", // emphasized loss
          subtle: "#f6e9e9", // soft tint for badges / row highlights
        },

        // Restrained emphasis — active nav item, links, focus, primary
        // interactive affordances. A single trustworthy navy-indigo.
        accent: {
          DEFAULT: "#3a4d8f",
          strong: "#2c3c72", // hover / pressed
          subtle: "#eaeef7", // active-nav background, soft chips
          foreground: "#ffffff", // text/icon on an accent fill
        },

        // Muted status hues for the alerts / compliance surface. The `DEFAULT`
        // is used as foreground on its own `subtle` tint in the AlertsPanel
        // severity badge, so it must clear WCAG AA against that pairing.
        warning: {
          // Darkened from the previous #9a6a1b (4.13:1 on `warning-subtle` —
          // WCAG AA FAIL for the 11px badge text) to a deeper muted amber that
          // clears 4.5:1 on `warning-subtle` (4.97:1) as well as on white
          // (5.68:1) and the app background (5.16:1) (UI-01).
          DEFAULT: "#8a5e17", // muted amber
          subtle: "#f6efe2",
        },
        info: {
          DEFAULT: "#2f6690", // muted steel blue
          subtle: "#e7eff5",
        },
      },

      /**
       * TYPOGRAPHY.
       *
       * `sans` and `mono` reference the `next/font` CSS variables that
       * `app/layout.tsx` sets on the document. These variable names
       * (`--font-sans`, `--font-mono`) MUST stay in lockstep with the
       * layout. System fallbacks keep text legible before the fonts
       * hydrate and if a variable is ever unset.
       *
       * The `mono` face is what backs the monospace-numeric requirement:
       * numeric cells use `font-mono tabular-nums` for column alignment.
       */
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },

      /**
       * Type scale addition — a compact size for dense table metadata
       * (secondary labels, units, footnotes) below Tailwind's `text-xs`.
       */
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }], // 11px / 14px
      },

      /**
       * Modest, institutional corner radii. Data-dense finance UIs use
       * restrained rounding; these extend (do not replace) the defaults.
       */
      borderRadius: {
        badge: "0.375rem", // pills, tags, small chips
        card: "0.625rem", // KPI cards, panels
        panel: "0.75rem", // larger containers / chart wells
      },

      /**
       * Subtle elevation. Institutional surfaces sit close to the canvas;
       * shadows are soft and low-contrast rather than dramatic.
       */
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        raised:
          "0 4px 12px -2px rgb(16 24 40 / 0.08), 0 2px 6px -2px rgb(16 24 40 / 0.05)",
        dropdown: "0 12px 24px -6px rgb(16 24 40 / 0.12)",
        focus: "0 0 0 3px rgb(58 77 143 / 0.35)", // accent focus ring
      },

      /**
       * Spacing additions. `4.5` fills a gap in the default scale for
       * data-dense padding; `sidebar` and `topbar` are shell-layout
       * tokens so the chrome dimensions resolve to named values
       * (e.g. `w-sidebar`, `h-topbar`) instead of magic numbers.
       */
      spacing: {
        "4.5": "1.125rem", // 18px
        sidebar: "16rem", // 256px — persistent left navigation width
        topbar: "4.5rem", // 72px — shared top bar height
        scrollbar: "0.625rem", // 10px — thin institutional custom-scrollbar track/thumb
      },
    },
  },

  // No Tailwind plugins — the dependency surface is kept minimal and the
  // design system is entirely first-party (AAP §0.3.2).
  plugins: [],
};

export default config;
