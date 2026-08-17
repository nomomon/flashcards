import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { AUDIO_INDEX_PATH } from "./paths.mjs";

export const SCHEMA_VERSION = 1;

const EMPTY_INDEX = {
  schemaVersion: SCHEMA_VERSION,
  generatedAt: null,
  voices: {},
  clips: {},
};

/**
 * Read data/audio/index.json. A missing, empty, or unparseable file is treated
 * as "nothing generated yet" rather than an error: deleting data/audio/ and
 * rerunning is a supported way to repopulate from scratch.
 */
export async function readAudioIndex() {
  let raw;
  try {
    raw = await fs.readFile(AUDIO_INDEX_PATH, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { ...EMPTY_INDEX };
    throw error;
  }

  if (raw.trim() === "") return { ...EMPTY_INDEX };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(
      "warn  data/audio/index.json is not valid JSON; treating it as empty.",
    );
    return { ...EMPTY_INDEX };
  }

  if (parsed?.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `data/audio/index.json has schemaVersion ${parsed?.schemaVersion}, ` +
        `expected ${SCHEMA_VERSION}. Refusing to guess at its shape.`,
    );
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: parsed.generatedAt ?? null,
    voices: isObject(parsed.voices) ? parsed.voices : {},
    clips: isObject(parsed.clips) ? parsed.clips : {},
  };
}

/** Stable serialization: sorted keys, 2-space indent, trailing newline. */
export function serializeAudioIndex({ generatedAt, voices, clips }) {
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    voices: sortKeys(voices),
    clips: sortKeys(clips),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/**
 * Write via a sibling temp file plus rename, so a crash mid-write can never
 * leave a half-written index next to real audio files.
 */
export async function writeAudioIndexAtomically(contents) {
  const dir = path.dirname(AUDIO_INDEX_PATH);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = path.join(
    dir,
    `.index.json.${randomBytes(6).toString("hex")}.tmp`,
  );
  try {
    await fs.writeFile(tempPath, contents, "utf8");
    await fs.rename(tempPath, AUDIO_INDEX_PATH);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

function sortKeys(record) {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
