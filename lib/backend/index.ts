import { initializeApp } from "firebase/app";
import {
  getDocFromCache,
  persistentLocalCache,
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  getDocsFromCache,
  setDoc,
} from "firebase/firestore";
import { Deck } from "../interfaces/Deck";
import { isBrowser } from "../utils";

const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_WEB_API_KEY",
  authDomain: "learning-flashcards.firebaseapp.com",
  projectId: "learning-flashcards",
  storageBucket: "learning-flashcards.firebasestorage.app",
  messagingSenderId: "848972481460",
  appId: "1:848972481460:web:6bd7bec44bb71d713a28e1",
  measurementId: "G-2S3K85FW9V",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: isBrowser() ? persistentLocalCache({}) : undefined,
});

export async function getDecks(useCache: boolean = true) {
  const decksCol = collection(db, "decks");
  const deckSnapshot = await (useCache ? getDocsFromCache : getDocs)(decksCol);
  const deckList = deckSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return deckList;
}

export async function getDeck(deckId: string) {
  const decksCol = collection(db, "decks");
  const deckDoc = await getDocFromCache(doc(decksCol, deckId)).catch(() =>
    getDoc(doc(decksCol, deckId)),
  );
  if (deckDoc.exists()) {
    return {
      id: deckDoc.id,
      ...deckDoc.data(),
    } as Deck;
  } else {
    throw new Error("Deck not found");
  }
}

export async function updateDeck(deck: Deck) {
  const decksCol = collection(db, "decks");
  const newDeck = await setDoc(doc(decksCol, deck.id), deck);
  return newDeck;
}
