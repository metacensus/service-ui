import type { ExploreEvidence, ExploreStep } from "../types";

/**
 * Strip the trailing PMID bracket a manifest title carries, e.g.
 * "Amstutz 2009 (Pharmacogenomics) [19530960]" -> "... (Pharmacogenomics)".
 */
export function displayTitle(title: string): string {
  return title.replace(/\s*\[\d+\]\s*$/, "");
}

/**
 * Rewrite a backend step summary into reviewer-facing language. The API
 * describes its own work in SQL terms ("3 statements; 10 rows returned"),
 * which is the right wire format but the wrong thing to show a clinician.
 */
export function stepSummaryLabel(summary: string): string {
  return summary
    .replace(/\bstatements\b/, "search steps")
    .replace(/\bstatement\b/, "search step")
    .replace(/\brows returned\b/, "results reviewed")
    .replace(/\brow returned\b/, "result reviewed");
}

const MEMBERSHIP_UPDATE = "membership_update";

function isFailedStep(step: ExploreStep): boolean {
  return step.summary.startsWith("error:");
}

/**
 * A step the agent reported as failed, shown as a revised query in the UI. A
 * failed working-set change is not a query and is labelled on its own.
 */
export function isRevisedQuery(step: ExploreStep): boolean {
  return isFailedStep(step) && step.tool !== MEMBERSHIP_UPDATE;
}

export function countRevisedQueries(steps: ExploreStep[]): number {
  return steps.filter(isRevisedQuery).length;
}

/** A working-set change the agent reported as failed; labelled and styled as a failure. */
export function isFailedMembershipUpdate(step: ExploreStep): boolean {
  return step.tool === MEMBERSHIP_UPDATE && isFailedStep(step);
}

/** Reviewer-facing label for one analysis step. */
export function stepLabel(step: ExploreStep): string {
  if (isFailedMembershipUpdate(step)) return "Working-set change failed · nothing changed";
  if (step.tool === MEMBERSHIP_UPDATE) return `Working-set change · ${step.summary}`;
  if (isFailedStep(step)) return "The agent revised an unsuccessful query.";
  return step.tool === "execute_sql"
    ? `Evidence search · ${stepSummaryLabel(step.summary)}`
    : `Source check · ${step.summary}`;
}

/** True when the agent tried a working-set change; a failed one may mean the set moved. */
export function hasMembershipUpdate(steps: ExploreStep[]): boolean {
  return steps.some((step) => step.tool === MEMBERSHIP_UPDATE);
}

/**
 * Every source of the linked value: the response's evidence items for the
 * same paper, row and field, ordered by `source_index`. The linked item is
 * always included, so a single source is a list of one.
 */
export function valueSources(evidence: ExploreEvidence[], linked: ExploreEvidence): ExploreEvidence[] {
  const sources = evidence.filter(
    (item) =>
      item.paper_id === linked.paper_id &&
      item.row_index === linked.row_index &&
      item.field === linked.field
  );
  if (!sources.some((item) => item.evidence_id === linked.evidence_id)) sources.push(linked);
  return sources.sort((a, b) => a.source_index - b.source_index);
}

export type EvidenceKind = "verbatim" | "derived" | "inferred";

/** The value's kind chip: the stated derivation kind, else the provenance type. */
export function evidenceKind(item: Pick<ExploreEvidence, "derivation_kind" | "provenance_type">): EvidenceKind {
  for (const candidate of [item.derivation_kind, item.provenance_type]) {
    if (candidate === "verbatim" || candidate === "derived" || candidate === "inferred") return candidate;
  }
  return item.provenance_type === "paper" || item.provenance_type == null ? "verbatim" : "derived";
}
