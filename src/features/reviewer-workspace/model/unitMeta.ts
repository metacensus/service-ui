// Reviewer-facing labels and accents for task kinds.

import type { ReviewTaskKind } from "../data/reviewIndex";

export const REVIEW_TASK_KIND_HEADINGS: Record<ReviewTaskKind, string> = {
  inferred: "Inferred",
  derived: "Derived",
  verbatim: "Verbatim",
};

export const KIND_ACCENTS: Record<ReviewTaskKind, { border: string; text: string; bar: string }> = {
  inferred: { border: "border-l-mc-blue-bold", text: "text-mc-blue-bold", bar: "bg-mc-blue-bold" },
  derived: { border: "border-l-mc-blue-mid", text: "text-mc-blue-bold", bar: "bg-mc-blue-mid" },
  verbatim: { border: "border-l-mc-ink-secondary", text: "text-foreground", bar: "bg-mc-ink-secondary" },
};

export function shortPaperId(paperId: string): string {
  // "Northfield_2024_100001" -> "Northfield 2024"
  const parts = paperId.split("_");
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return paperId;
}
