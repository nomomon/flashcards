import { useQueries } from "@tanstack/react-query";

import { Progress } from "@/components/ui/progress";
import { countKnownEntries } from "@/features/decks/known-count";
import { deckProgressQueryOptions } from "@/lib/progress/queries";
import type { DeckSummary } from "@/types/deck";

import { formatPercent } from "./format";

/**
 * How much of the whole library is marked known - the one figure here that
 * comes from progress rather than from the day buckets, and the only one that
 * answers "how far along am I overall?".
 *
 * One progress query per deck, through `useQueries` because the deck list is
 * only known at runtime and a hook per deck in a loop would break the rules of
 * hooks the first time a deck was published.
 */
export function LibraryProgress({ decks }: { decks: DeckSummary[] }) {
  const progresses = useQueries({
    queries: decks.map((deck) => deckProgressQueryOptions(deck.id)),
  });

  const rows = decks.map((deck, index) => ({
    deck,
    // Ids of words since removed from a deck can linger in storage, so the
    // count is clamped - the same clamp the deck tiles apply.
    known: Math.min(countKnownEntries(progresses[index]?.data), deck.wordCount),
  }));

  const known = rows.reduce((sum, row) => sum + row.known, 0);
  const total = rows.reduce((sum, row) => sum + row.deck.wordCount, 0);
  const percent = total > 0 ? (known / total) * 100 : 0;

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">Library</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{known}</span> of{" "}
          {total} words known
        </p>
      </div>

      <Progress value={percent} aria-label="Words known across all decks" />

      <ul className="flex flex-col gap-2">
        {rows.map(({ deck, known: deckKnown }) => (
          <li
            key={deck.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: deck.color }}
                aria-hidden="true"
              />
              <span className="truncate">{deck.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {deckKnown}/{deck.wordCount}
              <span className="ml-2 inline-block w-9 text-right">
                {deck.wordCount > 0
                  ? formatPercent(deckKnown / deck.wordCount)
                  : "-"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
