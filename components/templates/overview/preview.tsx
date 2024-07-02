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
import Link from "next/link";
import React, { FC } from "react";

interface DeckPreviewProps {
    deck: Deck;
    setSelectedDeck: React.Dispatch<React.SetStateAction<Deck | undefined>>;
}

const DeckPreview: FC<DeckPreviewProps> = ({ deck, setSelectedDeck }) => {
    const close = () => setSelectedDeck(undefined);

    return (
        <Drawer open={!!deck} onClose={close}>
            <DrawerContent className="bg-muted h-[calc(100vh-2rem)] max-w-lg mx-auto">
                <DrawerHeader>
                    <DrawerTitle>{deck.name}</DrawerTitle>
                    <DrawerDescription>{deck.words.length} word pairs</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 flex flex-col gap-2">
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
                    <Button
                        variant="outline"
                        className="invert"
                        asChild
                    >
                        <Link href={`/deck?deckId=${deck.id}`}>
                            Learn these words
                        </Link>
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
