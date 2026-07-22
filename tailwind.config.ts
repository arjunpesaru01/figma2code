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
 * FIGMA FIDELITY:
 *   The authoritative source for the exact hex/spacing values is the
 *   Figma "Finebank" template. The palette below is a coherent, muted
 *   institutional baseline; individual values are refined to match the
 *   frames during per-screen implementation. Because these are semantic
 *   tokens, refining a value here updates every consuming component
 *   without any component-level edits.
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
        text: {
          DEFAULT: "#1c2634", // primary — deep slate / navy
          muted: "#5b6676", // secondary — labels, captions
          subtle: "#8792a3", // tertiary — placeholders, disabled
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

        // Muted status hues for the alerts / compliance surface.
        warning: {
          DEFAULT: "#9a6a1b", // muted amber
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
      },
    },
  },

  // No Tailwind plugins — the dependency surface is kept minimal and the
  // design system is entirely first-party (AAP §0.3.2).
  plugins: [],
};

export default config;
