import { dayKey, emptyDay } from "@/lib/stats/store";
import type { DayStats, StudyStats } from "@/types/stats";

/**
 * Everything the stats page shows, derived from the day buckets.
 *
 * Pure functions over a `StudyStats`, in the feature that renders them - the
 * same split as `features/decks/known-count.ts`: `lib/stats` owns storage,
 * this owns what the numbers mean.
 */

/** One day, zero-filled, ready to plot. */
export interface DayPoint {
  key: string;
  date: Date;
  correct: number;
  incorrect: number;
  answered: number;
  ms: number;
}

export interface StatsSummary {
  totalMs: number;
  totalAnswered: number;
  totalCorrect: number;
  /** All-time share of answers marked known, or `null` before the first one. */
  accuracy: number | null;
  /** The same over the last seven days - the comparison that shows movement. */
  recentAccuracy: number | null;
  weekMs: number;
  weekAnswered: number;
  /** Consecutive days answered, counting back from today. */
  streak: number;
  bestStreak: number;
  /** Days with at least one answer, ever. */
  activeDays: number;
  hasData: boolean;
}

/** `YYYY-MM-DD` back to a local midnight. See `dayKey` for why not `new Date(key)`. */
function parseDayKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function shiftDays(date: Date, by: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + by);
  return shifted;
}

function dayOf(stats: StudyStats, date: Date): DayStats {
  return stats.days[dayKey(date)] ?? emptyDay();
}

/**
 * A day counts towards a streak when a card was answered on it, not merely when
 * the app was opened. Opening the app is a visit; the streak is meant to say
 * "I practised", so time alone does not keep one alive.
 */
function isStudied(day: DayStats): boolean {
  return day.correct + day.incorrect > 0;
}

function toPoint(key: string, date: Date, day: DayStats): DayPoint {
  return {
    key,
    date,
    correct: day.correct,
    incorrect: day.incorrect,
    answered: day.correct + day.incorrect,
    ms: day.ms,
  };
}

/** The last `days` days, oldest first, with the empty ones filled in. */
export function buildSeries(
  stats: StudyStats,
  days: number,
  today = new Date(),
): DayPoint[] {
  const points: DayPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = shiftDays(today, -offset);
    points.push(toPoint(dayKey(date), date, dayOf(stats, date)));
  }
  return points;
}

function ratio(correct: number, answered: number): number | null {
  return answered > 0 ? correct / answered : null;
}

/**
 * Counts back from today, and tolerates today being empty: a streak is only
 * broken once a whole day has passed without an answer, so it does not read as
 * zero every morning until the first card is turned over.
 */
function currentStreak(stats: StudyStats, today: Date): number {
  let cursor = isStudied(dayOf(stats, today)) ? today : shiftDays(today, -1);

  let streak = 0;
  while (isStudied(dayOf(stats, cursor))) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }
  return streak;
}

/** The longest run of consecutive studied days anywhere in the record. */
function bestStreak(stats: StudyStats): number {
  const dates = Object.entries(stats.days)
    .filter(([, day]) => isStudied(day))
    .map(([key]) => parseDayKey(key))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  let best = 0;
  let run = 0;
  let previous: Date | null = null;

  for (const date of dates) {
    run =
      previous !== null && shiftDays(previous, 1).getTime() === date.getTime()
        ? run + 1
        : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

export function summarise(stats: StudyStats, today = new Date()): StatsSummary {
  let totalMs = 0;
  let totalCorrect = 0;
  let totalAnswered = 0;
  let activeDays = 0;

  for (const day of Object.values(stats.days)) {
    totalMs += day.ms;
    totalCorrect += day.correct;
    totalAnswered += day.correct + day.incorrect;
    if (isStudied(day)) activeDays += 1;
  }

  const week = buildSeries(stats, 7, today);
  const weekMs = week.reduce((sum, point) => sum + point.ms, 0);
  const weekAnswered = week.reduce((sum, point) => sum + point.answered, 0);
  const weekCorrect = week.reduce((sum, point) => sum + point.correct, 0);

  return {
    totalMs,
    totalAnswered,
    totalCorrect,
    accuracy: ratio(totalCorrect, totalAnswered),
    recentAccuracy: ratio(weekCorrect, weekAnswered),
    weekMs,
    weekAnswered,
    streak: currentStreak(stats, today),
    bestStreak: bestStreak(stats),
    activeDays,
    hasData: totalAnswered > 0 || totalMs > 0,
  };
}
