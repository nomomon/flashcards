#!/usr/bin/env node
// One-off, idempotent migration of a legacy deck file to schemaVersion 1.
//
//   node src/migrate-deck.mjs [deckPath] [--revision <iso>]
//
// Legacy shape: { id, name, color, languages: { front: "Dutch", back: "English" },
//                 words: [{ front, back, tags }] }
// Target shape: docs/DATA_CONTRACT.md "decks/<deckId>.json".
//
// Word order, `front`, `back` and `tags` are carried over untouched; the only
// additions are schemaVersion, revision, locale-bearing languages, and word ids.

import path from "node:path";
import { readJson, writeJsonIfChanged } from "./json.mjs";
import { DECKS_DIR, rel } from "./paths.mjs";
import { assignWordIds } from "./slug.mjs";

const DEFAULT_REVISION = "2026-08-17T00:00:00.000Z";

// Label -> BCP-47 locale for the labels the legacy decks use.
const LOCALE_BY_LABEL = {
  Dutch: "nl-NL",
  English: "en-US",
};

function normalizeLanguage(value, side) {
  if (value && typeof value === "object") {
    if (!value.label || !value.locale) {
      throw new Error(`languages.${side} is missing label or locale`);
    }
    return { label: value.label, locale: value.locale };
  }
  const label = String(value ?? "");
  const locale = LOCALE_BY_LABEL[label];
  if (!locale) {
    throw new Error(
      `no known locale for language label "${label}" (side: ${side}); add it to LOCALE_BY_LABEL`,
    );
  }
  return { label, locale };
}

export function migrateDeck(legacy, { revision = DEFAULT_REVISION } = {}) {
  if (!Array.isArray(legacy.words)) throw new Error("deck has no words array");

  return {
    schemaVersion: 1,
    id: legacy.id,
    name: legacy.name,
    color: legacy.color,
    revision: legacy.revision ?? revision,
    languages: {
      front: normalizeLanguage(legacy.languages?.front, "front"),
      back: normalizeLanguage(legacy.languages?.back, "back"),
    },
    words: assignWordIds(legacy.words).map((word) => ({
      id: word.id,
      front: word.front,
      back: word.back,
      tags: Array.isArray(word.tags) ? [...word.tags] : [],
    })),
  };
}

function main(argv) {
  const args = argv.slice(2);
  const revisionFlag = args.indexOf("--revision");
  let revision = DEFAULT_REVISION;
  if (revisionFlag !== -1) {
    revision = args[revisionFlag + 1];
    args.splice(revisionFlag, 2);
  }
  const deckPath = args[0]
    ? path.resolve(process.cwd(), args[0])
    : path.join(DECKS_DIR, "dutch-1.json");

  const legacy = readJson(deckPath);
  const migrated = migrateDeck(legacy, { revision });
  const changed = writeJsonIfChanged(deckPath, migrated);

  console.log(
    `${changed ? "migrated" : "already current"}: ${rel(deckPath)} ` +
      `(${migrated.words.length} words, revision ${migrated.revision})`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv);
