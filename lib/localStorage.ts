import { toast } from "@/components/ui/use-toast";
import { Deck } from "./interfaces/Deck";
import { DeckProgress } from "./interfaces/DeckProgress";

export const getProgress = (deckId: Deck["id"]) => {
  return JSON.parse(localStorage.getItem(`progress_${deckId}`) || "{}");
};

export const saveProgress = (
  deckId: Deck["id"],
  wordId: string,
  progress: 0 | 1,
) => {
  const key = `progress_${deckId}`;
  const currentProgress = getProgress(deckId);
  currentProgress[wordId] = progress;
  localStorage.setItem(key, JSON.stringify(currentProgress));
};

export const clearProgress = (deckId: string) => {
  localStorage.setItem(`progress_${deckId}`, "{}");
};

export const countPositiveProgress = (deck: Deck, progress: DeckProgress) => {
  const includedWords = deck.words.map((word) => word.front);
  return Object.entries(progress).filter(
    ([k, v], i) => v == 1 && includedWords.includes(k),
  ).length;
};

export const wasLastUpdateToday = () => {
  try {
    const lastUpdateStr = localStorage.getItem("lastUpdate");
    if (!lastUpdateStr) {
      localStorage.setItem("lastUpdate", new Date().toISOString());
      return false;
    }
    const lastUpdate = new Date(lastUpdateStr);
    const today = new Date();
    localStorage.setItem("lastUpdate", today.toISOString());
    return lastUpdate.toDateString() === today.toDateString();
  } catch (e) {
    return false;
  }
};

export const forceUpdate = () => {
  try {
    localStorage.removeItem("lastUpdate");
  } catch (e) {
    toast({
      title: "Error: Failed to force update",
      description: JSON.stringify(e),
    });
  }
};
