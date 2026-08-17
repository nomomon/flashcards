import { Volume2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSpeak } from "@/lib/audio/use-speech";
import { cn } from "@/lib/utils";
import type { LanguageInfo } from "@/types/deck";

import type { StudyCard } from "./session-queue";

interface StudyCardViewProps {
  card: StudyCard;
  flipped: boolean;
  onFlip: () => void;
}

/**
 * The flippable card. Tap the face, or press Space/Enter while it is focused,
 * to turn it over. The 3D flip itself lives in index.css.
 */
export function StudyCardView({ card, flipped, onFlip }: StudyCardViewProps) {
  const { speak, isPlaying } = useSpeak();

  return (
    <div
      className="flip-scene mx-auto aspect-square w-full max-w-sm"
      data-flipped={flipped}
    >
      <div className="flip-inner size-full">
        <CardFace
          text={card.prompt}
          language={card.promptLanguage}
          otherSideLabel={card.answerLanguage.label}
          visible={!flipped}
          isSpeaking={isPlaying}
          onFlip={onFlip}
          onSpeak={speak}
        />
        <CardFace
          className="flip-face-back"
          text={card.answer}
          language={card.answerLanguage}
          otherSideLabel={card.promptLanguage.label}
          visible={flipped}
          isSpeaking={isPlaying}
          onFlip={onFlip}
          onSpeak={speak}
        />
      </div>
    </div>
  );
}

interface CardFaceProps {
  className?: string;
  text: string;
  language: LanguageInfo;
  otherSideLabel: string;
  visible: boolean;
  isSpeaking: boolean;
  onFlip: () => void;
  onSpeak: (text: string, locale: string) => void;
}

function CardFace({
  className,
  text,
  language,
  otherSideLabel,
  visible,
  isSpeaking,
  onFlip,
  onSpeak,
}: CardFaceProps) {
  return (
    // `inert` keeps the face that is turned away out of the tab order and out
    // of the accessibility tree.
    <div
      inert={!visible}
      className={cn(
        "flip-face overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10",
        className,
      )}
    >
      <button
        type="button"
        onClick={onFlip}
        aria-label={`Show the ${otherSideLabel} side`}
        className="flex size-full cursor-pointer flex-col items-center justify-center gap-3 p-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {language.label}
        </span>
        <span className="text-center text-4xl font-semibold break-words text-balance sm:text-5xl">
          {text}
        </span>
      </button>
      {/* A missing clip makes useSpeak a no-op, so this never renders disabled. */}
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`Pronounce ${text}`}
        onClick={() => onSpeak(text, language.locale)}
        className="absolute right-2 bottom-2 text-muted-foreground"
      >
        <Volume2Icon className={cn(isSpeaking && "animate-pulse")} />
      </Button>
    </div>
  );
}
