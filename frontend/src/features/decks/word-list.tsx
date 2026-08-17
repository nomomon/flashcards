import { Volume2Icon } from "lucide-react";
import { Fragment } from "react";

import { RichText } from "@/components/rich-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  directionEndpoints,
  orientLocales,
  orientWord,
} from "@/features/study/directions";
import { useSpeak } from "@/lib/audio/use-speech";
import { stripFormatting } from "@/lib/markup";
import { cn } from "@/lib/utils";
import type { DeckLanguages, Word } from "@/types/deck";
import type { StudyDirection } from "@/types/session";

/**
 * `py-2.5` plus `leading-relaxed` is the comfortable-density point for this many
 * rows: loose enough to scan, tight enough that a deck is still a page rather
 * than a scroll marathon.
 */
const CELL_CLASS = "py-2.5 leading-relaxed break-words";

interface WordListProps {
  words: Word[];
  languages: DeckLanguages;
  /** Decides which side is the left column - see `orientWord`. */
  direction: StudyDirection;
}

/**
 * The deck's word pairs, as something you can actually read.
 *
 * Three decisions worth keeping:
 *
 * 1. **One language per column, not both sides of a card.** The pair is the
 *    interesting thing, and the direction switch decides which half is the
 *    prompt - so the columns swap with it, and the header labels swap with them.
 * 2. **A `<dl>` on a two-column grid.** Term/definition is what these rows are,
 *    and making the `dt`/`dd` pairs direct grid children is what keeps the
 *    columns aligned down a list of 120-odd rows. Nested flex rows drift as soon
 *    as one entry wraps.
 * 3. **Wrap, never truncate.** Some fronts carry a whole construction
 *    (`door ... trokken (trekken (door))`); an ellipsis would hide the part that
 *    makes them worth reading.
 *
 * Each row can be played. The button speaks the *prompt* column, so the
 * direction switch doubles as a language chooser for listening: flip it and the
 * same buttons read the other language. Missing audio is silent by design -
 * `useSpeak` falls back to speech synthesis and otherwise does nothing, since a
 * clip that has not been generated yet is a normal state rather than an error.
 */
export function WordList({ words, languages, direction }: WordListProps) {
  const { from, to } = directionEndpoints(languages, direction);
  const locales = orientLocales(languages, direction);
  const { speak } = useSpeak();

  if (words.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No words match the selected topics.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-1" aria-label="Words in this deck">
      <div className="grid grid-cols-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {/* The leading indent matches the play button's width so the header sits
            over its column rather than over the buttons. */}
        <span className="pr-3 pl-11">{from}</span>
        <span className="pr-3 pl-1">{to}</span>
      </div>

      <dl className="grid grid-cols-2 overflow-hidden rounded-xl">
        {words.map((word, index) => {
          const { prompt, answer } = orientWord(word, direction);
          // Zebra rather than rules: on a phone, a tinted band is what carries
          // the eye from a wrapped prompt across to its answer.
          const striped = index % 2 === 1;

          return (
            <Fragment key={word.id}>
              <dt
                className={cn(
                  CELL_CLASS,
                  "flex items-start gap-1 pr-3 pl-1 text-base",
                  striped && "bg-muted/50",
                )}
              >
                <button
                  type="button"
                  onClick={() => speak(prompt, locales.prompt)}
                  aria-label={`Listen to ${stripFormatting(prompt)}`}
                  // -my-1 keeps the 36px tap target from setting the row height:
                  // it reaches into the row padding instead of adding to it.
                  className="-my-1 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Volume2Icon className="size-4" />
                </button>
                <span className="min-w-0 flex-1">
                  <RichText text={prompt} />
                </span>
              </dt>
              <dd
                className={cn(
                  CELL_CLASS,
                  "pr-3 pl-1 text-base text-muted-foreground",
                  striped && "bg-muted/50",
                )}
              >
                <RichText text={answer} />
              </dd>
            </Fragment>
          );
        })}
      </dl>
    </section>
  );
}

export function WordListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <section className="flex flex-col gap-3" aria-hidden="true">
      <div className="grid grid-cols-2 gap-x-4 px-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
          key={index}
          className="grid grid-cols-2 gap-x-4 px-3"
        >
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </section>
  );
}
