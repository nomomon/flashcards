import { useState } from "react";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import type { DeckSummary } from "@/types/deck";

import { DeckGrid } from "./deck-grid";
import { DeckPreview } from "./deck-preview";

/**
 * Owns the "which deck is being previewed" interaction. `selected` outlives
 * `open` on purpose: keeping the deck around lets the drawer animate shut.
 */
export function DeckBrowser({ decks }: { decks: DeckSummary[] }) {
  const [selected, setSelected] = useState<DeckSummary | null>(null);
  const [open, setOpen] = useState(false);

  const handleSelect = (deck: DeckSummary) => {
    setSelected(deck);
    setOpen(true);
  };

  return (
    <>
      <DeckGrid decks={decks} onSelect={handleSelect} />
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-lg data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
          {selected ? <DeckPreview key={selected.id} deck={selected} /> : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
