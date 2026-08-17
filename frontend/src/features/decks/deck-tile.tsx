import { AlignLeftIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useDeckProgress } from "@/lib/progress/queries";
import type { DeckSummary } from "@/types/deck";
import type { DeckProgress } from "@/types/progress";
import { DeckIcon } from "./deck-icon";

interface DeckTileProps {
  deck: DeckSummary;
  onSelect: (deck: DeckSummary) => void;
}

/**
 * A square, deck-coloured tile. Everything shown comes from the manifest plus
 * local progress, so the overview never has to fetch a deck file.
 */
export function DeckTile({ deck, onSelect }: DeckTileProps) {
  const progress = useDeckProgress(deck.id);
  const known = Math.min(countKnown(progress.data), deck.wordCount);
  const percent =
    deck.wordCount > 0 ? Math.round((known / deck.wordCount) * 100) : 0;

  return (
    // The button is an overlay rather than a wrapper so that the tile can
    // contain block content (the progress bar) and still be one real button.
    <div
      className="relative aspect-square overflow-hidden rounded-xl text-white shadow-sm transition-transform has-[button:active]:scale-[0.99] has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50"
      style={{ backgroundColor: deck.color }}
    >
      <div className="pointer-events-none flex h-full flex-col justify-between gap-2 p-4">
        <h2 className="font-heading text-lg leading-tight font-semibold">
          {deck.name}
        </h2>
        <DeckIcon
          name={deck.icon}
          className="mx-auto size-12 stroke-1 opacity-40"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <AlignLeftIcon className="size-4" />
              {deck.wordCount}
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <Progress
            value={percent}
            className="bg-white/25 *:data-[slot=progress-indicator]:bg-white"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(deck)}
        aria-label={`Open ${deck.name}: ${known} of ${deck.wordCount} words known`}
        className="absolute inset-0 cursor-pointer outline-none active:bg-black/5"
      />
    </div>
  );
}

/**
 * Counts known entries straight off stored progress. Ids for words that have
 * since been removed from the deck can linger, hence the caller's clamp.
 */
function countKnown(progress: DeckProgress | undefined): number {
  if (!progress) return 0;

  let known = 0;
  for (const word of Object.values(progress.words)) {
    if (word.known) known += 1;
  }
  return known;
}
