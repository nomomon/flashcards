#!/usr/bin/env node

// Regenerates data/manifest.json from data/decks/*.json.
//
//   node src/build-manifest.mjs
//
// Every manifest field is derived from the deck files, so running this twice in
// a row is a no-op. Run it after any deck edit; CI validation fails otherwise.

import { collectTags, loadDecks } from "./decks.mjs";
import { writeJsonIfChanged } from "./json.mjs";
import { MANIFEST_PATH, rel } from "./paths.mjs";

export function buildManifest(loaded) {
  const decks = loaded.map(({ stem, deck }) => ({
    id: deck.id,
    name: deck.name,
    color: deck.color,
    languages: deck.languages,
    wordCount: (deck.words ?? []).length,
    tags: collectTags(deck),
    revision: deck.revision,
    path: `decks/${stem}.json`,
  }));

  // Top-level revision is the newest deck revision.
  const revision = decks
    .map((entry) => entry.revision)
    .filter((value) => typeof value === "string")
    .sort()
    .at(-1);

  return { schemaVersion: 1, revision, decks };
}

function main() {
  const loaded = loadDecks();
  if (loaded.length === 0) {
    console.error("no deck files found under data/decks — nothing to do");
    process.exit(1);
  }

  const manifest = buildManifest(loaded);
  const changed = writeJsonIfChanged(MANIFEST_PATH, manifest);

  console.log(`${changed ? "wrote" : "unchanged"}: ${rel(MANIFEST_PATH)}`);
  for (const entry of manifest.decks) {
    console.log(
      `  ${entry.id}: ${entry.wordCount} words, ${entry.tags.length} tags, revision ${entry.revision}`,
    );
  }
  console.log(`manifest revision: ${manifest.revision}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
