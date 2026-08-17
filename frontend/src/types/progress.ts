/**
 * Learner progress. Local-only: it lives in localStorage, keyed by deck, and is
 * never sent anywhere. `words` is keyed by `Word.id`.
 */

export interface WordProgress {
  known: boolean;
  seenCount: number;
  updatedAt: string;
}

export interface DeckProgress {
  deckId: string;
  updatedAt: string;
  words: Record<string, WordProgress>;
}
