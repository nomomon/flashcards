import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { deckColorVars } from "./deck-color";
import { DeckIcon } from "./deck-icon";

interface DeckHeaderProps {
  name: string;
  /** Icon name from the deck's `icon` field; unknown names fall back. */
  icon: string | undefined;
  color: string;
  wordCount: number;
  known: number;
}

/**
 * The deck's identity and the learner's standing in it. The deck colour is used
 * as an accent - the icon tile and the progress indicator - rather than as a
 * full-bleed background, because this page is mostly text and a coloured field
 * behind 127 word pairs would cost more contrast than it buys recognition.
 *
 * The accent is theme-resolved (see `deck-color.ts`), so a deck stays
 * recognisable and legible in both light and dark rather than being white text
 * on whatever hue the data happened to carry.
 */
export function DeckHeader({
  name,
  icon,
  color,
  wordCount,
  known,
}: DeckHeaderProps) {
  const clamped = Math.min(known, wordCount);
  const percent = wordCount > 0 ? Math.round((clamped / wordCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-3" style={deckColorVars(color)}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--deck-surface)] text-[var(--deck-accent)] ring-1 ring-[var(--deck-edge)]">
          <DeckIcon name={icon} className="size-6 stroke-[1.5]" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight">
            {name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {wordCount} words
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{clamped}</span> known
          </p>
        </div>
      </div>
      <Progress
        value={percent}
        aria-label={`${percent}% of this deck is marked known`}
        // The indicator is a child element, so only a class can reach it - and
        // the colour comes from runtime data, so no class can be generated for
        // it. A custom property set on the ancestor bridges the two.
        className="h-1.5 bg-foreground/10 *:data-[slot=progress-indicator]:bg-[var(--deck-accent)]"
      />
    </div>
  );
}

export function DeckHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  );
}
