/**
 * PostCSS configuration for the Finebank institutional dashboard.
 *
 * Wires the two-stage CSS build pipeline that Tailwind CSS 3.4 requires so the
 * `@tailwind base; @tailwind components; @tailwind utilities;` directives in
 * `app/globals.css` are expanded and vendor-prefixed during `next build`
 * (and `next dev`). Next.js 14 auto-detects this file and runs it against every
 * stylesheet it processes — no additional wiring is needed.
 *
 * Pipeline (order is significant — plugins run top-to-bottom):
 *   1. tailwindcss  — expands the @tailwind directives, generates utility
 *                     classes from `tailwind.config.ts`, and applies the
 *                     preflight base reset.
 *   2. autoprefixer — adds vendor prefixes to the emitted CSS based on the
 *                     project's Browserslist targets.
 *
 * IMPORTANT — Tailwind 3.4 plugin form:
 *   This project deliberately uses the Tailwind CSS v3.4 line, so `tailwindcss`
 *   is referenced directly as a PostCSS plugin (the v3 form). Do NOT switch to
 *   the separate Tailwind v4 first-party PostCSS plugin package — v4 is not
 *   adopted here and its CSS-first config model diverges from the
 *   `tailwind.config.ts` token layer this application relies on.
 *
 * CommonJS `module.exports` is used intentionally: it is the create-next-app@14
 * default for this file and is the format PostCSS's config loader expects.
 *
 * @see https://tailwindcss.com/docs/installation/using-postcss
 * @type {import('postcss-load-config').Config}
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
