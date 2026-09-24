// Schema-first selection over the per-paper counts in schema-index.json: group → category → item.

import { demoLabel } from "./drilldown/demoLabels";

export const GROUPS = ["Variants", "Study context", "Outcomes", "Results", "Paper"] as const;
export type Group = (typeof GROUPS)[number];
export type LayerGroup = Exclude<Group, "Paper">;
export const LAYER_GROUPS = GROUPS.filter((group): group is LayerGroup => group !== "Paper");

export type PaperIndex = {
  paper_id: string;
  title: string;
  row_count: number;
  author?: string;
  year?: number;
  journal?: string;
  /** group → stored category value → findings */
  categories: Record<LayerGroup, Record<string, number>>;
  /** group → stored category value → item ID → findings */
  items: Record<LayerGroup, Record<string, Record<string, number>>>;
};

export type SchemaIndex = {
  run_id: string;
  layers: Record<LayerGroup, { category_field: string; item_field: string | null }>;
  papers: PaperIndex[];
};

/** A category chip. Most are one stored value; Variants folds some locus types together. */
export type CategoryDef = { key: string; label: string; values: string[] };

/** cohort_level_no_entity has no entity, so it gets no chip. */
export const VARIANT_CATEGORIES: CategoryDef[] = [
  { key: "dpyd_variant", label: "DPYD variants", values: ["dpyd_variant"] },
  {
    key: "dpyd_haplotype_or_variant_group",
    label: "DPYD haplotypes & groups",
    values: ["dpyd_haplotype_or_variant_group"],
  },
  { key: "non_dpyd_genetic_locus", label: "Other genes", values: ["non_dpyd_genetic_locus"] },
  {
    key: "phenotype",
    label: "Phenotype markers",
    values: [
      "enzyme_function_or_phenotype_marker",
      "dpyd_activity_score_or_phenotype",
      "genotype_phenotype_combined_class",
    ],
  },
  {
    key: "other",
    label: "Other",
    values: ["entity_type_unclear_or_unclassified", "non_genetic_covariate_or_characteristic"],
  },
];

const prettifyId = (id: string) => {
  const text = id.replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export function categoryLabel(
  group: LayerGroup,
  value: string,
  curated: Map<string, string> = new Map()
): string {
  if (group === "Study context")
  return prettifyId(value);
}

export function itemLabel(
  group: LayerGroup,
  categoryKey: string,
  id: string,
  curated: Map<string, string>
): string {
  const field = group === "Variants" ? "entity_id" : "outcome_id";
  const known = curated.get(`${field}:${id}`);
  if (known) {
    // Curated DPYD labels are bare "c.…"; outside the DPYD chip, name the gene.
    if (group === "Variants" && /^c\./.test(known) && categoryKey !== "dpyd_variant") return `DPYD ${known}`;
    return known;
  }
  if (!shown) {
    const dpyd = /^dpyd_c(-?\d\S*)$/i.exec(id);
    if (dpyd) shown = `DPYD c.${dpyd[1].toUpperCase()}`;
  }
  if (shown && group === "Variants" && categoryKey === "dpyd_variant") shown = shown.replace(/^DPYD (?=c\.)/, "");
  return shown ?? prettifyId(id);
}

export function categoriesFor(
  group: LayerGroup,
  papers: PaperIndex[],
  curated: Map<string, string> = new Map()
): CategoryDef[] {
  if (group === "Variants") return VARIANT_CATEGORIES;
  const totals = new Map<string, number>();
  for (const paper of papers)
    for (const [value, count] of Object.entries(paper.categories[group] ?? {}))
      totals.set(value, (totals.get(value) ?? 0) + count);
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
}

export const hasItemLayer = (group: Group) => group === "Variants" || group === "Outcomes";

/* ------------------------------------------------------------- selection */

/**
 * group → category key → chosen item IDs (empty set = any item in the category).
 * Paper: a multi-select of papers; each chosen paper is an item.
 */
export type SelectionState = Partial<Record<LayerGroup, Record<string, string[]>>> & { Paper?: string[] };

const PAPER_CATEGORY: CategoryDef = { key: "paper", label: "Papers", values: [] };

export function selectionOfTermKeys(
  keys: string[],
  catalog: (group: LayerGroup) => CategoryDef[],
  paperIds: string[]
): SelectionState {
  const papers = new Set(paperIds);
  const known = new Map(LAYER_GROUPS.map((group) => [group, new Set(catalog(group).map((category) => category.key))]));
  const selection: SelectionState = {};
  const paperOrder: string[] = [];
  for (const key of keys) {
    const [group, categoryKey, item, extra] = key.split("|");
    if (extra !== undefined || categoryKey === undefined) continue;
    if (group === "Paper") {
      if (item === undefined && papers.has(categoryKey) && !paperOrder.includes(categoryKey)) paperOrder.push(categoryKey);
    } else if (known.get(group as LayerGroup)?.has(categoryKey)) {
      const items = ((selection[group as LayerGroup] ??= {})[categoryKey] ??= []);
      if (item !== undefined && !items.includes(item)) items.push(item);
    }
  }
  if (paperOrder.length > 0) selection.Paper = paperOrder;
  return selection;
}

/** One colored bubble: a category with no items chosen, one chosen item, or one chosen paper. */
export type Term = {
  key: string;
  group: Group;
  category: CategoryDef;
  item?: string;
  label: string;
};

export function termsOf(
  selection: SelectionState,
  catalog: (group: LayerGroup) => CategoryDef[],
  curated: Map<string, string>,
  paperName: (paperId: string) => string = (id) => id
): Term[] {
  const terms: Term[] = [];
  for (const group of LAYER_GROUPS) {
    const chosen = selection[group];
    if (!chosen) continue;
    for (const category of catalog(group)) {
      const items = chosen[category.key];
      if (!items) continue;
      if (items.length === 0) {
        terms.push({ key: `${group}|${category.key}`, group, category, label: category.label });
      } else {
        for (const item of items) {
          terms.push({
            key: `${group}|${category.key}|${item}`,
            group,
            item,
          });
        }
      }
    }
  }
  for (const paperId of selection.Paper ?? [])
    terms.push({ key: `Paper|${paperId}`, group: "Paper", category: PAPER_CATEGORY, item: paperId, label: paperName(paperId) });
  return terms;
}

export function termCount(paper: PaperIndex, term: Term): number {
  if (term.group === "Paper") return paper.paper_id === term.item ? paper.row_count : 0;
  const group = term.group;
  let total = 0;
  for (const value of term.category.values) {
    if (term.item === undefined) total += paper.categories[group]?.[value] ?? 0;
    else total += paper.items[group]?.[value]?.[term.item] ?? 0;
  }
  return total;
}

export type Combine = "any" | "all";
export type SortMode = "custom" | "matches" | "findings" | "az";

export function rowMatcher(terms: Term[], index: SchemaIndex, combine: Combine, paperId: string) {
  const byGroup = new Map<Group, Term[]>();
  for (const term of terms) byGroup.set(term.group, [...(byGroup.get(term.group) ?? []), term]);
  const hit = (row: Row, term: Term) => {
    if (term.group === "Paper") return term.item === paperId;
    const layer = index.layers[term.group];
    const category = String(row.fields[layer.category_field] ?? "");
    if (!term.category.values.includes(category)) return false;
    if (term.item === undefined) return true;
    return layer.item_field !== null && String(row.fields[layer.item_field] ?? "") === term.item;
  };
  return (row: Row) => {
    const groups = [...byGroup.values()].map((list) => list.some((term) => hit(row, term)));
    return combine === "all" ? groups.every(Boolean) : groups.some(Boolean);
  };
}

/* ---------------------------------------------------------------- colors */

export const TERM_COLORS = [
  { dot: "#4f46e5", soft: "#eef2ff", ring: "#c7d2fe", text: "#3730a3" }, // indigo
  { dot: "#059669", soft: "#ecfdf5", ring: "#a7f3d0", text: "#065f46" }, // emerald
  { dot: "#d97706", soft: "#fffbeb", ring: "#fde68a", text: "#92400e" }, // amber
  { dot: "#e11d48", soft: "#fff1f2", ring: "#fecdd3", text: "#9f1239" }, // rose
  { dot: "#0284c7", soft: "#f0f9ff", ring: "#bae6fd", text: "#075985" }, // sky
  { dot: "#7c3aed", soft: "#f5f3ff", ring: "#ddd6fe", text: "#5b21b6" }, // violet
  { dot: "#0d9488", soft: "#f0fdfa", ring: "#99f6e4", text: "#115e59" }, // teal
  { dot: "#ea580c", soft: "#fff7ed", ring: "#fed7aa", text: "#9a3412" }, // orange
  { dot: "#db2777", soft: "#fdf2f8", ring: "#fbcfe8", text: "#9d174d" }, // pink
  { dot: "#65a30d", soft: "#f7fee7", ring: "#d9f99d", text: "#3f6212" }, // lime
];
export type TermColor = (typeof TERM_COLORS)[number];
