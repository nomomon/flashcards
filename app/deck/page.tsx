"use client";

import { useEffect, useState } from "react";
import { getDeck } from "@/lib/backend";
import { useSearchParams } from "next/navigation";
import LearnDeck from "@/components/templates/learn";
import LearnDeckLoading from "@/components/templates/learn/loading";
import { toast } from "@/components/ui/use-toast";
import { getProgress } from "@/lib/localStorage";

const DeckPage = () => {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId") || "";
  const tags = searchParams.get("tags")?.split(",") || [];
  const deckProgress = getProgress(deckId);

  const [deck, setDeck] = useState<Deck>();
  useEffect(() => {
    getDeck(deckId)
      .then((d) => {
        if (tags) {
          d.words = d.words.filter((wordPair) =>
            tags.some((tag) => wordPair.tags.includes(tag)),
          );
        }
        setDeck(d);
      })
      .catch((e) => {
        toast({
          title: `Error: ${e.message}`,
          description: "Redirecting to home screen..",
        });
        setTimeout(() => (window.location.href = "/"), 2000);
      });
  }, [deckId]);

  if (!deck) {
    return <LearnDeckLoading />;
  }

  return <LearnDeck deck={deck} deckProgress={deckProgress} />;
};

export default DeckPage;
