import { getRouteApi, Link } from "@tanstack/react-router";
import { PlayIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DeckHeader, DeckHeaderSkeleton } from "@/features/decks/deck-header";
import { DECK_TOP_BAR_HEIGHT, DeckTopBar } from "@/features/decks/deck-top-bar";
import { DirectionSwitch } from "@/features/decks/direction-switch";
import { countKnownEntries } from "@/features/decks/known-count";
import { ResetProgressButton } from "@/features/decks/reset-progress-button";
import { TagFilter } from "@/features/decks/tag-filter";
import { WordList, WordListSkeleton } from "@/features/decks/word-list";
import { resolveDirection } from "@/features/study/directions";
import { selectWords } from "@/features/study/session-queue";
import { useDeck, useManifest } from "@/lib/data/queries";
import { useScrolledPast } from "@/lib/dom/use-scrolled-past";
import { useDeckProgress, useResetDeckProgress } from "@/lib/progress/queries";
import { countKnown } from "@/lib/progress/store";
import { cn } from "@/lib/utils";
import type { StudyDirection } from "@/types/session";

const routeApi = getRouteApi("/deck/$deckId");

/**
 * The deck's own page: what is in it, how it will be asked, and one button to
 * start.
 *
 * It renders in two waves on purpose. The manifest gives the name, colour, icon
 * and word count, so the header and the options appear immediately; the bank
 * arrives a moment later and fills in the word list and the topic list. Nothing
 * waits for everything.
 *
 * The page is framed by two sticky edges. The way back is held at the top and
 * turns into a titled header once the deck's own heading scrolls under it; the
 * one button that matters is held at the bottom, where a long word list can pass
 * behind it. Both are `position: sticky` rather than `fixed`, which is what lets
 * the bottom one *stop* being pinned: it settles into the end of the page beside
 * "Reset progress", so scrolling all the way down arrives somewhere rather than
 * running out of content under a floating bar.
 */
export function DeckPage() {
  const { deckId } = routeApi.useParams();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  // An absent `direction` means the default: the search string carries choices
  // the learner made, not defaults nobody chose.
  const direction = resolveDirection(search.direction);

  // The heading is held in state rather than a ref because it does not exist
  // until the manifest lands - see `useScrolledPast`.
  const [heading, setHeading] = useState<HTMLHeadingElement | null>(null);
  const scrolled = useScrolledPast(heading, DECK_TOP_BAR_HEIGHT);

  const manifest = useManifest();
  const deck = useDeck(deckId);
  const progress = useDeckProgress(deckId);
  const resetProgress = useResetDeckProgress(deckId);

  const summary = manifest.data?.decks.find((entry) => entry.id === deckId);
  const isMissing = manifest.isSuccess && !summary;

  useEffect(() => {
    if (!isMissing) return;

    toast.error("That deck is not available", {
      description: "It may have been renamed or removed.",
    });
    void navigate({ to: "/", replace: true });
  }, [isMissing, navigate]);

  // Topics come from the words themselves, not from the manifest: this page
  // fetches the bank anyway, and a denormalized copy could only drift.
  const allTags = useMemo(
    () =>
      deck.data
        ? [...new Set(deck.data.words.flatMap((word) => word.tags))].sort()
        : null,
    [deck.data],
  );

  /**
   * A hand-edited `?tags=` can name topics this deck does not have, and naming
   * all of them is the same as naming none. Both reduce to "no filter" so the
   * page never shows a selection it cannot honour.
   */
  const selectedTags = useMemo(() => {
    if (!search.tags || !allTags) return null;

    const known = search.tags.filter((tag) => allTags.includes(tag));
    return known.length > 0 && known.length < allTags.length ? known : null;
  }, [search.tags, allTags]);

  const words = useMemo(
    () => (deck.data ? selectWords(deck.data, selectedTags) : null),
    [deck.data, selectedTags],
  );

  const known = useMemo(() => {
    if (!progress.data) return 0;
    if (deck.data) return countKnown(deck.data, progress.data);
    return Math.min(countKnownEntries(progress.data), summary?.wordCount ?? 0);
  }, [deck.data, progress.data, summary?.wordCount]);

  // Options live in the URL, so they survive a refresh and carry into the
  // session. `replace` keeps every flip of the switch out of the back stack -
  // "back" should return to the deck grid, not undo a toggle.
  const setDirection = useCallback(
    (next: StudyDirection) => {
      void navigate({
        search: (previous) => ({ ...previous, direction: next }),
        replace: true,
      });
    },
    [navigate],
  );

  const setTags = useCallback(
    (next: string[] | null) => {
      void navigate({
        search: (previous) => ({ ...previous, tags: next ?? undefined }),
        replace: true,
      });
    },
    [navigate],
  );

  const handleReset = () => {
    resetProgress.mutate(undefined, {
      onSuccess: () => toast.success("Progress reset for this deck"),
      onError: (error) =>
        toast.error("Could not reset progress", {
          description: error.message,
        }),
    });
  };

  const canStart = words === null || words.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <DeckTopBar name={summary?.name} scrolled={scrolled} />

      {summary ? (
        <DeckHeader
          name={summary.name}
          icon={summary.icon}
          color={summary.color}
          wordCount={summary.wordCount}
          known={known}
          nameRef={setHeading}
        />
      ) : (
        <DeckHeaderSkeleton />
      )}

      {summary ? (
        <>
          <div className="flex flex-col gap-1">
            <DirectionSwitch
              languages={summary.languages}
              direction={direction}
              onChange={setDirection}
            />
            <TagFilter
              tags={allTags}
              selected={selectedTags}
              onChange={setTags}
            />
            {/* How much of the deck the options above have left. It reads with
                them rather than with the button, which is now at the far end of
                the page and has room for a label and nothing else. */}
            <p className="text-sm text-muted-foreground">
              {words === null
                ? "Loading words…"
                : selectedTags
                  ? `${words.length} of ${summary.wordCount} words selected`
                  : `${words.length} words`}
            </p>
          </div>

          {deck.isError ? (
            <DeckError
              message={
                deck.error instanceof Error
                  ? deck.error.message
                  : "This deck could not be loaded."
              }
              isRetrying={deck.isFetching}
              onRetry={() => void deck.refetch()}
            />
          ) : words ? (
            <WordList
              words={words}
              languages={summary.languages}
              direction={direction}
            />
          ) : (
            <WordListSkeleton />
          )}

          {/* Held against the bottom of the viewport while there is still deck
              below it, then released into the page beside "Reset progress".
              `-mx-4 px-4` so its background spans the column; the gradient is
              absolute so it can soften the rows passing behind without adding
              its own height to the page once the bar has settled. */}
          <div className="sticky bottom-0 z-20 -mx-4 bg-background px-4 pb-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-background to-transparent"
            />
            {canStart ? (
              <Button asChild size="lg" className="h-12 w-full text-base">
                <Link
                  to="/deck/$deckId/study"
                  params={{ deckId }}
                  // Passed through rather than resolved: if the learner never
                  // touched the switch, the session link stays free of a
                  // direction param too.
                  search={{
                    tags: selectedTags ?? undefined,
                    direction: search.direction,
                  }}
                >
                  <PlayIcon />
                  {known > 0 ? "Continue studying" : "Start studying"}
                </Link>
              </Button>
            ) : (
              <Button size="lg" disabled className="h-12 w-full text-base">
                No words in this selection
              </Button>
            )}
          </div>

          <ResetProgressButton
            isResetting={resetProgress.isPending}
            onReset={handleReset}
          />
        </>
      ) : manifest.isError ? (
        <DeckError
          message={
            manifest.error instanceof Error
              ? manifest.error.message
              : "This deck could not be loaded."
          }
          isRetrying={manifest.isFetching}
          onRetry={() => void manifest.refetch()}
        />
      ) : (
        <WordListSkeleton />
      )}
    </div>
  );
}

interface DeckErrorProps {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}

function DeckError({ message, isRetrying, onRetry }: DeckErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <TriangleAlertIcon className="size-8 text-destructive" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">Could not load this deck</p>
        <p className="max-w-md text-sm break-words text-muted-foreground">
          {message}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          size="lg"
          className="h-11"
          disabled={isRetrying}
          onClick={onRetry}
        >
          <RefreshCwIcon className={cn(isRetrying && "animate-spin")} />
          Try again
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link to="/">Back to decks</Link>
        </Button>
      </div>
    </div>
  );
}
