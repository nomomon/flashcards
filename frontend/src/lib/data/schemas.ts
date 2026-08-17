import { z } from "zod";
import type {
  AudioClip,
  AudioIndex,
  Deck,
  DeckLanguages,
  DeckSummary,
  LanguageInfo,
  Manifest,
  Word,
} from "@/types/deck";

/**
 * Runtime validation for everything fetched from `data/`. The hand-written
 * interfaces in `types/deck.ts` stay the source of truth; these schemas mirror
 * them, and the compile-time assertions at the bottom of this file fail the
 * build if the two ever drift.
 *
 * Deliberately strict about the things that silently break the UI (colors,
 * locales, relative paths, ISO revisions) and deliberately lax about unknown
 * object keys: the contract says `schemaVersion` is bumped only on breaking
 * changes, so an additive field from a newer pipeline must not break an older
 * client. Unknown keys are stripped, not rejected.
 */

/** The only `schemaVersion` this client understands. */
export const DATA_SCHEMA_VERSION = 1;

/**
 * Refuses data from a future (or past) contract instead of guessing at it.
 * Typed as `number` rather than a literal so the schema output stays assignable
 * to the interfaces, which declare `schemaVersion: number`.
 */
const schemaVersion = z
  .number()
  .int("schemaVersion must be an integer")
  // The `: boolean` annotation keeps zod's output type `number` (matching the
  // interfaces) instead of letting it narrow to the literal `1`.
  .refine((value): boolean => value === DATA_SCHEMA_VERSION, {
    message: `unsupported schemaVersion: this build understands ${DATA_SCHEMA_VERSION} only`,
  });

/** ISO-8601 instant, e.g. "2026-08-17T00:00:00.000Z". */
const isoTimestamp = z
  .string()
  .datetime({ offset: true, message: "expected an ISO-8601 timestamp" });

/** `#RRGGBB`, per the data contract. */
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "expected a #RRGGBB color");

/**
 * BCP-47 language tag, loose enough for real tags ("nl", "nl-NL",
 * "zh-Hant-TW") and tight enough to catch a label pasted into a locale field.
 */
const locale = z
  .string()
  .regex(
    /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$/,
    "expected a BCP-47 locale tag",
  );

/** Slug-shaped, stable identifier (deck ids and word ids). */
const slugId = z
  .string()
  .min(1, "must not be empty")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a lowercase slug");

const nonEmptyText = z.string().min(1, "must not be empty");

/** Path relative to `data/`. Never absolute, never escaping the directory. */
const relativeDataPath = z
  .string()
  .min(1, "must not be empty")
  .refine(
    (value) =>
      !value.startsWith("/") && !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value),
    {
      message: "must be relative to data/, not absolute",
    },
  )
  .refine((value) => !value.split("/").includes(".."), {
    message: 'must not contain ".."',
  });

const languageInfoSchema = z.object({
  label: nonEmptyText,
  locale,
});

const deckLanguagesSchema = z.object({
  front: languageInfoSchema,
  back: languageInfoSchema,
});

const wordSchema = z.object({
  id: slugId,
  front: nonEmptyText,
  back: nonEmptyText,
  // May be empty, never absent.
  tags: z.array(nonEmptyText),
});

export const deckSchema = z.object({
  schemaVersion,
  id: slugId,
  name: nonEmptyText,
  color: hexColor,
  revision: isoTimestamp,
  languages: deckLanguagesSchema,
  words: z.array(wordSchema),
});

const deckSummarySchema = z.object({
  id: slugId,
  name: nonEmptyText,
  color: hexColor,
  languages: deckLanguagesSchema,
  wordCount: z.number().int().nonnegative(),
  tags: z.array(nonEmptyText),
  revision: isoTimestamp,
  path: relativeDataPath,
});

export const manifestSchema = z.object({
  schemaVersion,
  revision: isoTimestamp,
  decks: z.array(deckSummarySchema),
});

const audioClipSchema = z.object({
  path: relativeDataPath,
  bytes: z.number().int().nonnegative(),
  generatedAt: isoTimestamp,
});

export const audioIndexSchema = z.object({
  schemaVersion,
  generatedAt: isoTimestamp,
  // locale -> voice name
  voices: z.record(z.string(), nonEmptyText),
  // `${locale}:${text}` -> clip
  clips: z.record(z.string(), audioClipSchema),
});

/**
 * Compile-time proof that each schema produces exactly its interface. If a
 * schema gains, loses or retypes a field without the interface following (or
 * vice versa), one of these aliases stops satisfying `Expect<true>` and tsc
 * fails here rather than somewhere three components deep.
 */
type Extends<A, B> = [A] extends [B] ? true : false;
type Mutual<A, B> = Extends<A, B> extends true ? Extends<B, A> : false;
type Expect<T extends true> = T;

export type LanguageInfoSchemaMatches = Expect<
  Mutual<z.output<typeof languageInfoSchema>, LanguageInfo>
>;
export type DeckLanguagesSchemaMatches = Expect<
  Mutual<z.output<typeof deckLanguagesSchema>, DeckLanguages>
>;
export type WordSchemaMatches = Expect<
  Mutual<z.output<typeof wordSchema>, Word>
>;
export type DeckSchemaMatches = Expect<
  Mutual<z.output<typeof deckSchema>, Deck>
>;
export type DeckSummarySchemaMatches = Expect<
  Mutual<z.output<typeof deckSummarySchema>, DeckSummary>
>;
export type ManifestSchemaMatches = Expect<
  Mutual<z.output<typeof manifestSchema>, Manifest>
>;
export type AudioClipSchemaMatches = Expect<
  Mutual<z.output<typeof audioClipSchema>, AudioClip>
>;
export type AudioIndexSchemaMatches = Expect<
  Mutual<z.output<typeof audioIndexSchema>, AudioIndex>
>;
