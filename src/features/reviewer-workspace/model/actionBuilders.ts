
export type TaskDecision =
  | { action: "approve" }
  | { action: "correct"; corrected: CorrectedPayload }
  | { action: "flag"; reason?: string };


  runId: string,
  reviewerName: string,
): ReviewAction[] {
  const paperId = unit.paper_id;
  if (!paperId) return [];

  const reviewedAt = new Date().toISOString();
  return unit.members.map((member) => {
    return {
      run_id: runId,
      paper_id: paperId,
      row_index: member.row_index,
      field: member.field,
      ...(identity ? { expect_identity: identity } : {}),
      via_unit: unit.id,
      reviewed_by: reviewerName,
      reviewed_at: reviewedAt,
    };
  });
}
