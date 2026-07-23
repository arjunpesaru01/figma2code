/**
 * components/FigureText.tsx — Prose-with-figures numeric typography helper.
 * ---------------------------------------------------------------------------
 * A first-party PRESENTATIONAL React component for the "Finebank" institutional
 * portfolio-oversight dashboard (Next.js 14 App Router + TypeScript + Tailwind).
 *
 * PURPOSE (why this exists)
 * The brief requires that EVERY monetary/tabular figure render in the monospace
 * face so currency and percentage columns align on a `tabular-nums` grid
 * (README: "Numbers/figures should use a monospace font for tabular alignment";
 * AAP §0.8.2). Most figures live in dedicated numeric cells that already apply
 * `font-mono tabular-nums`. A few, however, are embedded INSIDE free-text prose
 * that is otherwise sans — e.g. a holding's descriptive name
 * ("U.S. Treasury Note 4.25% 2034"), a collateral instrument
 * ("US Treasury 4.25% 2034"), or a corporate-action description
 * ("Quarterly cash dividend of $0.25 per share", "10-for-1 forward stock
 * split"). Rendering the whole string in one face forces a choice between
 * mono-everything (words look wrong) or sans-everything (the figures escape the
 * monospace grid — the defect flagged as MJ-13). {@link FigureText} resolves
 * this by tokenizing the string and wrapping ONLY the numeric fragments in
 * `font-mono tabular-nums`, leaving the surrounding words in the inherited sans
 * face.
 *
 * RENDERING MODEL — SERVER COMPONENT
 * There is intentionally NO `"use client"` directive. The component is a pure,
 * deterministic function of its `children` string: it holds no state, uses no
 * hooks, and has no event handlers, so it renders entirely on the server (AAP
 * §0.6.5). Given identical input it always produces identical output.
 *
 * DESIGN-SYSTEM ROLE
 * Third-party UI libraries are forbidden (AAP §0.3.2/§0.5); this helper is part
 * of the first-party design system. It emits only semantic inline `<span>`s with
 * Tailwind utility classes that resolve to theme tokens — ZERO hardcoded values.
 *
 * TOKENIZER CONTRACT
 * A "numeric fragment" is a maximal run that begins with an optional `$` then a
 * digit, and may contain thousands separators, a decimal part, a trailing `%`,
 * and a simple ratio tail (`-for-N` or `:N`). This matches every figure form
 * present in the static mock data:
 *   "$1,234,567" · "4.25%" · "$0.25" · "2034" · "10-for-1" · "3:2"
 * A leading minus is deliberately NOT consumed, so a stray hyphen in prose is
 * never mistaken for a sign; the in-prose fields carry no negative figures
 * (signed deltas live in dedicated numeric cells). Non-numeric words (including
 * dotted abbreviations like "U.S.") contain no digit and are left as sans text.
 */

import { Fragment, type ReactNode } from "react";

/**
 * Default Tailwind classes applied to each numeric fragment. Resolves to the
 * `next/font` monospace face (`fontFamily.mono` in `tailwind.config.ts`) plus
 * tabular (fixed-width) figures, exactly matching the dedicated numeric cells
 * elsewhere in the app so an in-prose figure sits on the same grid.
 */
const DEFAULT_FIGURE_CLASS = "font-mono tabular-nums" as const;

/**
 * Matches one numeric fragment (see the TOKENIZER CONTRACT above). Built fresh
 * per call (not shared at module scope) so the stateful `lastIndex` of a global
 * regex can never leak between renders.
 *
 * Breakdown:
 *   \$?                     optional leading currency symbol
 *   \d(?:[\d,]*\d)?         one or more digits with optional interior thousands
 *                           separators; the run must END on a digit (so a
 *                           trailing comma in prose is not swallowed)
 *   (?:\.\d+)?              optional decimal part
 *   (?:-for-\d+|:\d+)?      optional ratio tail, e.g. "-for-1" or ":2"
 *   %?                      optional trailing percent sign
 */
function createNumericTokenRegex(): RegExp {
  return /\$?\d(?:[\d,]*\d)?(?:\.\d+)?(?:-for-\d+|:\d+)?%?/g;
}

/**
 * Public props for {@link FigureText}.
 */
export interface FigureTextProps {
  /**
   * The prose string to render. Numeric fragments within it are wrapped in the
   * monospace figure face; the remaining words are left untouched so they
   * inherit the surrounding sans typography.
   */
  children: string;
  /**
   * Optional class(es) for the OUTER wrapper `<span>` — typically the classes
   * the replaced element used to carry (e.g. `"block text-xs text-text-muted"`),
   * so swapping a plain `<span>` for `<FigureText>` is visually transparent
   * apart from the numeric fragments now being monospace.
   */
  className?: string;
  /**
   * Optional override for the per-fragment numeric classes. Defaults to
   * {@link DEFAULT_FIGURE_CLASS} (`"font-mono tabular-nums"`). Rarely needed —
   * provided so a caller can, for example, add a directional color token.
   */
  figureClassName?: string;
}

/**
 * Render `children` with every numeric fragment wrapped in `font-mono
 * tabular-nums`, keeping figures on the monospace grid while prose stays sans.
 *
 * @example
 * ```tsx
 * <FigureText className="block text-xs text-text-muted">
 *   U.S. Treasury Note 4.25% 2034
 * </FigureText>
 * // → U.S. Treasury Note <span class="font-mono tabular-nums">4.25%</span>{" "}
 * //   <span class="font-mono tabular-nums">2034</span>
 * ```
 *
 * @param props - See {@link FigureTextProps}.
 * @returns An inline `<span>` wrapper containing the tokenized content.
 */
export default function FigureText({
  children,
  className,
  figureClassName = DEFAULT_FIGURE_CLASS,
}: FigureTextProps): JSX.Element {
  const text = children ?? "";
  const nodes: ReactNode[] = [];
  const regex = createNumericTokenRegex();

  let lastIndex = 0;
  let key = 0;

  // Walk each numeric match, emitting the intervening prose as a plain text
  // fragment and the match itself as a monospace figure span. Keys are stable
  // ascending integers — deterministic within a render and never reordered.
  for (
    let match = regex.exec(text);
    match !== null;
    match = regex.exec(text)
  ) {
    const start = match.index;
    const token = match[0];

    if (start > lastIndex) {
      nodes.push(
        <Fragment key={key}>{text.slice(lastIndex, start)}</Fragment>,
      );
      key += 1;
    }

    nodes.push(
      <span key={key} className={figureClassName}>
        {token}
      </span>,
    );
    key += 1;

    lastIndex = start + token.length;
  }

  // Trailing prose after the final numeric fragment (or the entire string when
  // it contained no figures at all).
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key}>{text.slice(lastIndex)}</Fragment>);
  }

  return <span className={className}>{nodes}</span>;
}
