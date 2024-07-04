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

export const countPositiveProgress = (progress: DeckProgress) => {
  return Object.values(progress).filter((p) => p === 1).length;
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
