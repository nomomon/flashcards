// create Arabic deck

import { updateDeck } from "..";

const deck: Deck = {
    id: "an-naas",
    name: "Surah An Naas",
    color: "#228C22",
    words: [{
        front: "قَالَ",
        back: "say; speak"
    }, {
        front: "عَاذَ",
        back: "seek refuge/protection"
    }, {
        front: "رَبَّ",
        back: "Lord, Master, Owner"
    }, {
        front: "النَّاسُ",
        back: "mankind"
    }
    ],
};

updateDeck(deck);
