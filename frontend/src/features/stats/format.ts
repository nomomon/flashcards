/** Number and duration formatting for the stats page. */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * `40s`, `47m`, `3h 12m`. Rounded down: a learner comparing this against their
 * own sense of the session should never see it claim more than they put in, and
 * rounding up is the direction that inflates.
 *
 * Seconds below the first minute, because the alternative is a first session
 * that reports `0m` and reads as a broken counter rather than a short sitting.
 */
export function formatDuration(ms: number): string {
  if (ms < MINUTE_MS) return `${Math.floor(ms / 1000)}s`;

  const totalMinutes = Math.floor(ms / MINUTE_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** Whole minutes - what the chart plots and what its labels say. */
export function minutesOf(ms: number): number {
  return Math.round(ms / MINUTE_MS);
}

export function formatHours(ms: number): string {
  return `${(ms / HOUR_MS).toFixed(1)}h`;
}

/** `1,284` up to five figures, then `12.9K`. */
export function formatCount(value: number): string {
  if (value < 10_000) return value.toLocaleString();
  return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

const DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const SHORT_DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

export function formatDay(date: Date): string {
  return DAY_LABEL.format(date);
}

export function formatShortDay(date: Date): string {
  return SHORT_DAY_LABEL.format(date);
}

export function pluralise(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
