import { Link } from "@tanstack/react-router";
import {
  ClockIcon,
  FlameIcon,
  LayersIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ResetProgressButton } from "@/features/decks/reset-progress-button";
import {
  ActivityChart,
  type ActivityMetric,
} from "@/features/stats/activity-chart";
import {
  formatCount,
  formatDuration,
  formatPercent,
  pluralise,
} from "@/features/stats/format";
import { LibraryProgress } from "@/features/stats/library-progress";
import { StatTile } from "@/features/stats/stat-tile";
import { buildSeries, summarise } from "@/features/stats/summary";
import { useManifest } from "@/lib/data/queries";
import { useResetStats, useStats } from "@/lib/stats/queries";

import { MainHeader } from "./main-tabs";

/**
 * What the learner has actually done, from the day buckets in `lib/stats`.
 *
 * The whole page is four figures, one chart and the library meter, and it is
 * meant to stay that size. Everything here answers a question a learner asks
 * themselves - am I keeping this up, how much time is it costing me, am I
 * getting them right, how far through the words am I - and a statistic that
 * answers none of those is decoration on a page whose only job is to be
 * glanced at.
 */

/** Two weeks: long enough to show a habit, short enough to read on a phone. */
const RANGE_DAYS = 14;

export function StatsPage() {
  const stats = useStats();
  const manifest = useManifest();
  const resetStats = useResetStats();

  const [metric, setMetric] = useState<ActivityMetric>("cards");

  const data = stats.data;
  const summary = useMemo(() => (data ? summarise(data) : null), [data]);
  const points = useMemo(
    () => (data ? buildSeries(data, RANGE_DAYS) : []),
    [data],
  );

  const handleReset = () => {
    resetStats.mutate(undefined, {
      onSuccess: () => toast.success("Statistics were erased"),
      onError: (error) =>
        toast.error("Could not erase statistics", {
          description: error.message,
        }),
    });
  };

  const decks = manifest.data?.decks ?? [];

  return (
    <div className="flex flex-col gap-6">
      <MainHeader />

      {summary?.hasData ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={FlameIcon}
              label="Streak"
              value={`${summary.streak} ${pluralise(summary.streak, "day", "days")}`}
              hint={
                summary.bestStreak > 0
                  ? `Best ${summary.bestStreak} ${pluralise(summary.bestStreak, "day", "days")}`
                  : undefined
              }
            />
            <StatTile
              icon={ClockIcon}
              label="Time studied"
              value={formatDuration(summary.totalMs)}
              hint={`${formatDuration(summary.weekMs)} this week`}
            />
            <StatTile
              icon={LayersIcon}
              label="Cards answered"
              value={formatCount(summary.totalAnswered)}
              hint={`${formatCount(summary.weekAnswered)} this week`}
            />
            <StatTile
              icon={TargetIcon}
              label="Correct"
              value={
                summary.accuracy === null
                  ? "-"
                  : formatPercent(summary.accuracy)
              }
              hint={
                summary.recentAccuracy === null
                  ? "All time"
                  : `${formatPercent(summary.recentAccuracy)} this week`
              }
            />
          </div>

          <section className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold">Activity</h2>
              {/* Two measures on two scales, so they are two charts behind one
                  toggle rather than two y-axes on one. */}
              <ToggleGroup
                type="single"
                size="sm"
                value={metric}
                onValueChange={(value) => {
                  if (value) setMetric(value as ActivityMetric);
                }}
                aria-label="What the chart plots"
              >
                <ToggleGroupItem value="cards">Cards</ToggleGroupItem>
                <ToggleGroupItem value="minutes">Minutes</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <ActivityChart points={points} metric={metric} />
          </section>
        </>
      ) : (
        <EmptyStats />
      )}

      {decks.length > 0 ? <LibraryProgress decks={decks} /> : null}

      {summary?.hasData ? (
        <ResetProgressButton
          isResetting={resetStats.isPending}
          onReset={handleReset}
          label="Erase statistics"
          armedLabel="Tap again to erase statistics"
        />
      ) : null}
    </div>
  );
}

/**
 * Nothing has been recorded yet - which is also what a learner sees the first
 * time they open this app after the feature ships, since none of this can be
 * backfilled from progress. Says so, rather than showing four zeros.
 */
function EmptyStats() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
      <div className="relative flex items-center justify-center p-6">
        <div className="bloom bloom-fade" aria-hidden="true" />
        <SparklesIcon className="size-8 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">No sessions yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Time and answers are counted from the moment you start studying. They
          stay on this device.
        </p>
      </div>
      <Button asChild size="lg" className="h-11">
        <Link to="/">Pick a deck</Link>
      </Button>
    </div>
  );
}
