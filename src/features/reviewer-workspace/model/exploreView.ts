
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

  return step.summary.startsWith("error:");
}

export function isRevisedQuery(step: ExploreStep): boolean {
export function countRevisedQueries(steps: ExploreStep[]): number {
  return steps.filter(isRevisedQuery).length;
}
