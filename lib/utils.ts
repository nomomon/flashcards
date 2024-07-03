import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}


export const getProgress = (deckId: Deck["id"]) => {
    return JSON.parse(localStorage.getItem(`progress_${deckId}`) || "{}");
}

export const saveProgress = (deckId: Deck["id"], wordId: string, progress: 0 | 1) => {
    const key = `progress_${deckId}`;
    const currentProgress = getProgress(deckId);
    currentProgress[wordId] = progress;
    localStorage.setItem(key, JSON.stringify(currentProgress));
}

export const clearProgress = (deckId: string) => {
    localStorage.setItem(`progress_${deckId}`, "{}");
}

export const countPositiveProgress = (progress: DeckProgress) => {
    return Object.values(progress).filter(p => p === 1).length;
}