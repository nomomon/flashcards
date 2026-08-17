import type { DeckLanguages } from "@/types/deck";
import type { StudyDirection } from "@/types/session";

/**
 * The two study directions. Declared once here so the search-param schema, the
 * direction switch and the queue builder cannot drift apart.
 */
export const STUDY_DIRECTIONS = [
  "front-to-back",
  "back-to-front",
] as const satisfies readonly StudyDirection[];

/**
 * Which way round a deck starts.
 *
 * `back-to-front`, i.e. the deck's *back* language is the prompt. The decks here
 * are authored Dutch-first because that is how the source material is laid out,
 * but the useful drill is being shown the English and having to produce the
 * Dutch, so the default asks for the language being learned.
 *
 * This is a presentation default, not a property of the data. Swapping the
 * columns in the banks instead would have been destructive: word ids are slugs of
 * the `front` text and they are the keys progress is stored under, so making
 * English the front would either reset every learner's progress or leave every id
 * failing the slug invariant.
 */
export const DEFAULT_STUDY_DIRECTION: StudyDirection = "back-to-front";

/**
 * The direction a URL means. `direction` is an optional search param, so an
 * absent value is the default rather than an error — which keeps links that have
 * no opinion about direction free of it.
 */
export function resolveDirection(
  direction: StudyDirection | undefined,
): StudyDirection {
  return direction ?? DEFAULT_STUDY_DIRECTION;
}

/** The other direction. The switch is a toggle, so this is all it needs. */
export function flipDirection(direction: StudyDirection): StudyDirection {
  return direction === "front-to-back" ? "back-to-front" : "front-to-back";
}

/** Language labels in the order this direction reads, e.g. Dutch then English. */
export function directionEndpoints(
  languages: DeckLanguages,
  direction: StudyDirection,
): { from: string; to: string } {
  const front = languages.front.label;
  const back = languages.back.label;

  return direction === "back-to-front"
    ? { from: back, to: front }
    : { from: front, to: back };
}

export function describeDirection(
  languages: DeckLanguages,
  direction: StudyDirection,
): string {
  const { from, to } = directionEndpoints(languages, direction);
  return `${from} → ${to}`;
}

/**
 * Which side of a word is the prompt, and which is the answer, under this
 * direction. Used by both the word list (column order) and the session, so the
 * two always agree about what is being asked.
 */
export function orientWord<T extends { front: string; back: string }>(
  word: T,
  direction: StudyDirection,
): { prompt: string; answer: string } {
  return direction === "back-to-front"
    ? { prompt: word.back, answer: word.front }
    : { prompt: word.front, answer: word.back };
}

/** Locales matching `orientWord`, so audio speaks each side in its own voice. */
export function orientLocales(
  languages: DeckLanguages,
  direction: StudyDirection,
): { prompt: string; answer: string } {
  return direction === "back-to-front"
    ? { prompt: languages.back.locale, answer: languages.front.locale }
    : { prompt: languages.front.locale, answer: languages.back.locale };
}
