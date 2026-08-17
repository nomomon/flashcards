# flashcards

Flashcards for language learning, living at
**[flashcards.nomomon.xyz](https://flashcards.nomomon.xyz)**.

There is no backend. The app is a static React SPA on GitHub Pages, and the decks
are plain JSON files in this repo. Pronunciation audio is generated once by a
GitHub Actions workflow and committed next to the decks, so the running app never
calls an API and never needs a key.

## Layout

```
.
├── frontend/        Vite + React + TypeScript SPA (the whole app)
├── data/            decks, and generated audio — the "database"
│   ├── manifest.json
│   ├── decks/*.json
│   └── audio/
├── tools/
│   ├── data-tools/  validate decks, rebuild the manifest
│   └── audio-gen/   generate missing pronunciation audio via Gemini TTS
└── docs/
    ├── ARCHITECTURE.md   how the frontend is layered, and why
    └── DATA_CONTRACT.md  the exact shape of everything in data/
```

`data/` is copied into the build output, so the deployed site serves its own data
same-origin at `/data/...`. Editing a deck and pushing is the entire publishing
workflow.

## Getting started

Requires Node 20+ and [pnpm](https://pnpm.io) (the repo pins a version via
`packageManager`, so `corepack enable` is enough).

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

The dev server serves the repo's real `data/` folder at `/data`, so development
and production read data through identical URLs.

| Command              | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `pnpm dev`           | Frontend dev server                                     |
| `pnpm build`         | Type-check, build to `frontend/dist`, copy `data/` in    |
| `pnpm preview`       | Serve the production build locally                      |
| `pnpm check`         | Biome — format, lint and organize imports, with fixes    |
| `pnpm ci:check`      | Biome in CI mode (no writes)                             |
| `pnpm typecheck`     | `tsc --noEmit`                                           |
| `pnpm data:validate` | Check `data/` against the contract                       |
| `pnpm data:manifest` | Rebuild `data/manifest.json` from the deck files         |
| `pnpm data:audio`    | Generate missing pronunciation audio (needs a Gemini key)|

Biome replaces both Prettier and ESLint here; a Husky pre-commit hook runs it on
staged files.

## Adding or editing a deck

1. Edit or add a file under `data/decks/`, following
   [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md). Every word needs a stable
   `id` — **never** change or renumber an existing one, because that is the key a
   learner's saved progress is stored under.
2. Bump the deck's `revision` to the current UTC timestamp. That is what tells a
   browser its cached copy is stale.
3. `pnpm data:manifest && pnpm data:validate`.
4. Commit and push to `main`.

Pushing then does two things on its own: the site redeploys, and the audio
workflow generates clips for any words that do not have one yet and commits them
back. Deleting `data/audio/` and re-running the workflow repopulates it from
scratch.

## How progress is stored

Per-device, in `localStorage`, under `flashcards:progress:v1:<deckId>` — one
`known` flag and a seen-count per word. Nothing is uploaded and there are no
accounts, so progress does not follow you between devices. That is a deliberate
trade for having no backend to run.

Deck data fetched from the network is cached through TanStack Query and persisted
to `localStorage`, which is what lets the app open and work offline once a deck
has been visited.

## Deployment

`main` → GitHub Actions → GitHub Pages, on the custom domain
`flashcards.nomomon.xyz`. `frontend/public/CNAME` and the repo's Pages setting
both record that domain. The SPA is served with a `404.html` copy of
`index.html`, which is how client-side routes survive a hard refresh.

## Audio generation

`tools/audio-gen` asks Gemini TTS for each word it has not voiced yet, encodes
the result to Opus in Ogg (mono, ~16 kbps — a few KB per word) and records it in
`data/audio/index.json`. It is incremental and idempotent: existing clips are
skipped, missing files are regenerated, and clips whose text no longer appears in
any deck are pruned. Running it needs a `GEMINI_API_KEY`; the deployed app does
not. See [`tools/audio-gen/README.md`](tools/audio-gen/README.md).

## License

MIT
