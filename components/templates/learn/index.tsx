import { countPositiveProgress, getProgress, saveProgress, shuffle } from "@/lib/utils";
import { CornerUpLeftIcon, CornerUpRightIcon } from "lucide-react";
import { FC, useState } from "react";
import LearnDeckCompleted from "./completed";
import { get } from "http";

interface LearnDeckProps {
    deck: Deck;
    deckProgress: DeckProgress;
}

const LearnDeck: FC<LearnDeckProps> = ({ deck, deckProgress }) => {
    const [wordList, setWordList] = useState<WordPair[]>(shuffle(deck.words));

    const updateProgress = (progress: 0 | 1) => {
        const word = wordList[0];
        saveProgress(deck.id, word.front, progress);
        setWordList(wordList.slice(1));
    }

    if (wordList.length === 0) {
        return <LearnDeckCompleted
            correctCount={countPositiveProgress(getProgress(deck.id))}
            totalCount={deck.words.length}
            deckId={deck.id}
        />
    }

    return (
        <div className="w-full h-full">
            <div
                className="max-w-sm bg-white rounded-xl shadow-md mx-auto my-10 p-5 aspect-square flex justify-center items-center text-6xl"
            >
                <span>{wordList[0].front}</span>
            </div>
            <div className="max-w-md mx-auto flex justify-between">
                <div
                    onClick={() => updateProgress(0)}
                    className="flex items-center justify-center flex-col cursor-pointer text-muted-foreground select-none">
                    <CornerUpLeftIcon />
                    <span className="text-sm">Incorrect</span>
                </div>
                <div
                    onClick={() => updateProgress(1)}
                    className="flex items-center justify-center flex-col cursor-pointer text-muted-foreground select-none">
                    <CornerUpRightIcon />
                    <span className="text-sm">Correct</span>
                </div>
            </div>
        </div>
    )
}

export default LearnDeck;