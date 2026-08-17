import type { DeckLanguages } from "@/types/deck";
import type { StudyDirection } from "@/types/session";

/**
 * The study directions, in the order they are offered to the learner. Declared
 * once here so the search-param schema and the picker cannot drift apart.
 */
export const STUDY_DIRECTIONS = [
  "front-to-back",
  "back-to-front",
  "both",
] as const satisfies readonly StudyDirection[];

export const DEFAULT_STUDY_DIRECTION: StudyDirection = "front-to-back";

/** Short two-letter labels, e.g. `NL → EN`, for the direction picker. */
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
  return direction === "both" ? `${from} ↔ ${to}` : `${from} → ${to}`;
}
