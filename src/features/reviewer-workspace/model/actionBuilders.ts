import type { CorrectedPayload, Identity, ReviewAction } from "../types";
import type { DecisionUnit } from "./unitProgress";

export type TaskDecision =
  | { action: "approve" }
  | { action: "correct"; corrected: CorrectedPayload }
  | { action: "flag"; reason?: string };

const decisionFields = (decision: TaskDecision) =>
  decision.action === "correct"
    ? { corrected: decision.corrected }
    : decision.action === "flag" && decision.reason !== undefined
      ? { flag_reason: decision.reason }
      : {};

export function buildActions(
  unit: DecisionUnit,
  runId: string,
  reviewerName: string,
  decision: TaskDecision,
  identities?: Record<string, Identity | null>
): ReviewAction[] {
  const paperId = unit.paper_id;
  if (!paperId) return [];

  const reviewedAt = new Date().toISOString();
  return unit.members.map((member) => {
    const identity = identities?.[String(member.row_index)];
    return {
      action: decision.action,
      run_id: runId,
      paper_id: paperId,
      row_index: member.row_index,
      field: member.field,
      ...(identity ? { expect_identity: identity } : {}),
      ...decisionFields(decision),
      via_unit: unit.id,
      reviewed_by: reviewerName,
      reviewed_at: reviewedAt,
    };
  });
}
