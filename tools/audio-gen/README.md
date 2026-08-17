# @flashcards/audio-gen

Generates the spoken audio for every word in every deck: Gemini text-to-speech
in, Opus-in-Ogg files under `data/audio/` plus a lookup table at
`data/audio/index.json` out. Zero npm dependencies: plain `.mjs` on Node >= 20
built-ins, `fetch`, and `ffmpeg` on `PATH`.

The file layout and the index shape are fixed by
[`docs/DATA_CONTRACT.md`](../../docs/DATA_CONTRACT.md); this package is one of
the three places that encode that contract.

## What it does

For every word it needs two clips: the `front` text spoken in the deck's
`languages.front.locale`, and the `back` text in `languages.back.locale`. Clips
are deduplicated across all decks by the `` `${locale}:${text}` `` key, so a word
that appears in three decks is voiced once. The filename is
`sha1(key)` truncated to 10 hex characters, which is what makes the whole thing
idempotent.

Runs are **incremental**. A clip is generated only when:

- its key is absent from `data/audio/index.json`, or
- its file is missing from disk, or
- `--force` was passed.

So adding words to a deck generates only the new words, and deleting
`data/audio/` entirely and rerunning repopulates everything from scratch.

Clips whose text no longer appears in any deck are pruned, file and index entry
together, but only after a run that generated everything it set out to generate.
A partial failure, a `--deck` filter, or a `--limit` cap all suppress pruning, so
a bad run can never delete good audio.

## Getting an API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and create an API
   key.
2. Export it locally:

   ```sh
   export GEMINI_API_KEY=...
   ```

3. For CI, add it as the repository secret `GEMINI_API_KEY` (Settings → Secrets
   and variables → Actions). The `audio.yml` workflow skips itself with a warning
   rather than failing when the secret is absent.

The key is only ever sent in the `x-goog-api-key` request header, never in a URL
and never logged.

## Running it

```sh
# See the plan without spending anything. No API key needed.
node tools/audio-gen/src/generate.mjs --dry-run

# Generate what is missing.
node tools/audio-gen/src/generate.mjs

# From this workspace
pnpm --filter @flashcards/audio-gen run generate
```

`ffmpeg` must be on `PATH` (`brew install ffmpeg` /
`sudo apt-get install -y ffmpeg`); the run stops with that message before making
any API call if it is missing.

### Flags

| Flag                | Effect                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `--dry-run`         | Print exactly what would be generated and pruned. Zero API calls, zero writes. |
| `--force`           | Regenerate every clip, ignoring the index.                                  |
| `--deck <id>`       | Restrict to one deck (manifest id). Suppresses pruning.                     |
| `--locales <a,b>`   | Only these locales, comma separated. Suppresses pruning.                     |
| `--limit <n>`       | Stop after generating `n` clips. Suppresses pruning. Good for a first smoke test. |
| `--concurrency <n>` | Clips in flight at once. Default 2, capped at 4.                            |
| `-h`, `--help`      | Usage.                                                                      |

A first careful run on a fresh deck:

```sh
node tools/audio-gen/src/generate.mjs --dry-run       # what am I about to do
node tools/audio-gen/src/generate.mjs --limit 5       # listen to five clips
node tools/audio-gen/src/generate.mjs                 # the rest
```

### Generating only the language you study

A deck has two sides, and the back side is usually the learner's own language.
For the Dutch/English deck that is 242 clips, of which 118 are English
pronunciation nobody is going to play:

```sh
node tools/audio-gen/src/generate.mjs --locales nl-NL
```

That roughly halves both the API cost and the bytes committed to the repo, and
it is the right choice if you never study back-to-front. Study sessions can run
back-to-front, though, in which case English is the prompt side and wants audio
too; then generate both:

```sh
node tools/audio-gen/src/generate.mjs --locales nl-NL,en-US   # same as omitting it
```

`--locales` never deletes anything. Clips outside the allowlist keep their files
and their index entries, because the flag also switches pruning off: with a
filtered view of the desired set, the pruner would read "not in scope" as
"delete". A locale no deck uses (a typo like `nl_NL`) fails the run rather than
quietly planning zero clips.

### Forcing a full repopulate

Either of these regenerates everything:

```sh
node tools/audio-gen/src/generate.mjs --force
# or, equivalently, throw the audio away and rebuild
rm -rf data/audio && node tools/audio-gen/src/generate.mjs
```

Both cost a full API call per clip. On CI, run the **Audio** workflow with
`force: true`.

## Voices

`voices.json` maps a locale to a Gemini prebuilt voice:

```json
{
  "nl-NL": "Kore",
  "en-US": "Kore"
}
```

Lookup is exact locale first (`nl-NL`), then the bare language (`nl`), then the
default `Kore`, so one entry can cover every region of a language. The file is
optional; without it everything uses `Kore`.

The voice actually used per locale is recorded in the index's `voices` map.
Changing a voice does **not** invalidate existing clips; rerun with `--force`
(or delete that locale's directory) so the recorded voice and the audio on disk
cannot drift apart.

## Cost and rate limits

Every generated clip is one `gemini-2.5-flash-preview-tts` request, so a
250-word deck is ~500 requests on first population and ~0 thereafter. That is
why the index exists and why the default concurrency is 2.

- 429 and 5xx responses are retried with exponential backoff (1s, 2s, 4s, …
  capped at 30s, 5 attempts), honouring `Retry-After` when present.
- Free-tier quotas on preview models are low and change without notice. If you
  hit a wall of 429s, let the backoff work or split the job with `--limit`.
- Any clip that ultimately fails makes the run exit non-zero, and pruning is
  skipped for that run.

Clips land at roughly 1 to 5 KB each (mono, ~16 kbps VBR, `-application voip`), so
a few thousand words stay comfortably inside a GitHub Pages deployment.

## Notes for the next person

- **The Gemini response is headerless PCM.** `inlineData.data` is base64 raw
  signed 16-bit little-endian mono PCM with no WAV header, and the sample rate
  only appears in `inlineData.mimeType`
  (`audio/L16;codec=pcm;rate=24000`). It is parsed from there rather than
  assumed, and handed to ffmpeg as `-f s16le -ar <rate> -ac 1`. Feeding it to
  ffmpeg without `-f s16le` produces either an error or noise.
- **`ffprobe` reports 48000 Hz on the output.** That is normal: an Ogg Opus
  stream always advertises 48 kHz regardless of the encoder's internal rate.
  `-ar 24000` still does its job of narrowing the encoded band.
- `data/audio/index.json` is rewritten atomically (temp file plus rename) and
  only when something changed, so repeat runs produce no diff and no empty
  commit.
- `FLASHCARDS_DATA_DIR` points the generator at a scratch copy of `data/`. Only
  useful for testing the generator itself.
