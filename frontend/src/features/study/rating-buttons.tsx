import { CornerUpLeftIcon, CornerUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RatingButtonsProps {
  onRate: (known: boolean) => void;
  disabled?: boolean;
}

/**
 * The two big verdict buttons. Mirrors the keyboard shortcuts the session
 * installs: ArrowLeft is incorrect, ArrowRight is correct.
 *
 * They carry the same two colours the card takes on when dragged that way, so
 * the button, the swipe tint and the stamp are visibly one verdict rather than
 * three separate affordances. Colour is never the only signal: each button also
 * says the word and points its arrow.
 */
export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm items-stretch gap-3">
      <Button
        variant="ghost"
        size="lg"
        disabled={disabled}
        onClick={() => onRate(false)}
        className="h-auto flex-1 flex-col gap-1 py-4 text-incorrect hover:bg-incorrect/10 hover:text-incorrect"
      >
        <CornerUpLeftIcon className="size-6" />
        <span className="text-sm">Incorrect</span>
      </Button>
      <Button
        variant="ghost"
        size="lg"
        disabled={disabled}
        onClick={() => onRate(true)}
        className="h-auto flex-1 flex-col gap-1 py-4 text-correct hover:bg-correct/10 hover:text-correct"
      >
        <CornerUpRightIcon className="size-6" />
        <span className="text-sm">Correct</span>
      </Button>
    </div>
  );
}
