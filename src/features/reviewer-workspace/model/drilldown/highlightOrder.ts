// Row-highlight-first order: findings whose PDF highlight lands on a table row sort before whole-table ones.

import { isPopulated } from "./groupedFindings";
import type { Row, SourceRect } from "@/features/reviewer-workspace/types";
import type { TreeNode } from "./groupedFindings";

export type SourceKind =
  | "row"
  | "multi_row"
  | "sentence"
  | "caption"
  | "partial_sentence"
  | "table"
  | "figure"
  | "page_only"
  | "none"
  | `other:${string}`;

export type FindingLevel = "row" | "table" | "other";

export const MULTI_ROW_SPAN = 0.06;

const DIAG_FIELDS = [
  "sensitivity",
  "specificity",
  "positive_predictive_value",
  "negative_predictive_value",
] as const;

const ROWISH: ReadonlySet<SourceKind> = new Set([
  "row",
  "sentence",
  "caption",
  "partial_sentence",
]);

// Wider than ProvSource: the export carries resolutions, such as figure_region, that ResolutionKind lacks.
type HighlightEntry = { page?: unknown; rects?: SourceRect[] | null };
type SourceLike = {
  resolution?: unknown;
  location?: unknown;
  highlight?: HighlightEntry[] | null;
  page?: unknown;
} | null | undefined;

/** The populated fields CleanTree's Result() renders clickable. */
export function clickableResultFields(row: Row): string[] {
  const out: string[] = [];
  if (isPopulated(row, "effect_size")) {
    out.push("effect_size");
    if (isPopulated(row, "effect_size_ci_lower")) out.push("effect_size_ci_lower");
    if (isPopulated(row, "effect_size_ci_upper")) out.push("effect_size_ci_upper");
  }
  if (isPopulated(row, "p_value")) out.push("p_value");
  for (const field of DIAG_FIELDS) {
    if (isPopulated(row, field)) out.push(field);
  }
  const events = isPopulated(row, "n_events");
  const total = isPopulated(row, "n_total");
  if (events) out.push("n_events");
  if (total) out.push("n_total");
  if (!events && !total && isPopulated(row, "count_as_printed_raw")) {
    out.push("count_as_printed_raw");
  }
  return out;
}

export function classifySource(source: SourceLike): SourceKind {
  if (!source) return "none";
  const resolution = typeof source.resolution === "string" ? source.resolution : undefined;
  const location = typeof source.location === "string" ? source.location : "";
  const highlight = Array.isArray(source.highlight) ? source.highlight : [];
  const rects: SourceRect[] = [];
  for (const entry of highlight) {
    if (!entry || !Array.isArray(entry.rects)) continue;
    for (const rect of entry.rects) {
      if (
        rect &&
        typeof rect.y === "number" &&
        typeof rect.h === "number"
      ) {
        rects.push(rect);
      }
    }
  }
  if (resolution === "table_region") return "table";
  if (resolution === "figure_region") return "figure";
  if (resolution === "page_only") return "page_only";
  if (rects.length === 0) return "none";
  if (resolution === "partial_quote") return "partial_sentence";
  if (resolution === "exact") {
    if (location.startsWith("tables/")) {
      const pages = new Set<number>();
      for (const entry of highlight) {
        if (entry && Array.isArray(entry.rects) && entry.rects.length > 0 && typeof entry.page === "number") {
          pages.add(entry.page);
        }
      }
      const tops = rects.map((rect) => rect.y);
      const bottoms = rects.map((rect) => rect.y + rect.h);
      const span = Math.max(...bottoms) - Math.min(...tops);
      return pages.size > 1 || span > MULTI_ROW_SPAN ? "multi_row" : "row";
    }
    if (location.startsWith("figures/")) return "caption";
    return "sentence";
  }
  return `other:${String(resolution)}`;
}

export function findingLevel(kinds: SourceKind[]): FindingLevel {
  if (kinds.length === 0) return "other";
  if (kinds.some((kind) => kind === "table" || kind === "figure")) return "table";
  if (kinds.every((kind) => ROWISH.has(kind))) return "row";
  return "other";
}

const firstSourceOf = (row: Row, field: string) => row.provenance[field]?.sources?.[0] ?? null;

/** sources[0] is the source the evidence card opens (drilldown/selection.ts firstSourceFor). */
export function findingLevelOf(row: Row): FindingLevel {
  const kinds = clickableResultFields(row).map((field) =>
    classifySource(firstSourceOf(row, field))
  );
  return findingLevel(kinds);
}

export function levelRank(level: FindingLevel): number {
  return level === "row" ? 0 : level === "table" ? 2 : 1;
}

/** Sorts each findings table's rows by level; sibling branches keep buildPaperTree's count order. */
export function orderByHighlight(tree: TreeNode): TreeNode {
  const levels = new Map<Row, FindingLevel>();
  const levelCached = (row: Row) => {
    let level = levels.get(row);
    if (level === undefined) {
      level = findingLevelOf(row);
      levels.set(row, level);
    }
    return level;
  };
  const reorder = (node: TreeNode): TreeNode => {
    const children = node.children.map(reorder);
    let rows = node.rows;
    if (node.projection) {
      rows = node.rows
        .map((row, index) => ({ row, index, rank: levelRank(levelCached(row)) }))
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map(({ row }) => row);
    }
    return { ...node, rows, children };
  };
  return reorder(tree);
}
