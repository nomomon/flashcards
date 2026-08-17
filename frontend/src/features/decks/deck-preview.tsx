import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_STUDY_DIRECTION } from "@/features/study/directions";
import { selectWords } from "@/features/study/session-queue";
import { useDeck } from "@/lib/data/queries";
import type { DeckSummary } from "@/types/deck";
import type { StudyDirection } from "@/types/session";

import { DirectionPicker } from "./direction-picker";
import { TagPicker } from "./tag-picker";

/**
 * Drawer body: pick tags and a direction, see what the selection covers, then
 * start. Mounted only while the drawer is open, so opening a deck also warms
 * the deck query the study route needs next.
 */
export function DeckPreview({ deck }: { deck: DeckSummary }) {
  const tags = useMemo(() => [...deck.tags].sort(), [deck.tags]);
  const [selectedTags, setSelectedTags] = useState<string[]>(tags);
  const [direction, setDirection] = useState<StudyDirection>(
    DEFAULT_STUDY_DIRECTION,
  );
  const deckQuery = useDeck(deck.id);

  // "All tags selected" is expressed as no tag filter at all: it keeps the URL
  // short and, unlike an explicit list, still covers words that carry no tags.
  const everyTagSelected = selectedTags.length === tags.length;
  const tagFilter = everyTagSelected ? null : selectedTags;

  const words = useMemo(
    () => (deckQuery.data ? selectWords(deckQuery.data, tagFilter) : null),
    [deckQuery.data, tagFilter],
  );

  const wordCount = words?.length ?? (everyTagSelected ? deck.wordCount : null);
  const noTagsSelected = tags.length > 0 && selectedTags.length === 0;
  const canStart = !noTagsSelected && (wordCount === null || wordCount > 0);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((selected) => selected !== tag)
        : [...current, tag],
    );
  };

  return (
    <>
      <DrawerHeader className="gap-3 text-left">
        <DrawerTitle className="text-lg">{deck.name}</DrawerTitle>
        <DrawerDescription>
          {wordCount === null ? "Counting words…" : `${wordCount} word pairs`}
        </DrawerDescription>
        <DirectionPicker
          languages={deck.languages}
          value={direction}
          onChange={setDirection}
        />
        <TagPicker
          tags={tags}
          selectedTags={selectedTags}
          onToggle={toggleTag}
        />
      </DrawerHeader>

      <div className="min-h-24 flex-1 overflow-y-auto px-4 pb-2">
        <div className="flex flex-col gap-2">
          {words
            ? words.map((word) => (
                <div
                  key={word.id}
                  className="flex items-baseline justify-between gap-4 rounded-lg bg-muted px-4 py-2"
                >
                  <span className="font-medium">{word.front}</span>
                  <span className="text-right text-muted-foreground">
                    {word.back}
                  </span>
                </div>
              ))
            : Array.from({ length: 6 }, (_, index) => (
                <Skeleton
                  // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
                  key={index}
                  className="h-10 rounded-lg"
                />
              ))}
        </div>
      </div>

      <DrawerFooter>
        {canStart ? (
          <Button asChild size="lg" className="h-11 text-base">
            <Link
              to="/deck"
              search={{
                deckId: deck.id,
                direction,
                tags: tagFilter ?? undefined,
              }}
              aria-label={`Learn ${deck.name}`}
            >
              Learn these words
            </Link>
          </Button>
        ) : (
          <Button size="lg" disabled className="h-11 text-base">
            {noTagsSelected
              ? "Select at least one tag"
              : "No words in this selection"}
          </Button>
        )}
        <DrawerClose asChild>
          <Button variant="outline" size="lg" className="h-11">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}
