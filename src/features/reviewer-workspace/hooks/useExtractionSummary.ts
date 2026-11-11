"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { resolveRunId } from "../data/runResolver";
import { fetchManifest } from "../data/snapshot";
import { buildExtractionSummary } from "../model/extractionSummary";
import { useReviewIndex } from "./useReviewIndex";
import { useReviewState } from "./useReviewState";
import { reviewerWorkspaceQueryKeys } from "./useRunSnapshot";

/** The topic's extraction at a glance, from the same snapshot, review index
 *  and review state the Extraction pages read. `runId` is null when no
 *  Comparanda run is linked to the topic. */
export function useExtractionSummary(topicId: string) {
  const runId = resolveRunId(topicId);
  const manifestQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.manifest(runId ?? "unresolved"),
    queryFn: () => fetchManifest(runId!),
    enabled: runId !== null,
  });
  const { query: indexQuery, tasks } = useReviewIndex(runId);
  const { actions, reviewSeed, reviewSeedPending } = useReviewState(topicId, runId);

  const summary = useMemo(
    () =>
      tasks
        ? buildExtractionSummary({
            manifest: manifestQuery.data ?? null,
            tasks,
            actions,
            seed: reviewSeed,
          })
        : null,
    [tasks, manifestQuery.data, actions, reviewSeed]
  );

  return {
    runId,
    summary,
    isPending: runId !== null && (indexQuery.isPending || reviewSeedPending),
    isError: indexQuery.isError,
  };
}
