import { CornerUpLeftIcon, CornerUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RatingButtonsProps {
  onRate: (known: boolean) => void;
  disabled?: boolean;
}

/**
 * The two big verdict buttons. Mirrors the keyboard shortcuts the session
 * installs: ArrowLeft is incorrect, ArrowRight is correct.
 */
export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm items-stretch gap-3">
      <Button
        variant="ghost"
        size="lg"
        disabled={disabled}
        onClick={() => onRate(false)}
        className="h-auto flex-1 flex-col gap-1 py-4 text-muted-foreground"
      >
        <CornerUpLeftIcon className="size-6" />
        <span className="text-sm">Incorrect</span>
      </Button>
      <Button
        variant="ghost"
        size="lg"
        disabled={disabled}
        onClick={() => onRate(true)}
        className="h-auto flex-1 flex-col gap-1 py-4 text-muted-foreground"
      >
        <CornerUpRightIcon className="size-6" />
        <span className="text-sm">Correct</span>
      </Button>
    </div>
  );
}
