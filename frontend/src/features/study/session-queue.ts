import type { Deck, LanguageInfo, Word } from "@/types/deck";
import type { StudyDirection } from "@/types/session";

/** One prompt/answer pairing. A word yields two of these in `both` mode. */
export interface StudyCard {
  /** Unique per card, so the two directions of one word stay distinguishable. */
  key: string;
  wordId: string;
  prompt: string;
  answer: string;
  promptLanguage: LanguageInfo;
  answerLanguage: LanguageInfo;
}

/**
 * The words a selection covers. `null` means "no tag filter", which also keeps
 * words that carry no tags at all.
 */
export function selectWords(deck: Deck, tags: string[] | null): Word[] {
  if (!tags) return deck.words;
  return deck.words.filter((word) =>
    word.tags.some((tag) => tags.includes(tag)),
  );
}

export function buildStudyCards(
  deck: Deck,
  tags: string[] | null,
  direction: StudyDirection,
): StudyCard[] {
  const words = selectWords(deck, tags);

  switch (direction) {
    case "front-to-back":
      return words.map((word) => toCard(deck, word, false));
    case "back-to-front":
      return words.map((word) => toCard(deck, word, true));
    case "both":
      return [
        ...words.map((word) => toCard(deck, word, false)),
        ...words.map((word) => toCard(deck, word, true)),
      ];
  }
}

function toCard(deck: Deck, word: Word, reversed: boolean): StudyCard {
  const { front, back } = deck.languages;

  return reversed
    ? {
        key: `${word.id}:back`,
        wordId: word.id,
        prompt: word.back,
        answer: word.front,
        promptLanguage: back,
        answerLanguage: front,
      }
    : {
        key: `${word.id}:front`,
        wordId: word.id,
        prompt: word.front,
        answer: word.back,
        promptLanguage: front,
        answerLanguage: back,
      };
}
