import { cn } from "@/lib/utils";
import { AlignLeftIcon, BookTypeIcon } from "lucide-react";
import { useState } from "react";
import DeckPreview from "./preview";
import ForceUpdateButton from "./force-update";
import OverviewLoading from "./loading";

interface OverviewTemplateProps {
  data: Deck[];
}

const OverviewTemplate: React.FC<OverviewTemplateProps> = ({ data }) => {
  const [selectedDeck, setSelectedDeck] = useState<Deck>();

  if (!data || data.length === 0) {
    return <OverviewLoading />;
  }

  return (
    <>
      <div className="w-full flex justify-end my-4">
        <ForceUpdateButton />
      </div>
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
            <h2 className="text-lg font-semibold">{deck.name}</h2>
            <div className="mx-auto opacity-40">
              <BookTypeIcon className="w-12 h-12 stroke-1" />
            </div>
            <div className="flex items-center gap-2">
              <span>{deck.words.length}</span>
              <AlignLeftIcon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
      {!!selectedDeck && (
        <DeckPreview deck={selectedDeck} setSelectedDeck={setSelectedDeck} />
      )}
    </>
  );
};

export default OverviewTemplate;
