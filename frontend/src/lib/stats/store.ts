import { z } from "zod";
import type { DayStats, StudyStats } from "@/types/stats";

/**
 * Study statistics, in localStorage. Pure and synchronous - no React, no
 * network - and, exactly as in `lib/progress/store.ts`, **reads never throw**:
 * every failure path degrades to an empty record, because a broken stats blob
 * must never be able to take the app down with it.
 *
 * Two rules define what is allowed in here.
 *
 * 1. **Aggregates only.** A day holds milliseconds of active use and how many
 *    verdicts fell each way. Nothing is keyed by word and nothing records the
 *    order cards were seen in. Per-word history would be a second, weaker copy
 *    of `DeckProgress` - which already knows the current state of every word -
 *    and unlike progress it would grow with every answer forever.
 * 2. **One bucket per local calendar day.** Every figure on the stats page is a
 *    sum or a ratio over whole days, so a day is the smallest unit worth
 *    keeping. Local rather than UTC because a streak has to agree with the
 *    calendar the learner is looking at: a card answered at 23:30 belongs to
 *    the day they think it does.
 */

const STORAGE_KEY = "flashcards:stats:v1";
export const STATS_SCHEMA_VERSION = 1;

/**
 * Roughly fourteen months, so a full year is always complete and the record
 * still costs a few tens of KB at worst. Older days are dropped on write.
 */
const MAX_DAYS = 400;

const dayStatsSchema = z.object({
  ms: z.number().nonnegative().finite(),
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
});

const studyStatsSchema = z.object({
  schemaVersion: z.number().int(),
  days: z.record(z.string(), dayStatsSchema),
});

/** See the note on the same pair in `lib/progress/store.ts`. */
function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Quota exceeded, or storage disabled. Statistics are the least important
    // thing in this app; losing a write is not worth telling anyone about.
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // See safeSet.
  }
}

export function emptyStats(): StudyStats {
  return { schemaVersion: STATS_SCHEMA_VERSION, days: {} };
}

export function emptyDay(): DayStats {
  return { ms: 0, correct: 0, incorrect: 0 };
}

/**
 * The local calendar day as `YYYY-MM-DD`.
 *
 * Built from the local date parts rather than `toISOString()`, which would
 * shift late-evening study into tomorrow for anyone east of UTC and early
 * morning into yesterday for anyone west of it.
 */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Day keys sort lexicographically, which is the whole reason for this format. */
function prune(days: Record<string, DayStats>): Record<string, DayStats> {
  const keys = Object.keys(days);
  if (keys.length <= MAX_DAYS) return days;

  const kept = keys.sort().slice(-MAX_DAYS);
  return Object.fromEntries(kept.map((key) => [key, days[key] as DayStats]));
}

export function readStats(): StudyStats {
  const raw = safeGet(STORAGE_KEY);
  if (raw === null) return emptyStats();

  try {
    const result = studyStatsSchema.safeParse(JSON.parse(raw));
    if (!result.success) return emptyStats();
    return { schemaVersion: STATS_SCHEMA_VERSION, days: result.data.days };
  } catch {
    return emptyStats();
  }
}

export function writeStats(stats: StudyStats): void {
  safeSet(STORAGE_KEY, JSON.stringify(stats));
}

export function clearStats(): void {
  safeRemove(STORAGE_KEY);
}

/**
 * The one place a day bucket is updated. Returns new objects so query-cache
 * consumers see a changed reference, and prunes on the way out so the record
 * cannot grow past `MAX_DAYS` however long the app is used.
 */
function updateDay(
  stats: StudyStats,
  date: Date,
  change: (day: DayStats) => DayStats,
): StudyStats {
  const key = dayKey(date);
  const days = { ...stats.days, [key]: change(stats.days[key] ?? emptyDay()) };
  return { schemaVersion: STATS_SCHEMA_VERSION, days: prune(days) };
}

/** Adds active time to a day. Non-positive and non-finite values are ignored. */
export function addTime(
  stats: StudyStats,
  ms: number,
  date = new Date(),
): StudyStats {
  if (!Number.isFinite(ms) || ms <= 0) return stats;
  return updateDay(stats, date, (day) => ({ ...day, ms: day.ms + ms }));
}

/** Records one verdict. The word it was about is deliberately not passed in. */
export function addAnswer(
  stats: StudyStats,
  known: boolean,
  date = new Date(),
): StudyStats {
  return updateDay(stats, date, (day) => ({
    ...day,
    correct: day.correct + (known ? 1 : 0),
    incorrect: day.incorrect + (known ? 0 : 1),
  }));
}
