/**
 * Study statistics. Local-only, like progress: they live in localStorage and
 * are never sent anywhere.
 *
 * Deliberately **aggregate-only**. A bucket is one local calendar day holding
 * three numbers, and there is no per-word history here - `DeckProgress` already
 * knows the state of every word, and a second, weaker copy of it that grew with
 * every answer would cost storage to say less. See `lib/stats/store.ts`.
 */

export interface DayStats {
  /** Milliseconds of active use - see `lib/stats/use-time-on-task.ts`. */
  ms: number;
  correct: number;
  incorrect: number;
}

export interface StudyStats {
  schemaVersion: number;
  /** Keyed by local calendar day, `YYYY-MM-DD`. */
  days: Record<string, DayStats>;
}
