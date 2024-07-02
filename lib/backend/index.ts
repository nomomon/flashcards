import { initializeApp } from "firebase/app";
import { CACHE_SIZE_UNLIMITED, persistentLocalCache } from "firebase/firestore";
import { collection, doc, getDoc, getDocs, initializeFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
    apiKey: "REDACTED_FIREBASE_WEB_API_KEY",
    authDomain: "learning-arabic-95ec9.firebaseapp.com",
    projectId: "learning-arabic-95ec9",
    storageBucket: "learning-arabic-95ec9.appspot.com",
    messagingSenderId: "593320075808",
    appId: "1:593320075808:web:a01917e758cf40ff391245",
    measurementId: "G-N6864P4G7H",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { //@ts-ignore
    localCache: persistentLocalCache({}),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

export async function getDecks() {
    const decksCol = collection(db, "decks");
    const deckSnapshot = await getDocs(decksCol);
    const deckList = deckSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));
    return deckList;
}

export async function getDeck(deckId: string) {
    const decksCol = collection(db, "decks");
    const deckDoc = await getDoc(doc(decksCol, deckId));
    if (deckDoc.exists()) {
        return {
            id: deckDoc.id,
            ...deckDoc.data()
        } as Deck;
    } else {
        throw new Error("Deck not found");
    }
}