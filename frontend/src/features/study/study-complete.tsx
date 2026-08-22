import { Link } from "@tanstack/react-router";
import { HomeIcon, RotateCcwIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ScoreRing } from "./score-ring";

interface StudyCompleteProps {
  known: number;
  total: number;
  isResetting: boolean;
  onStudyAgain: () => void;
  onResetProgress: () => void;
}

export function StudyComplete({
  known,
  total,
  isResetting,
  onStudyAgain,
  onResetProgress,
}: StudyCompleteProps) {
  const perfect = total > 0 && known >= total;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* The one place the brand gradient appears in the product. Finishing a
          deck is the only moment in this app worth marking, and a bloom behind
          the ring marks it without putting colour anywhere text is read. */}
      <div className="relative flex items-center justify-center p-10">
        <div className="bloom bloom-fade" aria-hidden="true" />
        <ScoreRing known={known} total={total} />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {perfect
          ? "Every word in this selection is marked known."
          : "Nothing left to review in this selection."}
      </p>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button size="lg" className="h-11 text-base" onClick={onStudyAgain}>
          <RotateCcwIcon />
          Study again
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link to="/">
            <HomeIcon />
            Back to decks
          </Link>
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="h-11"
          disabled={isResetting}
          onClick={onResetProgress}
        >
          <TrashIcon />
          Reset progress
        </Button>
      </div>
    </div>
  );
}
