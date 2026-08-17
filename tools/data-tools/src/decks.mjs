import fs from "node:fs";
import path from "node:path";
import { readJson } from "./json.mjs";
import { DECKS_DIR } from "./paths.mjs";

/** Absolute paths of every deck file, sorted by filename stem. */
export function listDeckFiles() {
  if (!fs.existsSync(DECKS_DIR)) return [];
  return fs
    .readdirSync(DECKS_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(DECKS_DIR, name));
}

/** Loads every deck as { file, stem, deck }. */
export function loadDecks() {
  return listDeckFiles().map((file) => ({
    file,
    stem: path.basename(file, ".json"),
    deck: readJson(file),
  }));
}

/** Sorted unique tags across a deck's words. */
export function collectTags(deck) {
  const tags = new Set();
  for (const word of deck.words ?? []) {
    for (const tag of word.tags ?? []) tags.add(tag);
  }
  return [...tags].sort();
}
