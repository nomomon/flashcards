import {
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
} from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  directionEndpoints,
  STUDY_DIRECTIONS,
} from "@/features/study/directions";
import type { DeckLanguages } from "@/types/deck";
import type { StudyDirection } from "@/types/session";

interface DirectionPickerProps {
  languages: DeckLanguages;
  value: StudyDirection;
  onChange: (direction: StudyDirection) => void;
}

const DIRECTION_ICONS = {
  "front-to-back": ArrowRightIcon,
  "back-to-front": ArrowLeftIcon,
  both: ArrowLeftRightIcon,
} as const;

export function DirectionPicker({
  languages,
  value,
  onChange,
}: DirectionPickerProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="lg"
      value={value}
      // Radix emits "" when the active item is clicked again; keep the current
      // direction in that case, since a session always has one.
      onValueChange={(next) => {
        if (isStudyDirection(next)) onChange(next);
      }}
      aria-label="Study direction"
      className="w-full"
    >
      {STUDY_DIRECTIONS.map((direction) => {
        const Icon = DIRECTION_ICONS[direction];
        const { from, to } = directionEndpoints(languages, direction);
        const label =
          direction === "both"
            ? `Both directions, ${from} and ${to}`
            : `${from} to ${to}`;

        return (
          <ToggleGroupItem
            key={direction}
            value={direction}
            aria-label={label}
            className="h-10 flex-1 gap-1.5"
          >
            {abbreviate(from)}
            <Icon />
            {abbreviate(to)}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

function abbreviate(label: string): string {
  return label.slice(0, 2).toUpperCase();
}

function isStudyDirection(value: string): value is StudyDirection {
  return (STUDY_DIRECTIONS as readonly string[]).includes(value);
}
