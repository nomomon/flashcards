import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import _ from "lodash";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import React, { FC } from "react";

interface DeckPreviewProps {
  deck: Deck;
  setSelectedDeck: React.Dispatch<React.SetStateAction<Deck | undefined>>;
}

const DeckPreview: FC<DeckPreviewProps> = ({ deck, setSelectedDeck }) => {
  const close = () => setSelectedDeck(undefined);

  const uniqueTags = _.uniq(deck.words.flatMap((wordPair) => wordPair.tags));

  return (
    <Drawer open={!!deck} onClose={close}>
      <DrawerContent className="bg-muted h-[calc(100vh-2rem)] max-w-lg mx-auto focus:outline-none">
        <DrawerHeader>
          <DrawerTitle>{deck.name}</DrawerTitle>
          <div className="w-full flex flex-col gap-2 text-sm overflow-hidden">
            <div className="text-muted-foreground">
              {deck.words.length} word pairs
            </div>
            <div className="flex gap-1 items-center text-muted-foreground max-sm:justify-center">
              {deck.languages.front.slice(0, 2).toUpperCase()}
              <ArrowRightIcon className="w-4 h-4" />
              {deck.languages.back.slice(0, 2).toUpperCase()}
            </div>
            <div className="max-w-full overflow-hidden">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {uniqueTags.map((tag, idx) => (
                  <Badge key={idx}>#{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </DrawerHeader>
        <div className="p-4 flex flex-col gap-2 max-h-[90vh] overflow-scroll">
          {deck.words.map((wordPair, idx) => (
            <div
              key={idx}
              className="flex justify-between bg-background px-4 py-2 rounded-md"
            >
              <span className="font-semibold">{wordPair.front}</span>
              <span>{wordPair.back}</span>
            </div>
          ))}
        </div>
        <DrawerFooter>
          <Button variant="outline" className="invert" asChild>
            <Link href={`/deck?deckId=${deck.id}`}>Learn these words</Link>
          </Button>
          <Button onClick={close} variant="outline">
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DeckPreview;
