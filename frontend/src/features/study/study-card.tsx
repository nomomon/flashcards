import { Volume2Icon } from "lucide-react";

import { RichText } from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import { useSpeak } from "@/lib/audio/use-speech";
import { stripFormatting } from "@/lib/markup";
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
  // The face renders `text` as markup; anything a screen reader or the speech
  // tier consumes gets the plain-text projection instead, so nobody hears
  // asterisks.
  const plain = stripFormatting(text);

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
      {/* The label carries the stripped text because it overrides the button's
          contents as the accessible name - without it the card face would be
          silent to a screen reader, and with the raw text it would spell out
          the delimiters. */}
      <button
        type="button"
        onClick={onFlip}
        aria-label={`${language.label}: ${plain}. Show the ${otherSideLabel} side`}
        className="flex size-full cursor-pointer flex-col items-center justify-center gap-3 p-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {language.label}
        </span>
        <span className="text-center text-4xl font-semibold break-words text-balance sm:text-5xl">
          <RichText text={text} />
        </span>
      </button>
      {/* A missing clip makes useSpeak a no-op, so this never renders disabled. */}
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`Pronounce ${plain}`}
        onClick={() => onSpeak(text, language.locale)}
        className="absolute right-2 bottom-2 text-muted-foreground"
      >
        <Volume2Icon className={cn(isSpeaking && "animate-pulse")} />
      </Button>
    </div>
  );
}
