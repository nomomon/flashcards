import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  /** The comparison that gives the value meaning. Optional, but usually there. */
  hint?: string;
  icon: LucideIcon;
}

/**
 * One figure, its label and one line of context.
 *
 * Values wear the default proportional figures rather than `tabular-nums`:
 * these are standalone numbers, not a column to align, and tabular digits set
 * at this size read visibly loose.
 */
export function StatTile({ label, value, hint, icon: Icon }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <p className="font-heading text-2xl font-semibold tracking-tight">
        {value}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
