// What counts as a text highlight: the one rule the Data and Review views, and
// the index builders, use to decide whether a value can open on marked text.

/** Anything that may carry a `highlight` list, such as a provenance source. */
export type HighlightCarrier = { highlight?: unknown } | null | undefined;

/**
 * True iff some `highlight` entry has a non-empty `rects` list on an integer
 * page >= 1. Reads nothing else: not the resolution, not the source's own page.
 */
export function hasTextHighlight(source: HighlightCarrier): boolean {
  const highlight = source?.highlight;
  if (!Array.isArray(highlight)) return false;
  return highlight.some(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      Number.isInteger(entry.page) &&
      entry.page >= 1 &&
      Array.isArray(entry.rects) &&
      entry.rects.length > 0
  );
}
