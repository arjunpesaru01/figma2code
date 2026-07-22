import type { Config } from "tailwindcss";

/**
 * Baseline Tailwind configuration for the Finebank institutional dashboard.
 *
 * NOTE (setup scaffold): The `content` globs and the `next/font` CSS-variable
 * font tokens below are the minimum required for a compilable, token-driven
 * build. The full institutional palette, spacing scale, radius, and elevation
 * tokens are extracted from the Figma frames by downstream implementation and
 * added under `theme.extend`.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
