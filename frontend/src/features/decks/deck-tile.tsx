import { Link } from "@tanstack/react-router";
import { AlignLeftIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useDeckProgress } from "@/lib/progress/queries";
import type { DeckSummary } from "@/types/deck";

import { deckColorVars } from "./deck-color";
import { DeckIcon } from "./deck-icon";
import { countKnownEntries } from "./known-count";

/**
 * A square tile linking to the deck's page. Everything shown comes from the
 * manifest plus local progress, so the overview never has to fetch a deck file -
 * which is the whole reason the manifest still carries `wordCount`.
 *
 * The deck colour is a tint over the theme's card surface rather than a solid
 * fill, so the same tile is legible in light and dark; see `deck-color.ts` for
 * why that is not just an aesthetic preference.
 */
export function DeckTile({ deck }: { deck: DeckSummary }) {
  const progress = useDeckProgress(deck.id);
  const known = Math.min(countKnownEntries(progress.data), deck.wordCount);
  const percent =
    deck.wordCount > 0 ? Math.round((known / deck.wordCount) * 100) : 0;

  return (
    // The link is an overlay rather than a wrapper so that the tile can contain
    // block content (the progress bar) and still be one real anchor.
    <div
      className="relative aspect-square overflow-hidden rounded-xl bg-[var(--deck-surface)] ring-1 ring-[var(--deck-edge)] transition-transform has-[a:active]:scale-[0.99] has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50"
      style={deckColorVars(deck.color)}
    >
      {/* The deck's own colour, not the brand's: the tile is the one large
          surface a deck owns, so the atmosphere here has to come from the data
          like every other hue on this screen does. */}
      <div className="bloom bloom-deck bloom-fade" aria-hidden="true" />
      <div className="pointer-events-none relative flex h-full flex-col justify-between gap-2 p-4">
        <h2 className="font-heading text-lg leading-tight font-semibold">
          {deck.name}
        </h2>
        <DeckIcon
          name={deck.icon}
          className="mx-auto size-12 stroke-1 text-[var(--deck-accent)] opacity-80"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <AlignLeftIcon className="size-4" />
              {deck.wordCount}
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <Progress
            value={percent}
            className="h-1.5 bg-foreground/10 *:data-[slot=progress-indicator]:bg-[var(--deck-accent)]"
          />
        </div>
      </div>
      <Link
        to="/deck/$deckId"
        params={{ deckId: deck.id }}
        aria-label={`Open ${deck.name}: ${known} of ${deck.wordCount} words known`}
        className="absolute inset-0 outline-none active:bg-foreground/5"
      />
    </div>
  );
}
