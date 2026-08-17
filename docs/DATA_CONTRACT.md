# Data contract

Everything the frontend renders comes from static files under `data/`, published
alongside the site. This file is the single source of truth for their shape. The
frontend, the validator, and the audio generator all encode this contract, so a
change here is a change in three places.

## Layout

```
data/
├── manifest.json            # index of decks — the only file fetched on first load
├── decks/
│   └── <deckId>.json        # one deck, all its words
└── audio/
    ├── index.json           # spoken-text -> audio file lookup
    └── <locale>/
        └── <sha1>.ogg       # Opus-in-Ogg, mono, speech-tuned bitrate
```

`data/` is copied to `dist/data` at build time (`frontend/scripts/postbuild.mjs`),
so in production these live at `https://flashcards.nomomon.xyz/data/...` and in
dev at `http://localhost:5173/data/...`. The frontend resolves the base from
`import.meta.env.VITE_DATA_BASE_URL`, defaulting to `/data`.

## `manifest.json`

Fetched on every app start (network-first, `cache: "no-store"`), and the thing
that tells the app whether its cached decks are stale.

```json
{
  "schemaVersion": 1,
  "revision": "2026-08-17T12:00:00.000Z",
  "decks": [
    {
      "id": "dutch-1",
      "name": "Dutch",
      "color": "#FF4F00",
      "languages": {
        "front": { "label": "Dutch", "locale": "nl-NL" },
        "back": { "label": "English", "locale": "en-US" }
      },
      "wordCount": 210,
      "tags": ["introduction", "lesson-2"],
      "revision": "2026-08-17T12:00:00.000Z",
      "path": "decks/dutch-1.json"
    }
  ]
}
```

- `schemaVersion` — integer, currently `1`. Bumped only on breaking changes; the
  frontend refuses data it does not understand rather than guessing.
- `revision` — ISO-8601 UTC timestamp of the newest deck change. Top-level
  `revision` is the max of all deck revisions.
- `decks[].revision` — per-deck, so one deck changing does not invalidate the
  rest. This is the deck cache key.
- `decks[].path` — relative to `data/`. Never absolute, never `../`.
- `wordCount` and `tags` are denormalized so the overview screen renders fully
  from the manifest alone, without fetching any deck.

## `decks/<deckId>.json`

```json
{
  "schemaVersion": 1,
  "id": "dutch-1",
  "name": "Dutch",
  "color": "#FF4F00",
  "revision": "2026-08-17T12:00:00.000Z",
  "languages": {
    "front": { "label": "Dutch", "locale": "nl-NL" },
    "back": { "label": "English", "locale": "en-US" }
  },
  "words": [
    {
      "id": "ik",
      "front": "ik",
      "back": "I",
      "tags": ["introduction"]
    }
  ]
}
```

- `id` (deck) — must equal the filename stem and its `manifest.decks[].id`.
- `color` — `#RRGGBB`.
- `locale` — BCP-47 tag. Drives text-to-speech voice selection, so it must be
  present and real.
- `words[].id` — **stable, unique within the deck**, and the key user progress is
  stored under. Generated as a slug of `front` (lowercase, non-alphanumerics
  collapsed to `-`, trimmed), with `-2`, `-3`, … appended on collision. It is
  slugified `front` specifically so that progress saved by the previous
  Firestore-backed version (which keyed progress on the raw `front` string)
  remains recoverable. **Never renumber or reassign an existing word id** — that
  silently resets a learner's progress.
- `words[].tags` — may be empty, never absent.

## `audio/index.json`

One lookup table for every generated clip. Keyed by locale and text so the same
word shared across decks is voiced once.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-17T12:00:00.000Z",
  "voices": { "nl-NL": "Kore", "en-US": "Kore" },
  "clips": {
    "nl-NL:ik": {
      "path": "audio/nl-NL/8f2b1c9e4a.ogg",
      "bytes": 3412,
      "generatedAt": "2026-08-17T12:00:00.000Z"
    }
  }
}
```

- Clip key is exactly `` `${locale}:${text}` `` — the raw, unnormalized word
  text, so the frontend can build the key with no shared helper beyond string
  concatenation.
- `path` is relative to `data/`, matching `manifest.decks[].path`.
- Filename stem is `sha1(`${locale}:${text}`)` truncated to 10 hex chars. The
  hash makes generation idempotent: a word already present in `clips` with an
  existing file on disk is skipped, and a deleted file is regenerated.
- Audio is Opus in an Ogg container: mono, 24 kHz, ~16 kbps VBR. Roughly 2–5 KB
  per word, so a few thousand words stay well inside a Pages deployment.

## Invariants the validator enforces

1. Every `manifest.decks[]` entry has a matching file at its `path`, and vice
   versa — no orphan decks, no dangling entries.
2. Deck `id` equals filename stem equals manifest id.
3. `wordCount` and `tags` in the manifest match the deck file exactly.
4. Word ids are unique within a deck and match the slug rules.
5. Every `audio/index.json` clip path exists on disk, and every locale referenced
   by a clip key is used by some deck.
6. All `revision` values parse as ISO-8601, and the manifest's top-level
   `revision` equals the maximum deck revision.
