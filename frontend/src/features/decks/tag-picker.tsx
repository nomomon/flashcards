import { Badge } from "@/components/ui/badge";

interface TagPickerProps {
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

/** Multi-select tag row. Real buttons, `aria-pressed` for the toggle state. */
export function TagPicker({ tags, selectedTags, onToggle }: TagPickerProps) {
  if (tags.length === 0) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex w-max gap-2">
        {tags.map((tag) => {
          const selected = selectedTags.includes(tag);

          return (
            <Badge key={tag} asChild variant={selected ? "default" : "outline"}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(tag)}
                className="h-8 cursor-pointer px-3 text-sm"
              >
                #{tag}
              </button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
