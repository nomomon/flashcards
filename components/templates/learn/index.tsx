import { FC } from "react";

interface LearnDeckProps {
    deck?: Deck;
    deckProgress?: any;
}

const LearnDeck: FC<LearnDeckProps> = ({ deck, deckProgress }) => {
    return <>
        {JSON.stringify(deck)}
    </>
}

export default LearnDeck;