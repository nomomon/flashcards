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
   ├── stats/      what the day buckets mean, and how they are drawn
   └── study/      running a study session
   ↓
components/        rich-text.tsx, plus ui/ design-system primitives
                   (domain-free, vendored from shadcn)
   ↓
lib/               the only layer that talks to the network or localStorage
   ├── data/       remote deck data: fetch, parse TSV, validate, cache
   ├── markup/     the inline-formatting parser and its plain-text projection
   ├── progress/   local learner progress: read, write, cache
   ├── stats/      local study statistics: day buckets, and the clock
   ├── audio/      speech-synthesis playback
   └── query/      TanStack Query client + persistence wiring
   ↓
types/             plain interfaces, zero runtime code
```

`build-info.ts` sits outside these layers: it exposes the commit the bundle was
built from, injected by `vite.config.ts`. See "Identifying a build" below.

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

`types/stats.ts`

```ts
export interface DayStats {
  ms: number;
  correct: number;
  incorrect: number;
}

export interface StudyStats {
  schemaVersion: number;
  /** Keyed by local calendar day, `YYYY-MM-DD`. */
  days: Record<string, DayStats>;
}
```

`types/session.ts`

```ts
/** Which side of the card is shown first, and whether both directions drill. */
export type StudyDirection = "front-to-back" | "back-to-front" | "both";
```

## `lib/data/` — remote deck data

`schemas.ts` exports zod schemas mirroring `types/deck.ts`
(`manifestSchema`, `deckSchema`). Fetched JSON is always
parsed through these: bad data fails loudly at the boundary instead of crashing
three components deep.

`source.ts`

```ts
export const DATA_BASE_URL: string; // VITE_DATA_BASE_URL ?? "/data"
export function dataUrl(relativePath: string): string;
export function fetchManifest(): Promise<Manifest>; // cache: "no-store"
export function fetchDeck(summary: Pick<DeckSummary, "path">): Promise<Deck>;
```

`queries.ts` — query keys and options factories, plus thin hooks.

```ts
export const dataKeys = {
  manifest: ["data", "manifest"] as const,
  deck: (deckId: string, revision: string) =>
    ["data", "deck", deckId, revision] as const,
};

export function manifestQueryOptions(): UseQueryOptions<Manifest>;
export function deckQueryOptions(summary: DeckSummary): UseQueryOptions<Deck>;

export function useManifest(): UseQueryResult<Manifest>;
/** Resolves the summary from the manifest, then the deck. */
export function useDeck(deckId: string): UseQueryResult<Deck>;
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

## `lib/stats/` - local study statistics

The same shape as `lib/progress/`, for a different question: progress is the
*state* of each word, statistics are a *count of what happened*. They are
separate stores, and neither knows the other exists.

Storage key: `flashcards:stats:v1`, holding one bucket per local calendar day.

```ts
export function readStats(): StudyStats;
export function writeStats(stats: StudyStats): void;
export function clearStats(): void;
export function dayKey(date: Date): string; // local, not UTC
export function addTime(stats: StudyStats, ms: number, date?: Date): StudyStats;
export function addAnswer(stats: StudyStats, known: boolean, date?: Date): StudyStats;

export function useStats(): UseQueryResult<StudyStats>;
export function useRecordAnswer(): UseMutationResult<StudyStats, Error, { known: boolean }>;
export function useRecordTime(): UseMutationResult<StudyStats, Error, { ms: number }>;
export function useResetStats(): UseMutationResult<StudyStats, Error, void>;

/** Mounted once, in the root layout. */
export function useTimeOnTask(): void;
```

Three rules define the store, and they are why this is not a few more fields on
`DeckProgress`:

- **Aggregates only.** A day holds milliseconds and two verdict counts. Nothing
  is keyed by word, so the record cannot become a second, weaker copy of
  progress - and unlike progress, a per-answer log would grow forever.
- **Local calendar days.** Every figure on the page is a sum or a ratio over
  whole days, and a streak has to agree with the calendar the learner is looking
  at, so `dayKey` is built from local date parts rather than `toISOString()`.
- **Bounded.** Writes prune to the most recent 400 days.

`use-time-on-task.ts` is the only clock. It counts only while the tab is
visible and within 90 seconds of the last interaction, and caps each tick's
contribution to twice the tick interval, so a throttled timer or an overnight
tab cannot inflate the figure. It is mounted at the root, which is what makes
"time studied" mean time in the app rather than time on the study screen.

Answers are tallied in `StudyRunner`'s `handleRate` rather than inside
`useRateWord`. That keeps the two stores independent, and `handleRate` is
already the single place a verdict is decided, so no rating can take a path that
misses it.

## `lib/query/` — client and persistence

`client.ts` exports `createQueryClient()`. `provider.tsx` exports
`<AppQueryProvider>`, wrapping `PersistQueryClientProvider` with a
`createSyncStoragePersister` over localStorage under key `flashcards:query:v1`.

Persistence is what lets the app open offline with the decks it already had.
Only `data` queries are persisted (`dehydrateOptions.shouldDehydrateQuery`);
`progress` queries are not, since localStorage already owns that state and
persisting it would create two writers for one fact.

## `lib/markup/` — inline formatting

Card text may carry a tiny inline-markdown subset (`**bold**`, `*italic*`,
`__underline__`); `docs/DATA_CONTRACT.md` is the authority on the syntax.

```ts
export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong" | "em" | "underline"; children: InlineNode[] };

export function parseInline(text: string): InlineNode[];
export function stripFormatting(text: string): string;
```

Two rules make this safe rather than a liability:

1. **Parsing never throws, and never rejects.** Unbalanced or unrecognized
   delimiters become literal text. A deck is written by a human or an AI and
   pushed without review, so malformed markup must degrade to something readable
   rather than break a card mid-session.
2. **The output is React elements, never HTML.** `<RichText>` maps nodes to
   `<strong>`/`<em>`/`<u>`; nothing reaches `dangerouslySetInnerHTML`. Since a
   workflow can write these strings, treating them as markup-to-parse instead of
   HTML-to-sanitize removes the injection question entirely instead of answering
   it.

`stripFormatting` is the plain-text projection, and it is load-bearing in two
places: the text sent to speech synthesis, and `aria-label`s. It is reimplemented
in `tools/data-tools` (a zero-dependency workspace that cannot import from here),
so the two copies must agree exactly — a disagreement means a deck passes
validation and then renders its own delimiters.

## `lib/audio/` — playback

```ts
export function useSpeak(): {
  speak: (text: string, locale: string) => void;
  isPlaying: boolean;
  isAvailable: (text: string, locale: string) => boolean;
};
```

Speaks the card text through the Web Speech API, using the first voice matching
the locale (exact tag first, then the language subtag). When the device has no
such voice it no-ops, and `isAvailable` lets the caller hide the button rather
than offer one that does nothing — a missing voice is never an error surfaced to
the learner.

Pronunciation used to come from clips pre-generated by a Gemini TTS workflow and
committed under `data/audio/`. That whole pipeline was removed: the browser's own
synthesis covers the same need without a key, a workflow that writes back to the
repo, or a fourth copy of `stripFormatting` to keep in sync.

## `routes/` — URL as state

Code-based TanStack Router route tree (no codegen). Two routes:

| Path    | Search params                                                                         |
| ------- | ------------------------------------------------------------------------------------- |
| `/`     | none                                                                                  |
| `/stats`| none                                                                                  |
| `/deck` | `deckId: string`, `tags?: string[]`, `direction: StudyDirection` (default front-to-back) |

`/` and `/stats` are siblings sharing the header and tab bar in
`routes/main-tabs.tsx` - real navigation rather than a panel, so the back button
works between them and a glance at the numbers is a link. That file sits in
`routes/` because it is page composition that knows the route tree and nothing
about decks or statistics; a feature folder holding one navigation component
would exist to satisfy a rule rather than to hold a domain.

Search params are validated with zod in `validateSearch`, so a hand-edited URL
produces a typed default rather than a runtime crash. Study options live in the
URL, not component state, so a session survives a refresh and can be linked.

## Identifying a build

`package.json`'s `version` is not bumped per commit and carries no meaning here.
Nobody installs this app by version number, so a hand-maintained semver would be
decoration that can quietly disagree with what is actually deployed.

Instead `vite.config.ts` injects the commit at build time (`GITHUB_SHA` in CI,
`git rev-parse` locally, `"unknown"` when neither is available), and
`build-info.ts` exposes it. A footer renders it on every route, linked to the
commit on GitHub. That makes "is the live site the code I think it is?" a
question you answer by looking, not by trusting a number someone remembered to
increment.

Deck data versions itself separately and for a different reason: each deck's
`revision` is a content hash of its bank file, which is what drives cache
invalidation. See `docs/DATA_CONTRACT.md`.
