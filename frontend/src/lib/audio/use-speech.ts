import { useCallback, useEffect, useState } from "react";
import { stripFormatting } from "@/lib/markup";

/**
 * Pronunciation playback, via the browser's own text-to-speech.
 *
 * Two tiers: a voice for the locale, or silence. Silence is the important one -
 * a device without a Dutch voice is a normal state, not an error, and it never
 * surfaces to the learner as one. `isAvailable` is what lets a caller hide the
 * control instead of offering a button that does nothing.
 */

interface UseSpeakResult {
  speak: (text: string, locale: string) => void;
  isPlaying: boolean;
  isAvailable: (text: string, locale: string) => boolean;
}

/**
 * What actually gets voiced: the card text with inline formatting removed.
 * Otherwise synthesis pronounces the delimiters - "star star man star star".
 */
const spokenText = (text: string) => stripFormatting(text);

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return "speechSynthesis" in window ? window.speechSynthesis : null;
}

/** "nl_NL" / "nl-nl" / "nl" all normalize toward comparability. */
const normalizeLocale = (locale: string) =>
  locale.toLowerCase().replace(/_/g, "-");

const primarySubtag = (locale: string) => normalizeLocale(locale).split("-")[0];

/** Exact locale match first, then any voice sharing the language subtag. */
function findVoice(
  voices: SpeechSynthesisVoice[],
  locale: string,
): SpeechSynthesisVoice | undefined {
  const wanted = normalizeLocale(locale);
  const language = primarySubtag(locale);
  return (
    voices.find((voice) => normalizeLocale(voice.lang) === wanted) ??
    voices.find((voice) => primarySubtag(voice.lang) === language)
  );
}

/**
 * The voice list is populated asynchronously in Chromium, so it is usually
 * empty on first read and arrives with a `voiceschanged` event.
 */
function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const synthesis = getSpeechSynthesis();
    if (!synthesis) return;

    const update = () => setVoices(synthesis.getVoices());
    update();
    synthesis.addEventListener("voiceschanged", update);
    return () => synthesis.removeEventListener("voiceschanged", update);
  }, []);

  return voices;
}

export function useSpeak(): UseSpeakResult {
  const voices = useVoices();
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = useCallback(
    (text: string, locale: string) => {
      const spoken = spokenText(text);
      if (spoken === "") return;

      const synthesis = getSpeechSynthesis();
      if (!synthesis) return;
      const voice = findVoice(voices, locale);
      if (!voice) return;

      // A new request always wins over an in-flight one.
      synthesis.cancel();
      setIsPlaying(false);

      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      synthesis.speak(utterance);
    },
    [voices],
  );

  const isAvailable = useCallback(
    (text: string, locale: string) =>
      spokenText(text) !== "" && findVoice(voices, locale) !== undefined,
    [voices],
  );

  useEffect(() => {
    return () => {
      getSpeechSynthesis()?.cancel();
    };
  }, []);

  return { speak, isPlaying, isAvailable };
}
