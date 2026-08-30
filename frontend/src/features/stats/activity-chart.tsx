import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  formatDay,
  formatDuration,
  formatShortDay,
  minutesOf,
  pluralise,
} from "./format";
import type { DayPoint } from "./summary";

export type ActivityMetric = "cards" | "minutes";

interface ActivityChartProps {
  points: DayPoint[];
  metric: ActivityMetric;
}

/**
 * Daily columns, hand-rolled in CSS rather than SVG.
 *
 * A column chart is a row of boxes with proportional heights, which is what
 * flexbox already is - so laying it out in CSS costs no library, no width
 * measurement and no `viewBox` arithmetic, and it stays sharp and responsive at
 * any container width. The 2px separators between stacked segments are real
 * flex gaps in the surface colour, which is exactly the spacer a stacked bar is
 * supposed to have.
 *
 * The hovered day is reported in a fixed readout line above the plot rather
 * than a floating tooltip: at this size a tooltip would cover a third of the
 * chart, and the line doubles as the range summary when nothing is hovered, so
 * the space is never idle.
 */
export function ActivityChart({ points, metric }: ActivityChartProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const max = niceMax(
    Math.max(...points.map((point) => metricValue(point, metric)), 0),
  );

  const active = points.find((point) => point.key === activeKey) ?? null;
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="flex flex-col gap-3">
      {/* Reads as a caption until a column is hovered or focused, then as that
          day's numbers. Not a live region: every column already carries the
          same numbers in its own label, so announcing this too would say each
          day twice. `min-h` because the line swapping length must not shift the
          chart under the pointer. */}
      <p className="min-h-5 text-sm text-muted-foreground">
        {active ? (
          <DayReadout point={active} />
        ) : (
          <RangeReadout points={points} metric={metric} />
        )}
      </p>

      <div className="relative">
        {/* Gridlines: hairline, solid, one step off the surface. The top line
            carries the only tick - the axis is there to give the columns a
            ceiling, not to be read off. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 border-t border-b border-border"
          aria-hidden="true"
        >
          <div className="absolute inset-x-0 top-1/2 border-t border-border/60" />
        </div>
        <span
          className="pointer-events-none absolute -top-2 right-0 bg-card pl-1 text-[10px] tabular-nums text-muted-foreground"
          aria-hidden="true"
        >
          {max}
        </span>

        <div className="flex h-32 items-end gap-[3px]">
          {points.map((point) => (
            <Column
              key={point.key}
              point={point}
              metric={metric}
              max={max}
              isActive={point.key === activeKey}
              onActivate={() => setActiveKey(point.key)}
              onDeactivate={() => setActiveKey(null)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{first ? formatShortDay(first.date) : ""}</span>
        <span>{last ? formatShortDay(last.date) : ""}</span>
      </div>

      {/* Two series always get a legend; one never does - the readout above
          already names what is plotted. */}
      {metric === "cards" ? (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <LegendKey className="bg-chart-correct" label="Correct" />
          <LegendKey className="bg-chart-incorrect" label="Incorrect" />
        </div>
      ) : null}
    </div>
  );
}

interface ColumnProps {
  point: DayPoint;
  metric: ActivityMetric;
  max: number;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

function Column({
  point,
  metric,
  max,
  isActive,
  onActivate,
  onDeactivate,
}: ColumnProps) {
  const value = metricValue(point, metric);
  // A day with a single card still has to be visible, or the chart says
  // "nothing happened" about a day something did.
  const heightPercent = value > 0 ? Math.max((value / max) * 100, 3) : 0;

  const segments =
    metric === "cards"
      ? // Incorrect on top so the correct block always grows from the baseline:
        // its height is then comparable across days by position alone, which is
        // the half of a stacked bar that can actually be compared.
        [
          {
            key: "incorrect",
            value: point.incorrect,
            className: "bg-chart-incorrect",
          },
          {
            key: "correct",
            value: point.correct,
            className: "bg-chart-correct",
          },
        ].filter((segment) => segment.value > 0)
      : [{ key: "minutes", value, className: "bg-chart-correct" }];

  return (
    <button
      type="button"
      // Focusable so the chart can be read from the keyboard: each stop
      // announces its own label and updates the readout above.
      className={cn(
        // The hovered day is marked by tinting its slot, not by dimming the
        // other bars: opacity on a data fill changes the colour the reader is
        // comparing, and a highlight must not touch the encoding.
        "h-full flex-1 cursor-default rounded-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive && "bg-muted",
      )}
      aria-label={labelFor(point, metric)}
      onPointerEnter={onActivate}
      onPointerLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onClick={onActivate}
    >
      <span className="flex h-full flex-col justify-end">
        {value > 0 ? (
          <span
            className="mx-auto flex w-full max-w-6 flex-col gap-[2px]"
            style={{ height: `${heightPercent}%` }}
          >
            {segments.map((segment, index) => (
              <span
                key={segment.key}
                className={cn(
                  segment.className,
                  // Rounded data-end, square at the baseline.
                  index === 0 && "rounded-t-[4px]",
                )}
                style={{ flexGrow: segment.value, flexBasis: 0 }}
              />
            ))}
          </span>
        ) : (
          // An empty day is drawn, not skipped: the gaps in a habit are the
          // most useful thing on this chart. Toned off the muted-foreground
          // ink rather than the muted surface, which is within a percent of the
          // card in light mode and left these invisible.
          <span className="mx-auto h-[3px] w-full max-w-6 rounded-full bg-muted-foreground/30" />
        )}
      </span>
    </button>
  );
}

function LegendKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn("size-2 rounded-full", className)}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function DayReadout({ point }: { point: DayPoint }) {
  return (
    <>
      <span className="font-medium text-foreground">
        {formatShortDay(point.date)}
      </span>
      {" · "}
      {point.answered > 0
        ? `${point.answered} ${pluralise(point.answered, "card", "cards")}, ${point.correct} correct`
        : "no cards"}
      {point.ms > 0 ? ` · ${formatDuration(point.ms)}` : ""}
    </>
  );
}

function RangeReadout({
  points,
  metric,
}: {
  points: DayPoint[];
  metric: ActivityMetric;
}) {
  const cards = points.reduce((sum, point) => sum + point.answered, 0);
  // Summed in milliseconds rather than from the rounded minutes the columns
  // plot, so the total is the real one and not fourteen roundings.
  const ms = points.reduce((sum, point) => sum + point.ms, 0);
  // "Days you did something" has to mean the thing being plotted, or the
  // minutes view counts days by a measure it is not showing.
  const active = points.filter((point) =>
    metric === "cards" ? point.answered > 0 : point.ms > 0,
  ).length;

  return (
    <>
      <span className="font-medium text-foreground">
        {metric === "cards"
          ? `${cards} ${pluralise(cards, "card", "cards")}`
          : formatDuration(ms)}
      </span>
      {` over ${active} of ${points.length} days`}
    </>
  );
}

function metricValue(point: DayPoint, metric: ActivityMetric): number {
  return metric === "cards" ? point.answered : minutesOf(point.ms);
}

function labelFor(point: DayPoint, metric: ActivityMetric): string {
  const day = formatDay(point.date);
  if (metric === "minutes") {
    return `${day}: ${formatDuration(point.ms)}`;
  }
  if (point.answered === 0) return `${day}: no cards`;
  return `${day}: ${point.answered} ${pluralise(point.answered, "card", "cards")}, ${point.correct} correct, ${point.incorrect} incorrect`;
}

/** Round the ceiling up to something readable, so the top tick is a clean number. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.5, 2, 2.5, 5, 7.5]) {
    const candidate = step * magnitude;
    if (candidate >= value) return Math.round(candidate);
  }
  return 10 * magnitude;
}
