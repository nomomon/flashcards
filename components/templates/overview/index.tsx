import { cn } from "@/lib/utils";
import { AlignLeftIcon, BrainCircuitIcon } from "lucide-react";
import { useState } from "react";
import DeckPreview from "./preview";

interface OverviewTemplateProps {
    data: Deck[];
}

const OverviewTemplate: React.FC<OverviewTemplateProps> = ({ data }) => {
    const [selectedDeck, setSelectedDeck] = useState<Deck>();

    return (
        <>
            <div className="w-full grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {data.map((deck) => (
                    <div
                        key={deck.name}
                        className={cn(
                            "flex flex-col justify-between p-4 text-white rounded-md aspect-square",
                            "hover:shadow-md hover:scale-[1.02] transition-transform cursor-pointer",
                        )}
                        style={{ backgroundColor: deck.color || "#aaa" }}
                        onClick={() => setSelectedDeck(deck)}
                    >
                        <h2 className="text-xl font-semibold">{deck.name}</h2>
                        <div className="mx-auto opacity-40">
                            <BrainCircuitIcon className="w-16 h-16 stroke-1" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span>{deck.words.length}</span>
                            <AlignLeftIcon className="w-5 h-5" />
                        </div>
                    </div >
                ))}
            </div >
            {!!selectedDeck && (
                <DeckPreview deck={selectedDeck} setSelectedDeck={setSelectedDeck} />
            )}
        </>
    );
};

export default OverviewTemplate;
