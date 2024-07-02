"use client";

import { useEffect, useState } from "react";
import { getDeck } from "@/lib/backend";
import { useSearchParams } from "next/navigation";
import LearnDeck from "@/components/templates/learn";

const DeckPage = () => {
    const searchParams = useSearchParams();
    const deckId = searchParams.get("deckId") || "";
    const deckProgress = localStorage.getItem(`progress_${deckId}`) || {};

    const [deck, setDeck] = useState<Deck>();
    useEffect(() => {
        getDeck(deckId).then((d) => {
            setDeck(d);
        });
    }, [deckId]);

    return (
        <LearnDeck deck={deck} deckProgress={deckProgress} />
    );
}

export default DeckPage;