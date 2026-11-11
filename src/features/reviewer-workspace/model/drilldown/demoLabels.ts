// Readable labels for stored IDs: the run's authored labels first, then generic
// rules for variant tokens and grade thresholds. Anything unmatched shows as stored.

import type { DemoConfig, RunLabels } from "@/features/reviewer-workspace/types";

export const featuredPapers = (config: DemoConfig | null | undefined, labels: RunLabels): string[] =>
  config?.featured_papers ?? labels.featured_papers ?? [];

/** Featured papers first, in the configured order; the rest keep theirs. */
export function orderFeatured<T extends { paper_id: string }>(papers: T[], featured: string[]): T[] {
  const rank = (id: string) => {
    const index = featured.indexOf(id);
    return index === -1 ? featured.length : index;
  };
  return papers
    .map((paper, index) => ({ paper, index }))
    .sort((a, b) => rank(a.paper.paper_id) - rank(b.paper.paper_id) || a.index - b.index)
    .map(({ paper }) => paper);
}

/* ------------------------------------------------------------------ rules */

/** HGVS-ish tail: nucleotides upper-case, ins/del/dup kept lower-case ("c.-943insC", "c.1905+1G>A"). */
const hgvs = (tail: string) =>
  tail.toUpperCase().replace(/INS|DEL|DUP/g, (m) => m.toLowerCase());

/** One variant token: "dpyd_c1905+1g>a" → "DPYD c.1905+1G>A", "tymp_rs11479" → "TYMP rs11479". */
function variant(labels: RunLabels, token: string): string | undefined {
  const known = labels.id_labels.entity_id?.[token];
  if (known) return known;
  if (/^rs\d+$/.test(token)) return token;
  let m = /^([a-z0-9]+)_(rs\d+)$/.exec(token);
  if (m) return `${m[1].toUpperCase()} ${m[2]}`;
  m = /^([a-z0-9]+)_c(-?[0-9].*)$/.exec(token);
  if (m) return `${m[1].toUpperCase()} c.${hgvs(m[2])}`;
  m = /^([a-z0-9]+)_([0-9]+[acgt]>[acgt])$/.exec(token); // position without "c." as stored: don't add one
  if (m) return `${m[1].toUpperCase()} ${m[2].toUpperCase()}`;
  return undefined;
}

const list = (parts: string[]) =>
  parts.length <= 2 ? parts.join(" or ") : `${parts.slice(0, -1).join(", ")} or ${parts[parts.length - 1]}`;

function entity(labels: RunLabels, id: string): string | undefined {
  const direct = variant(labels, id);
  if (direct) return direct;
  let m = /^compound_(.+)$/.exec(id);
  if (m) {
    const parts = m[1].split("__").map((token) => variant(labels, token));
    if (parts.every(Boolean)) return parts.join(" + ");
  }
  m = /^group_any_of_(.+)$/.exec(id);
  if (m) {
    const parts = m[1].split("__").map((token) => variant(labels, token));
    if (parts.every(Boolean)) return `Any of ${list(parts as string[])}`;
  }
  m = /^group_wild_type_for_(.+)$/.exec(id);
  if (m) {
    const parts = m[1].split("__").map((token) => variant(labels, token));
    if (parts.every(Boolean)) return `Wild type for ${parts.join(", ")}`;
  }
  m = /^set_test_gene_([a-z0-9]+)$/.exec(id);
  if (m) return `${m[1].toUpperCase()} (gene-level test)`;
  return undefined;
}

/** "grade_3_or_higher" → "Grade 3 or higher"; "grade_0_to_2_vs_3_to_4" → "Grades 0–2 vs 3–4". */
function grade(id: string): string | undefined {
  const part = (p: string) => {
    let m = /^(?:grade_)?(\d)_to_(\d)$/.exec(p);
    if (m) return { text: `${m[1]}–${m[2]}`, plural: true };
    m = /^(?:grade_|individual_grade_)?(\d)$/.exec(p);
    if (m) return { text: m[1], plural: false };
    m = /^grade_(\d)_or_(higher|lower)$/.exec(p);
    if (m) return { text: `${m[1]} or ${m[2]}`, plural: false };
    return undefined;
  };
  const sides = id.split("_vs_").map(part);
  if (sides.some((side) => !side)) return undefined;
  if (sides.length === 1) return `${sides[0]!.plural ? "Grades" : "Grade"} ${sides[0]!.text}`;
  return `Grades ${sides.map((side) => side!.text).join(" vs ")}`;
}

/** A readable label for a stored ID, or undefined to show it as stored. */
export function demoLabel(labels: RunLabels, field: string, stored: string): string | undefined {
  const written = labels.id_labels[field]?.[stored];
  if (written) return written;
  if (field === "entity_id") return entity(labels, stored);
  if (field === "grade_threshold_id") return grade(stored);
  return undefined;
}
