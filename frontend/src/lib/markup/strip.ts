import { type InlineNode, parseInline } from "./parse";

/**
 * The plain text of a formatted string: delimiters removed, escapes resolved,
 * everything else left exactly as it was (no trimming, no whitespace
 * collapsing).
 *
 *   `de **man**`   -> `de man`
 *   `\*literal\*`  -> `*literal*`
 *   `**a *b* c**`  -> `a b c`
 *   `un**balanced` -> `un**balanced`   (unbalanced markers stay literal)
 *
 * This is load-bearing beyond cosmetics: it is what gets handed to speech
 * synthesis, so without it a card is pronounced "star star man star star". It
 * is defined as the flattening of `parseInline` for exactly that reason -
 * rendering and speaking can then never disagree about what the text says. The
 * validator applies the same strip via `tools/data-tools/src/markup.mjs`.
 */
export function stripFormatting(text: string): string {
  if (typeof text !== "string" || text === "") return "";
  return flatten(parseInline(text));
}

function flatten(nodes: InlineNode[]): string {
  let out = "";
  for (const node of nodes) {
    out += node.type === "text" ? node.value : flatten(node.children);
  }
  return out;
}

/** True when the text carries markup, i.e. stripping it would change it. */
export function hasFormatting(text: string): boolean {
  return stripFormatting(text) !== text;
}
