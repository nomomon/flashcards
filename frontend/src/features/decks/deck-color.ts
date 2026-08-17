import type { CSSProperties } from "react";

/**
 * A deck's colour, resolved into something that works in both themes.
 *
 * The problem with using `deck.color` as a surface: it is an arbitrary hue from
 * data, and CSS cannot pick a contrasting text colour for it. `#FF4F00` wants
 * dark text, `#0E7490` wants light text, and there is no shipped way to branch
 * on that (`color-contrast()` is not available, and relative colour syntax
 * cannot express "whichever of these two is legible"). Hardcoding white text is
 * what made bright decks unreadable in light mode and harsh in dark mode.
 *
 * So the deck owns the *hue* and the theme owns the *lightness*:
 *
 * - `--deck-surface` mixes a little of the deck colour into the theme's own card
 *   colour. Because `--card` differs per theme, one expression gives a light
 *   tint on light and a dark tint on dark, and text stays the normal foreground.
 * - `--deck-accent` pulls the deck colour toward the current foreground, so it
 *   darkens in light mode and lightens in dark mode. That keeps a pale yellow
 *   deck visible on white and a navy deck visible on black, without either
 *   losing its identity.
 * - `--deck-edge` is the same idea at low strength, for hairlines.
 *
 * `oklab` for the mixing because it interpolates perceptually: mixing in sRGB
 * takes saturated hues through a muddy middle.
 */
export function deckColorVars(color: string): CSSProperties {
  return {
    "--deck": color,
    "--deck-surface": `color-mix(in oklab, ${color} 12%, var(--card))`,
    "--deck-edge": `color-mix(in oklab, ${color} 30%, var(--border))`,
    "--deck-accent": `color-mix(in oklab, ${color} 70%, var(--foreground))`,
  } as CSSProperties;
}
