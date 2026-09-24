"use client";

import { useCallback, useMemo } from "react";
import { resolveRunId } from "@/features/reviewer-workspace/data/runResolver";
import { useReviewIndex } from "@/features/reviewer-workspace/hooks/useReviewIndex";
import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";
import type { ReviewSeed } from "@/features/reviewer-workspace/model/rowStatus";
import type { StoredReviewAction } from "@/features/reviewer-workspace/types";
import {
  computePaperReviewProgress,
  progressForPaper,
  reviewPaperIdsByPmid,
  type PaperReviewProgress,
} from "@/functions/paperReviewProgress";
import type { Paper } from "../../types/Paper";

export type PapersReview = {
  /** "unavailable": no run, or the index or the Review store failed; place by stored status. */
  status: "loading" | "ready" | "unavailable";
  progressFor: (paper: Paper) => PaperReviewProgress | null;
  isAdjudicated: (paper: Paper) => boolean;
  actions: StoredReviewAction[];
  seed: ReviewSeed | null;
};

/** Review task progress per stored paper, from the shared index cache and Review store. */
export function usePaperReviewProgress(topicId: string): PapersReview {
  const runId = resolveRunId(topicId);
  const { query: indexQuery, index, tasks } = useReviewIndex(runId);


  const byPmid = useMemo(
    () => reviewPaperIdsByPmid(index ? index.papers.map((paper) => paper.paper_id) : []),
    [index]
  );
  const progress = useMemo(
    () =>
      status === "ready" && tasks
        ? computePaperReviewProgress(tasks, actions, reviewSeed)
        : new Map<string, PaperReviewProgress>(),
    [status, tasks, actions, reviewSeed]
  );
  const progressFor = useCallback(
    (paper: Paper) => progressForPaper(paper, byPmid, progress),
    [byPmid, progress]
  );
  const isAdjudicated = useCallback(
    (paper: Paper) => progressFor(paper)?.adjudicated ?? false,
    [progressFor]
  );
  return { status, progressFor, isAdjudicated, actions, seed: reviewSeed };
}
