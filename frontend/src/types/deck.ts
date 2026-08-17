/**
 * Shapes of the static files under `data/`. See `docs/DATA_CONTRACT.md` - this
 * file and the zod schemas in `lib/data/schemas.ts` are two encodings of that
 * contract, and these interfaces are the source of truth for the app's types.
 */

export interface LanguageInfo {
  label: string;
  locale: string;
}

export interface DeckLanguages {
  front: LanguageInfo;
  back: LanguageInfo;
}

export interface Word {
  id: string;
  front: string;
  back: string;
  tags: string[];
}

export interface Deck {
  schemaVersion: number;
  id: string;
  name: string;
  color: string;
  revision: string;
  languages: DeckLanguages;
  words: Word[];
}

export interface DeckSummary {
  id: string;
  name: string;
  color: string;
  languages: DeckLanguages;
  wordCount: number;
  tags: string[];
  revision: string;
  path: string;
}

export interface Manifest {
  schemaVersion: number;
  revision: string;
  decks: DeckSummary[];
}

export interface AudioClip {
  path: string;
  bytes: number;
  generatedAt: string;
}

export interface AudioIndex {
  schemaVersion: number;
  generatedAt: string;
  voices: Record<string, string>;
  clips: Record<string, AudioClip>;
}
