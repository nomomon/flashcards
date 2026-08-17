# Frontend architecture

A Vite + React SPA. No server, no SSR, no build-time data coupling: the app is a
static bundle that fetches `data/` at runtime. See `DATA_CONTRACT.md` for the
shape of that data.

## Layering

The rule that keeps this honest: **dependencies point downward only.**

```
routes/            URL shape, search-param validation, page composition
   ↓
features/          domain UI, grouped by the thing it serves
   ├── decks/      browsing, previewing and configuring a deck
   └── study/      running a study session
   ↓
components/ui/     design-system primitives. Domain-free, vendored from shadcn.
   ↓
lib/               the only layer that talks to the network or localStorage
   ├── data/       remote deck data: fetch, validate, cache
   ├── progress/   local learner progress: read, write, cache
   ├── audio/      clip playback
   └── query/      TanStack Query client + persistence wiring
   ↓
types/             plain interfaces, zero runtime code
```

A component that fetches, or a `lib` module that imports a component, is a layer
violation. The previous version leaked all three ways — pages called Firestore
directly, `localStorage.ts` imported a toast component, and progress was read
during render — which is what this refactor exists to fix.

### Why features, not atomic design

An earlier attempt at atomic design left a single `components/templates/` folder
holding everything, which is the usual outcome: atoms/molecules/organisms sorts
components by *size*, and size is a judgement call that changes every time a
component grows a second button. Nobody can answer "is this a molecule?" twice
the same way, so everything drifts into the widest bucket.

This tree sorts by *purpose*, which is stable:

- `components/ui/` — knows nothing about flashcards. A `Button` here would be at
  home in any app. shadcn regenerates these files, so they are treated as
  vendored and excluded from linting.
- `features/<domain>/` — knows about decks and study sessions, and is colocated
  with the feature it serves. When a feature dies, one folder is deleted.

The test for where a file goes is "would this make sense in a different app?" —
yes means `components/ui/`, no means `features/`. A component used by two
features moves down to `components/ui/` only once it has been made domain-free;
otherwise it stays in the feature that owns the concept and is imported directly.
Nesting deeper than `features/<domain>/<component>.tsx` is not worth it at this
size.

## `types/` — plain types, no runtime

`types/deck.ts`

```ts
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
```

`types/progress.ts`

```ts
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
```

`types/session.ts`

```ts
/** Which side of the card is shown first, and whether both directions drill. */
export type StudyDirection = "front-to-back" | "back-to-front" | "both";
```

## `lib/data/` — remote deck data

`schemas.ts` exports zod schemas mirroring `types/deck.ts`
(`manifestSchema`, `deckSchema`, `audioIndexSchema`). Fetched JSON is always
parsed through these: bad data fails loudly at the boundary instead of crashing
three components deep.

`source.ts`

```ts
export const DATA_BASE_URL: string; // VITE_DATA_BASE_URL ?? "/data"
export function dataUrl(relativePath: string): string;
export function fetchManifest(): Promise<Manifest>; // cache: "no-store"
export function fetchDeck(summary: Pick<DeckSummary, "path">): Promise<Deck>;
export function fetchAudioIndex(): Promise<AudioIndex>;
```

`queries.ts` — query keys and options factories, plus thin hooks.

```ts
export const dataKeys = {
  manifest: ["data", "manifest"] as const,
  deck: (deckId: string, revision: string) =>
    ["data", "deck", deckId, revision] as const,
  audioIndex: ["data", "audio-index"] as const,
};

export function manifestQueryOptions(): UseQueryOptions<Manifest>;
export function deckQueryOptions(summary: DeckSummary): UseQueryOptions<Deck>;
export function audioIndexQueryOptions(): UseQueryOptions<AudioIndex>;

export function useManifest(): UseQueryResult<Manifest>;
/** Resolves the summary from the manifest, then the deck. */
export function useDeck(deckId: string): UseQueryResult<Deck>;
export function useAudioIndex(): UseQueryResult<AudioIndex>;
/** Refetches the manifest and drops stale deck caches. */
export function useSyncData(): UseMutationResult<Manifest, Error, void, unknown>;
```

The deck query key includes `revision`, so a deck edit produces a new key and the
old entry is garbage-collected — that is the whole sync mechanism. Decks get a
long `staleTime` (they are immutable at a given revision); the manifest is always
refetched on mount.

## `lib/progress/` — local learner progress

localStorage is the store; TanStack Query is the read/notify layer, so progress
updates re-render the same way remote data does.

`store.ts` — pure, synchronous, no React.

```ts
export function readDeckProgress(deckId: string): DeckProgress;
export function writeDeckProgress(p: DeckProgress): void;
export function clearDeckProgress(deckId: string): void;
export function countKnown(deck: Deck, progress: DeckProgress): number;
```

Storage key: `flashcards:progress:v1:<deckId>`. Reads never throw — a corrupt or
unavailable store yields empty progress, because losing progress must not brick
the app. On first read for a deck, a legacy `progress_<deckId>` entry (raw
`{ [front]: 0 | 1 }` from the Firestore version) is migrated in, keyed by word id
— which is why word ids are slugified `front`.

`queries.ts`

```ts
export const progressKeys = {
  deck: (deckId: string) => ["progress", deckId] as const,
};
export function useDeckProgress(deckId: string): UseQueryResult<DeckProgress>;
export function useRateWord(
  deckId: string,
): UseMutationResult<DeckProgress, Error, { wordId: string; known: boolean }>;
export function useResetDeckProgress(
  deckId: string,
): UseMutationResult<DeckProgress, Error, void>;
```

## `lib/query/` — client and persistence

`client.ts` exports `createQueryClient()`. `provider.tsx` exports
`<AppQueryProvider>`, wrapping `PersistQueryClientProvider` with a
`createSyncStoragePersister` over localStorage under key `flashcards:query:v1`.

Persistence is what lets the app open offline with the decks it already had.
Only `data` queries are persisted (`dehydrateOptions.shouldDehydrateQuery`);
`progress` queries are not, since localStorage already owns that state and
persisting it would create two writers for one fact.

## `lib/audio/` — playback

```ts
export function useSpeak(): {
  speak: (text: string, locale: string) => void;
  isPlaying: boolean;
  isAvailable: (text: string, locale: string) => boolean;
};
```

Looks up `` `${locale}:${text}` `` in the audio index and plays
`dataUrl(clip.path)` through a single reused `Audio` element. When a clip is
missing it falls back to the Web Speech API if the browser has a matching voice,
and otherwise no-ops — a missing clip is never an error surfaced to the learner.

## `routes/` — URL as state

Code-based TanStack Router route tree (no codegen). Two routes:

| Path    | Search params                                                                         |
| ------- | ------------------------------------------------------------------------------------- |
| `/`     | none                                                                                  |
| `/deck` | `deckId: string`, `tags?: string[]`, `direction: StudyDirection` (default front-to-back) |

Search params are validated with zod in `validateSearch`, so a hand-edited URL
produces a typed default rather than a runtime crash. Study options live in the
URL, not component state, so a session survives a refresh and can be linked.
