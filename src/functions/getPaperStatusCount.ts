import { PAPER_LIFECYCLE_STAGES, type Paper, type PaperLifecycleStage, type PaperStatus } from "../../types/Paper";

export { PAPER_LIFECYCLE_STAGES };

/** The one stored-status → stage mapping. Adjudication (every Review task decided)
 *  overrides it; the other stages are seeded placements. */
export function getPaperLifecycleStage(paper: Pick<Paper, "status">, adjudicated = false): PaperLifecycleStage {
  if (adjudicated) return "Papers Adjudicated";
  switch (paper.status) {
    case "Being Reviewed":
      return "Abstracts Approved for Full-Text Review";
    case "Pending Approval":
    case "Accepted":
      return "Papers Extracted";
    default:
      return "Abstracts Gathered";
  }
}

/** Working-set membership shows only once a paper is extracted: never in the first two columns.
 *  Takes the stage `getPaperLifecycleStage` produced, so it follows the board's placement. */
export function showsWorkingSetMembership(stage: PaperLifecycleStage): boolean {
  return stage === "Papers Extracted" || stage === "Papers Adjudicated";
}

export const getPaperStatusCount = (
  papers: Paper[],
  status: PaperStatus | PaperLifecycleStage,
  isAdjudicated: (paper: Paper) => boolean = () => false
): number => {
  if (!PAPER_LIFECYCLE_STAGES.includes(status as PaperLifecycleStage)) {
    return (papers ?? []).filter(paper => paper.status === status).length;
  }
  return [...new Map((papers ?? []).map(paper => [paper.id, paper])).values()]
    .filter(paper => getPaperLifecycleStage(paper, isAdjudicated(paper)) === status).length;
};
