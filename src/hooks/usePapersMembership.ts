"use client";

import { useCallback, useMemo } from "react";
import { resolveRunId } from "@/features/reviewer-workspace/data/runResolver";
import { useWorkingSet } from "@/features/reviewer-workspace/hooks/useWorkingSet";
import { membershipOfPaper, type PaperMembershipStatus } from "@/functions/paperMembership";
import { reviewPaperIdsByPmid } from "@/functions/paperReviewProgress";
import type { Paper } from "../../types/Paper";

export type PapersMembership = {
  /** "unavailable": no run, or the working-set read failed. */
  status: "loading" | "ready" | "unavailable";
  membershipFor: (paper: Pick<Paper, "pmid">) => PaperMembershipStatus;
};

/** Working-set membership per stored paper, read only, from the working-set cache Review shares. */
export function usePapersMembership(topicId: string): PapersMembership {
  const runId = resolveRunId(topicId);
  const { status: readStatus, active } = useWorkingSet(topicId, runId);
  const activeByPmid = useMemo(() => reviewPaperIdsByPmid(active), [active]);

  const status: PapersMembership["status"] =
    runId === null || readStatus === "error" ? "unavailable" : readStatus;
  const membershipFor = useCallback(
    (paper: Pick<Paper, "pmid">) => membershipOfPaper(paper, { runId, status: readStatus, activeByPmid }),
    [runId, readStatus, activeByPmid]
  );
  return { status, membershipFor };
}
