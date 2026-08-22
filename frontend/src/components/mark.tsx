interface MarkProps {
  className?: string;
  /**
   * Show the glyph pair. Off below roughly 40px, where the two characters stop
   * being legible and start being texture - see `docs/DESIGN.md`.
   */
  glyphs?: boolean;
  /** Accessible name, or omit to render the mark as decoration. */
  title?: string;
}

/** The seam, leaned. See `docs/DESIGN.md` for where each number comes from. */
const SQUARE =
  "M 26 0 H 74 A 26 26 0 0 1 100 26 V 74 A 26 26 0 0 1 74 100 H 26 A 26 26 0 0 1 0 74 V 26 A 26 26 0 0 1 26 0 Z";
const SEAM = "M 50 0 C 50 20 56 30 50 50 C 44 70 50 80 50 100";

/**
 * The app's mark: one rounded square cut once, the cut leaned 22 degrees.
 *
 * The square is the deck tile's own geometry and the seam is the gutter of the
 * word list's two columns, so the mark is the product's negative space rather
 * than a shape invented alongside it.
 *
 * Drawn with `currentColor` for the field and the theme's own background for the
 * cut, which is what lets one component serve a light header, a dark home screen
 * and a deck page where the seam takes the deck's accent - the caller sets a
 * colour, the mark does not carry one.
 *
 * The glyphs live inside the clip path. A font substitution that renders wider
 * than Geist would otherwise push a character past the corner and out of the
 * square.
 */
export function Mark({ className, glyphs = false, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title>{title}</title> : null}
      <clipPath id="mark-clip">
        <path d={SQUARE} />
      </clipPath>
      <g clipPath="url(#mark-clip)">
        <rect x="-10" y="-10" width="120" height="120" fill="currentColor" />
        <path
          d={SEAM}
          transform="rotate(22 50 50)"
          fill="none"
          stroke="var(--mark-seam, var(--background))"
          strokeWidth={glyphs ? 10 : 14}
        />
        {glyphs ? (
          <g fill="var(--mark-seam, var(--background))" fontWeight={500}>
            <text
              x="24"
              y="42"
              fontSize="38"
              textAnchor="middle"
              dominantBaseline="central"
            >
              A
            </text>
            <text
              x="76"
              y="58"
              fontSize="38"
              textAnchor="middle"
              dominantBaseline="central"
            >
              あ
            </text>
          </g>
        ) : null}
      </g>
    </svg>
  );
}
