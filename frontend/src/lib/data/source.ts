import type { z } from "zod";
import type { AudioIndex, Deck, DeckSummary, Manifest } from "@/types/deck";
import { audioIndexSchema, deckSchema, manifestSchema } from "./schemas";

/**
 * The one place that talks to the network. Everything fetched here is parsed
 * through a schema before it leaves this module, so the rest of the app can
 * treat `Manifest`/`Deck`/`AudioIndex` as facts.
 */

/**
 * Where `data/` is served from. Same-origin `/data` by default, which is what
 * `vite dev` serves and what `scripts/postbuild.mjs` copies into `dist/data`.
 */
export const DATA_BASE_URL: string =
  import.meta.env.VITE_DATA_BASE_URL ?? "/data";

/** Resolves a path relative to `data/` (as found in the manifest or audio index). */
export function dataUrl(relativePath: string): string {
  const base = DATA_BASE_URL.replace(/\/+$/, "");
  const path = relativePath.replace(/^\/+/, "");
  return `${base}/${path}`;
}

/** A fetch that came back, but not with a 2xx. Carries the status for callers. */
export class DataFetchError extends Error {
  readonly url: string;
  readonly status: number;

  constructor(url: string, status: number, statusText: string) {
    super(`Failed to fetch ${url}: ${status} ${statusText}`.trimEnd());
    this.name = "DataFetchError";
    this.url = url;
    this.status = status;
  }
}

/** A fetch that succeeded but returned something that is not valid data. */
export class DataValidationError extends Error {
  readonly url: string;

  constructor(url: string, detail: string) {
    super(`Invalid data at ${url}: ${detail}`);
    this.name = "DataValidationError";
    this.url = url;
  }
}

/** Turns a ZodError into one debuggable line: `decks.0.color: expected a #RRGGBB color`. */
function summarizeIssues(error: z.ZodError): string {
  const shown = error.issues.slice(0, 3).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `${path}: ${issue.message}`;
  });
  const hidden = error.issues.length - shown.length;
  return hidden > 0
    ? `${shown.join("; ")} (+${hidden} more issue${hidden === 1 ? "" : "s"})`
    : shown.join("; ");
}

async function fetchJson<S extends z.ZodTypeAny>(
  url: string,
  schema: S,
  init?: RequestInit,
): Promise<z.output<S>> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new DataFetchError(url, response.status, response.statusText);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DataValidationError(url, "response body is not valid JSON");
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new DataValidationError(url, summarizeIssues(result.error));
  }
  return result.data;
}

/**
 * The freshness oracle. Always network-first: a cached manifest would tell us
 * cached decks are current when they are not.
 */
export function fetchManifest(): Promise<Manifest> {
  return fetchJson(dataUrl("manifest.json"), manifestSchema, {
    cache: "no-store",
  });
}

/** Decks are immutable at a revision, so the HTTP cache is welcome to help. */
export function fetchDeck(summary: Pick<DeckSummary, "path">): Promise<Deck> {
  return fetchJson(dataUrl(summary.path), deckSchema);
}

export function fetchAudioIndex(): Promise<AudioIndex> {
  return fetchJson(dataUrl("audio/index.json"), audioIndexSchema);
}
