import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { dataPath, MANIFEST_PATH, rel } from "./paths.mjs";

/** Clip key, exactly as the frontend builds it. */
export function clipKey(locale, text) {
  return `${locale}:${text}`;
}

/** Filename stem: sha1 of the clip key, truncated to 10 hex chars. */
export function clipStem(key) {
  return createHash("sha1").update(key).digest("hex").slice(0, 10);
}

/** Clip path relative to `data/`, matching the data contract. */
export function clipPath(locale, key) {
  return `audio/${locale}/${clipStem(key)}.ogg`;
}

export async function loadManifest() {
  let raw;
  try {
    raw = await fs.readFile(MANIFEST_PATH, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `No manifest at ${rel(MANIFEST_PATH)}.\n` +
          "Build it first (pnpm --filter @flashcards/data-tools run manifest), " +
          "or point FLASHCARDS_DATA_DIR at a data directory that has one.",
      );
    }
    throw error;
  }

  const manifest = JSON.parse(raw);
  if (!Array.isArray(manifest?.decks)) {
    throw new Error(`${rel(MANIFEST_PATH)} has no decks array.`);
  }
  return manifest;
}

/**
 * Load every deck listed in the manifest (or just one, with `deckId`).
 * The manifest is the index of record, so decks/*.json files it does not list
 * are deliberately ignored: the validator is what flags those.
 */
export async function loadDecks(deckId = null) {
  const manifest = await loadManifest();
  const entries = deckId
    ? manifest.decks.filter((deck) => deck.id === deckId)
    : manifest.decks;

  if (deckId && entries.length === 0) {
    const known = manifest.decks.map((deck) => deck.id).join(", ") || "none";
    throw new Error(`No deck with id "${deckId}". Known decks: ${known}.`);
  }

  const decks = [];
  for (const entry of entries) {
    const absolute = dataPath(entry.path);
    let deck;
    try {
      deck = JSON.parse(await fs.readFile(absolute, "utf8"));
    } catch (error) {
      throw new Error(
        `Cannot read deck "${entry.id}" at ${rel(absolute)}: ${error.message}`,
      );
    }
    decks.push(deck);
  }
  return decks;
}

/**
 * Every clip the decks need, deduplicated across decks by `${locale}:${text}`.
 * That dedup is the entire reason the audio index is shared rather than
 * per-deck: "the" in a Dutch deck and in a German deck are one clip.
 */
export function collectRequiredClips(decks) {
  const required = new Map();
  const warnings = [];

  for (const deck of decks) {
    for (const side of ["front", "back"]) {
      const language = deck?.languages?.[side];
      if (!language?.locale || !language?.label) {
        throw new Error(
          `Deck "${deck?.id}" is missing languages.${side}.locale/label. ` +
            "The data contract requires both; see docs/DATA_CONTRACT.md.",
        );
      }
    }

    for (const word of deck.words ?? []) {
      for (const side of ["front", "back"]) {
        const { locale, label } = deck.languages[side];
        const text = word?.[side];

        if (typeof text !== "string" || text.trim() === "") {
          warnings.push(
            `deck ${deck.id}: word "${word?.id ?? "?"}" has no ${side} text; skipped`,
          );
          continue;
        }

        const key = clipKey(locale, text);
        const existing = required.get(key);
        if (existing) {
          existing.decks.add(deck.id);
          continue;
        }
        required.set(key, {
          key,
          locale,
          label,
          text,
          path: clipPath(locale, key),
          decks: new Set([deck.id]),
        });
      }
    }
  }

  // Sorted so logs, the index diff, and --limit are all deterministic.
  const clips = [...required.values()].sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
  );
  return { clips, warnings };
}
