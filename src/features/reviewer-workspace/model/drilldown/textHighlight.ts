// Text-highlight rule: a result value is shown only if one of its sources carries highlight geometry.

import { hasTextHighlight, type HighlightCarrier } from "../highlight";
import { isPopulated } from "./groupedFindings";
import { clickableResultFields } from "./highlightOrder";
import type { Row } from "@/features/reviewer-workspace/types";

/** The result fields that decide whether a finding shows; grouping labels, context and metadata are left alone. */
export const RESULT_VALUE_FIELDS = [
  "effect_size",
  "effect_size_ci_lower",
  "effect_size_ci_upper",
  "p_value",
  "sensitivity",
  "specificity",
  "positive_predictive_value",
  "negative_predictive_value",
  "n_events",
  "n_total",
  "count_as_printed_raw",
] as const;

/** The printed estimate follows the value rule too, but never decides whether a finding shows. */
const PRINTED_ESTIMATE = "effect_estimate_as_printed_raw";
const RULED_FIELDS: readonly string[] = [...RESULT_VALUE_FIELDS, PRINTED_ESTIMATE];

function valueHighlighted(row: Row, field: string): boolean {
  return (row.provenance[field]?.sources ?? []).some(hasTextHighlight);
}

/**
 * The result fields the rule hides in a fetched row: populated, with no highlighted source.
 * Ordered as RESULT_VALUE_FIELDS, then the printed estimate.
 */
export function hiddenResultFields(row: Row): string[] {
  return RULED_FIELDS.filter((field) => isPopulated(row, field) && !valueHighlighted(row, field));
}

/** Highlighted sources first, then the rest; each group keeps its order. Returns `sources` itself when nothing moves. */
function highlightedFirst<T extends HighlightCarrier>(sources: T[]): T[] {
  const highlighted = sources.filter(hasTextHighlight);
  if (highlighted.every((source, index) => sources[index] === source)) return sources;
  return [...highlighted, ...sources.filter((source) => !hasTextHighlight(source))];
}

/** The row with its result values' highlighted sources first; `row` itself when no order changes. */
function withHighlightedSourcesFirst(row: Row): Row {
  let provenance: Row["provenance"] | null = null;
  for (const field of RULED_FIELDS) {
    const entry = row.provenance[field];
    if (!entry?.sources) continue;
    const sources = highlightedFirst(entry.sources);
    if (sources === entry.sources) continue;
    provenance ??= { ...row.provenance };
    provenance[field] = { ...entry, sources };
  }
  return provenance ? { ...row, provenance } : row;
}

/** The row as shown, or null when it has result values but none left to show. Never mutates `row`. */
function shownRow(row: Row): Row | null {
  const hidden = hiddenResultFields(row);
  let shown = row;
  if (hidden.length > 0) {
    const fields = { ...row.fields };
    const identity = { ...row.identity };
    const provenance = { ...row.provenance };
    for (const field of hidden) {
      delete fields[field];
      delete identity[field];
      delete provenance[field];
    }
    shown = { ...row, fields, identity, provenance };
  }
  const hadResult = RESULT_VALUE_FIELDS.some((field) => isPopulated(row, field));
  if (hadResult && clickableResultFields(shown).length === 0) return null;
  return withHighlightedSourcesFirst(shown);
}

/**
 * Drops result values without a highlighted source, and findings left with no result value to show.
 * Shown result values list their highlighted sources first, so the evidence opens on one.
 */
export function hideUnhighlightedValues(rows: Row[]): Row[] {
  const out: Row[] = [];
  for (const row of rows) {
    const shown = shownRow(row);
    if (shown) out.push(shown);
  }
  return out;
}
