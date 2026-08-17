// Loading side of the authored files: data/library.json and data/banks/*.tsv.
// Shared by build-manifest.mjs and validate.mjs so both see exactly the same
// bytes and the same derived values.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJson } from "./json.mjs";
import { BANKS_DIR, DATA_DIR, LIBRARY_PATH } from "./paths.mjs";
import { parseTagCell, parseTsv } from "./tsv.mjs";

export const SCHEMA_VERSION = 2;

/** Columns a bank must declare. Anything else is ignored. */
export const REQUIRED_COLUMNS = ["id", "front", "back"];
/** Columns this tool writes, in this order. */
export const BANK_COLUMNS = ["id", "front", "back", "tags"];

/** First 12 hex characters of the sha256 of some bytes. Used for revisions. */
export function revisionHash(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 12);
}

/** Reads and parses data/library.json. Throws with the path in the message. */
export function loadLibrary() {
  return readJson(LIBRARY_PATH);
}

/**
 * The one legal `bank` value for a deck id. The contract pins it to exactly
 * `banks/<id>.tsv`: the path is redundant with the id and is kept only so the
 * file a deck refers to is visible where the deck is declared. Pinning it is
 * what makes the orphan sweep over banks/ total — a deck cannot point somewhere
 * the sweep does not look.
 */
export function expectedBank(id) {
  return `banks/${id}.tsv`;
}

/** Absolute path of a `bank` value from library.json (relative to data/). */
export function bankPath(bank) {
  return path.join(DATA_DIR, bank);
}

/** True when a `bank` value is safely relative to data/. */
export function isSafeRelativePath(value) {
  return (
    typeof value === "string" &&
    value !== "" &&
    !path.isAbsolute(value) &&
    !value.startsWith("/") &&
    !value.split(/[\\/]/).includes("..")
  );
}

/** `banks/<stem>.tsv` file names present on disk, sorted. */
export function listBankFiles() {
  if (!fs.existsSync(BANKS_DIR)) return [];
  return fs
    .readdirSync(BANKS_DIR)
    .filter((name) => name.endsWith(".tsv"))
    .sort();
}

/**
 * Reads one bank file.
 *
 * `revision` hashes the file's exact bytes, so any edit — including whitespace
 * the parser ignores — changes it. That is intentional: the revision is a cache
 * key, and a cheap false invalidation beats a missed one.
 *
 * @param {string} bank path relative to data/, e.g. "banks/dutch-1.tsv"
 */
export function loadBank(bank) {
  const file = bankPath(bank);
  const bytes = fs.readFileSync(file);
  const text = bytes.toString("utf8");
  const { columns, rows, problems } = parseTsv(text, {
    requiredColumns: REQUIRED_COLUMNS,
  });

  const words = rows.map(({ line, values, missing }) => ({
    line,
    missing,
    id: values.id ?? "",
    front: values.front ?? "",
    back: values.back ?? "",
    tags: parseTagCell(values.tags ?? ""),
  }));

  return {
    bank,
    file,
    bytes,
    text,
    columns,
    words,
    problems,
    revision: revisionHash(bytes),
  };
}

/** Sorted, de-duplicated tags across a bank's words. */
export function collectTags(words) {
  const tags = new Set();
  for (const word of words) {
    for (const tag of word.tags) tags.add(tag);
  }
  return [...tags].sort();
}
