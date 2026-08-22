import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The bar's height in pixels, which callers need in order to line a reveal up
 * with its lower edge. It is pinned by `h-13` below rather than measured: one
 * number in one file beats a layout read on every render, and the two are next
 * to each other so they cannot drift unnoticed.
 */
export const DECK_TOP_BAR_HEIGHT = 52;

interface DeckTopBarProps {
  /** The deck's name, echoed here once its own heading is out of sight. */
  name: string | undefined;
  /** True once the page has scrolled past that heading. */
  scrolled: boolean;
}

/**
 * The way back, kept on screen.
 *
 * Two things it does not do until the deck's own heading has gone: draw its
 * bottom rule, and name the deck. At rest this is simply the first line of the
 * page - a rule under it would divide nothing, and the name would be the second
 * copy of a title already three times the size directly below. Both fade in
 * together, so the bar turns into a header exactly when it starts behaving like
 * one.
 *
 * It bleeds past the page's horizontal padding (`-mx-4 px-4`) so its background
 * reaches the edges of the column. Without that, the word list would scroll up
 * through two clear strips either side of it.
 *
 * That background is opaque rather than a frosted `bg-background/80
 * backdrop-blur`. Blur at this radius left the rows behind the bar readable
 * rather than suggested - two lines of Dutch competing with the deck name over
 * the same 52px - and it is the one place on this page where something has to
 * sit on top of scrolling text and stay legible. Opaque also matches the bottom
 * bar, costs no `backdrop-filter`, and degrades to nothing where that is
 * unsupported.
 */
export function DeckTopBar({ name, scrolled }: DeckTopBarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-4 h-13 border-b bg-background px-4 transition-colors",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="-ml-2 flex h-full items-center gap-1">
        <Button asChild variant="ghost" size="icon-lg" aria-label="All decks">
          <Link to="/">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <Link
          to="/"
          className="rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Decks
        </Link>
        {/* Hidden from assistive tech: this is a second rendering of the h1, not
            a second thing to read. One line with an ellipsis rather than a wrap,
            because the bar has exactly one line's worth of room - a long deck
            name has to lose its tail rather than the bar its height. `truncate`
            rather than `line-clamp-1`: the clamp cuts to one line but leaves
            `text-overflow: clip`, so the name ends mid-word with nothing to say
            that it was cut. */}
        <span
          aria-hidden="true"
          className={cn(
            "min-w-0 flex-1 truncate pl-3 text-right text-sm font-medium transition-opacity duration-200",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        >
          {name}
        </span>
      </div>
    </div>
  );
}
