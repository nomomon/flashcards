#!/usr/bin/env node

// Regenerates data/manifest.json from data/library.json + data/banks/*.tsv.
//
//   node src/build-manifest.mjs        (or: pnpm data:manifest)
//
// The manifest is a PURE FUNCTION of the authored files: no clock, no
// environment, no ordering surprises. Running it twice produces byte-identical
// output, which is what lets validate.mjs (and CI) assert that the committed
// manifest is exactly what the current inputs produce.

import crypto from "node:crypto";
import { serializeJson, writeJsonIfChanged } from "./json.mjs";
import {
  collectTags,
  loadBank,
  loadLibrary,
  SCHEMA_VERSION,
} from "./library.mjs";
import { MANIFEST_PATH, rel } from "./paths.mjs";

/**
 * Top-level revision: sha256 over each deck's `id` and `revision`, in id order,
 * as `${id}:${revision}\n` lines. Deck *order* in library.json therefore does
 * not affect it — only which decks exist and what they contain.
 * @param {Array<{id: string, revision: string}>} decks
 */
export function libraryRevision(decks) {
  const payload = [...decks]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((deck) => `${deck.id}:${deck.revision}\n`)
    .join("");
  return crypto
    .createHash("sha256")
    .update(payload, "utf8")
    .digest("hex")
    .slice(0, 12);
}

/**
 * Builds the manifest object from the authored files.
 *
 * Deck entries keep library.json's authored order (that is the order the app
 * lists decks in); only the revision hash is order-independent.
 *
 * @returns {{manifest: object, banks: Array<ReturnType<typeof loadBank>>}}
 */
export function buildManifest() {
  const library = loadLibrary();
  if (!Array.isArray(library?.decks)) {
    throw new Error("data/library.json: decks must be an array");
  }

  const banks = [];
  const decks = library.decks.map((deck) => {
    if (typeof deck?.bank !== "string" || deck.bank === "") {
      throw new Error(
        `data/library.json: deck ${JSON.stringify(deck?.id)} has no bank path`,
      );
    }
    let bank;
    try {
      bank = loadBank(deck.bank);
    } catch (error) {
      throw new Error(`cannot read data/${deck.bank}: ${error.message}`);
    }
    banks.push(bank);

    return {
      id: deck.id,
      name: deck.name,
      color: deck.color,
      languages: deck.languages,
      // `icon` is optional. Spread it in so an absent icon produces NO key at
      // all: invariant 6 compares bytes, and `"icon": null` is not the same file
      // as no icon. Its validity is the frontend's business — an unknown name
      // falls back to the default icon rather than failing the build.
      ...(deck.icon === undefined ? {} : { icon: deck.icon }),
      wordCount: bank.words.length,
      tags: collectTags(bank.words),
      revision: bank.revision,
      bank: deck.bank,
    };
  });

  return {
    manifest: {
      schemaVersion: SCHEMA_VERSION,
      revision: libraryRevision(decks),
      decks,
    },
    banks,
  };
}

/** The exact bytes the manifest file should contain. */
export function serializeManifest(manifest) {
  return serializeJson(manifest);
}

function main() {
  const { manifest } = buildManifest();
  if (manifest.decks.length === 0) {
    console.error("data/library.json lists no decks — nothing to build");
    process.exit(1);
  }

  const changed = writeJsonIfChanged(MANIFEST_PATH, manifest);
  console.log(`${changed ? "wrote" : "unchanged"}: ${rel(MANIFEST_PATH)}`);
  for (const entry of manifest.decks) {
    console.log(
      `  ${entry.id}: ${entry.wordCount} words, ${entry.tags.length} tags, ` +
        `revision ${entry.revision} (${entry.bank})`,
    );
  }
  console.log(`manifest revision: ${manifest.revision}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
