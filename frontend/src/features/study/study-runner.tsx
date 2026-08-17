import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { useRateWord } from "@/lib/progress/queries";
import { shuffle } from "@/lib/utils";
import type { Deck } from "@/types/deck";
import type { DeckProgress } from "@/types/progress";
import type { StudyDirection } from "@/types/session";

import { RatingButtons } from "./rating-buttons";
import { buildStudyCards, selectWords } from "./session-queue";
import { StudyCardView } from "./study-card";
import { StudyComplete } from "./study-complete";

interface StudyRunnerProps {
  deck: Deck;
  progress: DeckProgress;
  tags: string[] | null;
  direction: StudyDirection;
  isResetting: boolean;
  onStudyAgain: () => void;
  onResetProgress: () => void;
}

/**
 * One pass through a selection. The queue is derived from props, never copied
 * into state: `cards` is the shuffled selection (stable for the lifetime of the
 * component, which the parent remounts to start a new session) and `remaining`
 * filters it by what has been answered here and what progress already knows.
 */
export function StudyRunner({
  deck,
  progress,
  tags,
  direction,
  isResetting,
  onStudyAgain,
  onResetProgress,
}: StudyRunnerProps) {
  const { mutate: rateWord } = useRateWord(deck.id);
  const [answered, setAnswered] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [flippedKey, setFlippedKey] = useState<string | null>(null);

  const cards = useMemo(
    () => shuffle(buildStudyCards(deck, tags, direction)),
    [deck, tags, direction],
  );

  const remaining = useMemo(
    () =>
      cards.filter(
        (card) =>
          !answered.has(card.key) && !progress.words[card.wordId]?.known,
      ),
    [cards, answered, progress],
  );

  const selection = useMemo(() => selectWords(deck, tags), [deck, tags]);
  const knownInSelection = selection.filter(
    (word) => progress.words[word.id]?.known,
  ).length;

  const current = remaining[0];

  const handleRate = useCallback(
    (known: boolean) => {
      if (!current) return;

      setAnswered((previous) => new Set(previous).add(current.key));
      rateWord(
        { wordId: current.wordId, known },
        {
          onError: () => toast.error("Could not save that answer"),
        },
      );
    },
    [current, rateWord],
  );

  const toggleFlip = useCallback(() => {
    setFlippedKey((key) =>
      current && key !== current.key ? current.key : null,
    );
  }, [current]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focused controls keep their own keyboard behaviour.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isInteractiveTarget(event.target)) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          handleRate(false);
          break;
        case "ArrowRight":
          event.preventDefault();
          handleRate(true);
          break;
        case " ":
        case "Enter":
          event.preventDefault();
          toggleFlip();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRate, toggleFlip]);

  if (!current) {
    return (
      <StudyComplete
        known={knownInSelection}
        total={selection.length}
        isResetting={isResetting}
        onStudyAgain={onStudyAgain}
        onResetProgress={onResetProgress}
      />
    );
  }

  const reviewed = cards.length - remaining.length;
  const percent =
    cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {remaining.length} {remaining.length === 1 ? "card" : "cards"} left
          </span>
          <span className="tabular-nums">
            {reviewed}/{cards.length}
          </span>
        </div>
        <Progress value={percent} aria-label="Session progress" />
      </div>

      <StudyCardView
        key={current.key}
        card={current}
        flipped={flippedKey === current.key}
        onFlip={toggleFlip}
      />

      <RatingButtons onRate={handleRate} />

      <p className="text-center text-xs text-muted-foreground">
        Space or Enter flips the card. Left arrow is incorrect, right arrow is
        correct.
      </p>
    </div>
  );
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("a, button, input, select, textarea, [role='button']") !==
      null
  );
}
