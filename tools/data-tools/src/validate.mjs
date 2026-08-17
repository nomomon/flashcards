#!/usr/bin/env node
// Validates everything under data/ against docs/DATA_CONTRACT.md.
//
//   node src/validate.mjs
//
// Exits 0 with a one-screen summary, or 1 after printing every problem found
// (it never stops at the first). Runs in CI, so output is plain text lines.

import fs from "node:fs";
import path from "node:path";
import { collectTags, listDeckFiles } from "./decks.mjs";
import { readJson } from "./json.mjs";
import { AUDIO_INDEX_PATH, DATA_DIR, MANIFEST_PATH, rel } from "./paths.mjs";
import { isValidWordId } from "./slug.mjs";

const SCHEMA_VERSION = 1;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const BCP47 = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

const problems = [];
/** @param {number} invariant 1-6, or 0 for structural problems */
function fail(invariant, message) {
  problems.push({ invariant, message });
}

function isIso8601(value) {
  return (
    typeof value === "string" &&
    ISO_8601_UTC.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function checkLanguages(where, languages) {
  if (!languages || typeof languages !== "object") {
    fail(0, `${where}: languages missing`);
    return;
  }
  for (const side of ["front", "back"]) {
    const lang = languages[side];
    if (!lang || typeof lang !== "object") {
      fail(0, `${where}: languages.${side} must be { label, locale }`);
      continue;
    }
    if (typeof lang.label !== "string" || lang.label === "") {
      fail(0, `${where}: languages.${side}.label must be a non-empty string`);
    }
    if (typeof lang.locale !== "string" || !BCP47.test(lang.locale)) {
      fail(
        0,
        `${where}: languages.${side}.locale ${JSON.stringify(lang.locale)} is not a BCP-47 tag`,
      );
    }
  }
}

// --- load ------------------------------------------------------------------

let manifest = null;
try {
  manifest = readJson(MANIFEST_PATH);
} catch (error) {
  fail(0, error.message);
}

/** @type {Array<{file: string, stem: string, deck: any}>} */
const decks = [];
for (const file of listDeckFiles()) {
  try {
    decks.push({
      file,
      stem: path.basename(file, ".json"),
      deck: readJson(file),
    });
  } catch (error) {
    fail(0, error.message);
  }
}

// --- deck files ------------------------------------------------------------

const deckRevisions = [];

for (const { file, stem, deck } of decks) {
  const where = rel(file);

  if (deck.schemaVersion !== SCHEMA_VERSION) {
    fail(
      0,
      `${where}: schemaVersion is ${JSON.stringify(deck.schemaVersion)}, expected ${SCHEMA_VERSION}`,
    );
  }
  if (typeof deck.name !== "string" || deck.name === "") {
    fail(0, `${where}: name must be a non-empty string`);
  }
  if (typeof deck.color !== "string" || !HEX_COLOR.test(deck.color)) {
    fail(0, `${where}: color ${JSON.stringify(deck.color)} must be #RRGGBB`);
  }
  checkLanguages(where, deck.languages);

  // Invariant 2 (first half): deck id equals filename stem.
  if (deck.id !== stem) {
    fail(
      2,
      `${where}: deck id ${JSON.stringify(deck.id)} !== filename stem "${stem}"`,
    );
  }

  // Invariant 6: revision parses as ISO-8601.
  if (!isIso8601(deck.revision)) {
    fail(
      6,
      `${where}: revision ${JSON.stringify(deck.revision)} is not an ISO-8601 UTC timestamp`,
    );
  } else {
    deckRevisions.push(deck.revision);
  }

  if (!Array.isArray(deck.words)) {
    fail(0, `${where}: words must be an array`);
    continue;
  }

  // Invariant 4: word ids unique within the deck and matching the slug rules.
  const seenIds = new Map();
  deck.words.forEach((word, index) => {
    const at = `${where}: words[${index}]`;
    if (typeof word.front !== "string" || word.front === "") {
      fail(0, `${at}: front must be a non-empty string`);
    }
    if (typeof word.back !== "string" || word.back === "") {
      fail(0, `${at} (${word.front}): back must be a non-empty string`);
    }
    if (!Array.isArray(word.tags)) {
      fail(
        0,
        `${at} (${word.front}): tags must be an array (may be empty, never absent)`,
      );
    } else if (word.tags.some((tag) => typeof tag !== "string" || tag === "")) {
      fail(0, `${at} (${word.front}): tags must all be non-empty strings`);
    }

    if (typeof word.id !== "string" || word.id === "") {
      fail(4, `${at} (${word.front}): id must be a non-empty string`);
      return;
    }
    if (seenIds.has(word.id)) {
      fail(
        4,
        `${where}: duplicate word id "${word.id}" at words[${seenIds.get(word.id)}] and words[${index}]`,
      );
    } else {
      seenIds.set(word.id, index);
    }
    if (typeof word.front === "string" && !isValidWordId(word.id, word.front)) {
      fail(
        4,
        `${at}: id "${word.id}" does not match the slug rules for front ${JSON.stringify(word.front)}`,
      );
    }
  });
}

// --- manifest --------------------------------------------------------------

const decksByStem = new Map(decks.map((entry) => [entry.stem, entry]));
const manifestLocales = new Set();
let manifestEntries = [];

if (manifest) {
  const where = rel(MANIFEST_PATH);

  if (manifest.schemaVersion !== SCHEMA_VERSION) {
    fail(
      0,
      `${where}: schemaVersion is ${JSON.stringify(manifest.schemaVersion)}, expected ${SCHEMA_VERSION}`,
    );
  }
  if (!Array.isArray(manifest.decks)) {
    fail(0, `${where}: decks must be an array`);
  } else {
    manifestEntries = manifest.decks;
  }

  // Invariant 6: manifest revision parses and equals the max deck revision.
  if (!isIso8601(manifest.revision)) {
    fail(
      6,
      `${where}: revision ${JSON.stringify(manifest.revision)} is not an ISO-8601 UTC timestamp`,
    );
  }
  const expectedRevision = [...deckRevisions].sort().at(-1);
  if (expectedRevision && manifest.revision !== expectedRevision) {
    fail(
      6,
      `${where}: revision ${JSON.stringify(manifest.revision)} !== max deck revision "${expectedRevision}"`,
    );
  }

  const referencedStems = new Set();

  manifestEntries.forEach((entry, index) => {
    const at = `${where}: decks[${index}]${entry?.id ? ` (${entry.id})` : ""}`;

    if (typeof entry.path !== "string" || entry.path === "") {
      fail(1, `${at}: path must be a non-empty string`);
      return;
    }
    if (path.isAbsolute(entry.path) || entry.path.split("/").includes("..")) {
      fail(
        1,
        `${at}: path "${entry.path}" must be relative to data/ and never use ".."`,
      );
    }

    // Invariant 1: the referenced file exists.
    const absolute = path.join(DATA_DIR, entry.path);
    if (!fs.existsSync(absolute)) {
      fail(1, `${at}: no file at data/${entry.path}`);
      return;
    }

    const stem = path.basename(entry.path, ".json");
    referencedStems.add(stem);
    const loaded = decksByStem.get(stem);
    if (!loaded) {
      fail(
        1,
        `${at}: data/${entry.path} is not a readable deck under data/decks`,
      );
      return;
    }

    // Invariant 2: manifest id equals deck id equals filename stem.
    if (entry.id !== loaded.deck.id) {
      fail(
        2,
        `${at}: manifest id !== deck id ${JSON.stringify(loaded.deck.id)}`,
      );
    }
    if (entry.id !== stem) {
      fail(2, `${at}: manifest id !== filename stem "${stem}"`);
    }

    if (entry.name !== loaded.deck.name) {
      fail(
        0,
        `${at}: name ${JSON.stringify(entry.name)} !== deck name ${JSON.stringify(loaded.deck.name)}`,
      );
    }
    if (entry.color !== loaded.deck.color) {
      fail(
        0,
        `${at}: color ${JSON.stringify(entry.color)} !== deck color ${JSON.stringify(loaded.deck.color)}`,
      );
    }
    if (
      JSON.stringify(entry.languages) !== JSON.stringify(loaded.deck.languages)
    ) {
      fail(0, `${at}: languages do not match the deck file`);
    }
    checkLanguages(at, entry.languages);
    for (const side of ["front", "back"]) {
      const locale = entry.languages?.[side]?.locale;
      if (typeof locale === "string") manifestLocales.add(locale);
    }

    // Invariant 3: denormalized wordCount and tags match the deck exactly.
    const actualCount = Array.isArray(loaded.deck.words)
      ? loaded.deck.words.length
      : 0;
    if (entry.wordCount !== actualCount) {
      fail(
        3,
        `${at}: wordCount ${JSON.stringify(entry.wordCount)} !== deck word count ${actualCount}`,
      );
    }
    const actualTags = collectTags(loaded.deck);
    if (!Array.isArray(entry.tags)) {
      fail(3, `${at}: tags must be an array`);
    } else if (JSON.stringify(entry.tags) !== JSON.stringify(actualTags)) {
      fail(
        3,
        `${at}: tags [${entry.tags.join(", ")}] !== deck tags [${actualTags.join(", ")}] (must be sorted and unique)`,
      );
    }

    // Invariant 6: per-deck revision matches the deck file.
    if (entry.revision !== loaded.deck.revision) {
      fail(
        6,
        `${at}: revision ${JSON.stringify(entry.revision)} !== deck revision ${JSON.stringify(loaded.deck.revision)}`,
      );
    }
  });

  // Invariant 1 (other direction): no orphan deck files.
  for (const { stem, file } of decks) {
    if (!referencedStems.has(stem)) {
      fail(1, `${rel(file)}: deck file has no entry in ${where}`);
    }
  }
}

// --- audio/index.json ------------------------------------------------------

let clipCount = 0;
let audioIndex = null;
if (!fs.existsSync(AUDIO_INDEX_PATH)) {
  fail(
    5,
    `${rel(AUDIO_INDEX_PATH)}: missing (an empty index with {} voices and {} clips is valid)`,
  );
} else {
  try {
    audioIndex = readJson(AUDIO_INDEX_PATH);
  } catch (error) {
    fail(5, error.message);
  }
}

if (audioIndex) {
  const where = rel(AUDIO_INDEX_PATH);

  if (audioIndex.schemaVersion !== SCHEMA_VERSION) {
    fail(
      0,
      `${where}: schemaVersion is ${JSON.stringify(audioIndex.schemaVersion)}, expected ${SCHEMA_VERSION}`,
    );
  }
  if (!isIso8601(audioIndex.generatedAt)) {
    fail(
      6,
      `${where}: generatedAt ${JSON.stringify(audioIndex.generatedAt)} is not an ISO-8601 UTC timestamp`,
    );
  }
  if (
    !audioIndex.voices ||
    typeof audioIndex.voices !== "object" ||
    Array.isArray(audioIndex.voices)
  ) {
    fail(0, `${where}: voices must be an object`);
  }
  if (
    !audioIndex.clips ||
    typeof audioIndex.clips !== "object" ||
    Array.isArray(audioIndex.clips)
  ) {
    fail(0, `${where}: clips must be an object`);
  } else {
    const clips = Object.entries(audioIndex.clips);
    clipCount = clips.length;

    for (const [key, clip] of clips) {
      const at = `${where}: clips["${key}"]`;
      const separator = key.indexOf(":");
      if (separator <= 0 || separator === key.length - 1) {
        fail(5, `${at}: key must be \`\${locale}:\${text}\``);
        continue;
      }
      const locale = key.slice(0, separator);

      // Invariant 5 (second half): the locale is one some deck actually uses.
      if (!manifestLocales.has(locale)) {
        fail(5, `${at}: locale "${locale}" is not used by any deck`);
      }

      if (!clip || typeof clip !== "object") {
        fail(5, `${at}: must be an object with path, bytes, generatedAt`);
        continue;
      }
      if (typeof clip.path !== "string" || clip.path === "") {
        fail(5, `${at}: path must be a non-empty string`);
      } else if (
        path.isAbsolute(clip.path) ||
        clip.path.split("/").includes("..")
      ) {
        fail(
          5,
          `${at}: path "${clip.path}" must be relative to data/ and never use ".."`,
        );
      } else {
        // Invariant 5 (first half): the clip file exists on disk.
        const absolute = path.join(DATA_DIR, clip.path);
        if (!fs.existsSync(absolute)) {
          fail(5, `${at}: no file at data/${clip.path}`);
        } else if (typeof clip.bytes === "number") {
          const actualBytes = fs.statSync(absolute).size;
          if (clip.bytes !== actualBytes) {
            fail(
              5,
              `${at}: bytes ${clip.bytes} !== actual file size ${actualBytes}`,
            );
          }
        }
      }
      if (
        typeof clip.bytes !== "number" ||
        !Number.isInteger(clip.bytes) ||
        clip.bytes <= 0
      ) {
        fail(5, `${at}: bytes must be a positive integer`);
      }
      if (!isIso8601(clip.generatedAt)) {
        fail(
          6,
          `${at}: generatedAt ${JSON.stringify(clip.generatedAt)} is not an ISO-8601 UTC timestamp`,
        );
      }
    }

    // Voices are keyed by locale too.
    for (const locale of Object.keys(audioIndex.voices ?? {})) {
      if (!manifestLocales.has(locale)) {
        fail(
          5,
          `${where}: voices["${locale}"] is not a locale used by any deck`,
        );
      }
    }
  }
}

// --- report ----------------------------------------------------------------

const INVARIANT_TITLES = {
  0: "Structure / field types",
  1: "1. Manifest entries and deck files match one-to-one",
  2: "2. Deck id == filename stem == manifest id",
  3: "3. Manifest wordCount and tags match the deck",
  4: "4. Word ids unique and slug-shaped",
  5: "5. Audio clips exist on disk and use known locales",
  6: "6. Revisions parse and manifest revision == max deck revision",
};

if (problems.length > 0) {
  console.error(`data validation FAILED: ${problems.length} problem(s)\n`);
  for (const key of Object.keys(INVARIANT_TITLES)) {
    const group = problems.filter(
      (problem) => problem.invariant === Number(key),
    );
    if (group.length === 0) continue;
    console.error(`${INVARIANT_TITLES[key]} — ${group.length} problem(s)`);
    for (const problem of group) console.error(`  - ${problem.message}`);
    console.error("");
  }
  process.exit(1);
}

const totalWords = decks.reduce(
  (sum, entry) => sum + (entry.deck.words?.length ?? 0),
  0,
);
console.log("data validation OK");
console.log(
  `  ${decks.length} deck(s), ${totalWords} words, ${manifestEntries.length} manifest entry/entries, ${clipCount} audio clip(s)`,
);
for (const { stem, deck } of decks) {
  console.log(
    `  ${stem}: ${deck.words?.length ?? 0} words, ${collectTags(deck).length} tags, ` +
      `${deck.languages?.front?.locale} -> ${deck.languages?.back?.locale}, revision ${deck.revision}`,
  );
}
console.log("  all 6 contract invariants satisfied");
