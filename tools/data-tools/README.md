# @flashcards/data-tools

Zero-dependency Node scripts (ESM, Node >= 20 built-ins only) that build and
check the static payload under `data/`. The shape they enforce is defined in
[`docs/DATA_CONTRACT.md`](../../docs/DATA_CONTRACT.md).

All paths are resolved from the scripts' own location, so the commands work from
any working directory.

## Commands

| Command            | What it does                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `npm run manifest` | Regenerates `data/manifest.json` from `data/decks/*.json`. Idempotent.     |
| `npm run validate` | Checks `data/` against all six contract invariants. Exits 1 on any problem. |

Or directly, from anywhere:

```sh
node tools/data-tools/src/build-manifest.mjs
node tools/data-tools/src/validate.mjs
```

## When to run them

- **After editing any deck** — run `manifest`, then `validate`. The manifest
  denormalizes `wordCount`, `tags` and `revision`, so an edited deck without a
  rebuilt manifest fails validation.
- **After bumping a deck's `revision`** — same: rebuild the manifest, since its
  top-level `revision` is the max of all deck revisions.
- **In CI, on every push** — `validate` only. It never writes, and its failure
  output lists every problem grouped by invariant.

`validate` also checks `data/audio/index.json`: clip files must exist on disk
with matching byte sizes, and every locale in a clip key or in `voices` must be
one some deck actually uses. An index with empty `voices` and `clips` is valid.

## Word ids

`src/slug.mjs` is the single implementation of the id rules: lowercase `front`,
any run of non-`[a-z0-9]` collapsed to one `-`, trimmed, empty falling back to
`word`, and `-2`, `-3`, … appended on collision in document order.

Word ids are the key user progress is stored under. **Never renumber or reassign
an existing id.** For that reason `validate` accepts any `-N` (N >= 2) suffix on
the correct base slug rather than demanding the numbering a fresh pass would
produce, so reordering or inserting words does not force an id churn.

## One-off migration

`src/migrate-deck.mjs` upgrades a legacy deck (`languages` as bare strings, no
`schemaVersion`/`revision`, no word ids) to the current schema in place:

```sh
node tools/data-tools/src/migrate-deck.mjs [deckPath] [--revision <iso>]
```

It is idempotent and preserves word order, `front`, `back` and `tags` verbatim.
It only knows locales for the language labels listed in `LOCALE_BY_LABEL`; add
new labels there rather than editing decks by hand.
