import type { Paper, PaperLifecycleStage } from "../../types/Paper";
import { showsWorkingSetMembership } from "./getPaperStatusCount";

/** One paper's working-set membership as the Papers page shows it; lifecycle never reads it. */
export type PaperMembershipStatus = "in" | "out" | "loading" | "unavailable";

export const PAPER_MEMBERSHIP_LABELS: Record<PaperMembershipStatus, string> = {
  in: "In working set",
  out: "Not in working set",
  loading: "Checking working set…",
  unavailable: "Working-set membership unavailable",
};

export type WorkingSetRead = {
  runId: string | null;
  status: "loading" | "ready" | "error";
  /** pmid → active export paper id, from `reviewPaperIdsByPmid(active)`. */
  activeByPmid: ReadonlyMap<string, string>;
};

/**
 * Matches by pmid only, never by title. With no run the read is disabled (and
 * reports "loading" forever), so no run is unavailable, as is a failed read.
 */
export function membershipOfPaper(paper: Pick<Paper, "pmid">, read: WorkingSetRead): PaperMembershipStatus {
  if (read.runId === null || read.status === "error") return "unavailable";
  if (read.status === "loading") return "loading";
  const pmid = paper.pmid ? String(paper.pmid).trim() : "";
  return pmid && read.activeByPmid.has(pmid) ? "in" : "out";
}

/** The status to show at a stage, or null for none: the first two columns and an
 *  unknown placement (Review still loading) show no membership at all. */
export function visibleMembership(
  membership: PaperMembershipStatus,
  stage: PaperLifecycleStage | null
): PaperMembershipStatus | null {
  return stage !== null && showsWorkingSetMembership(stage) ? membership : null;
}
