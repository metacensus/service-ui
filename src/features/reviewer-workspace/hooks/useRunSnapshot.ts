"use client";

import { resolveRunId } from "../data/runResolver";
import {
  fetchDemoConfig,
  fetchManifest,
  fetchReviewUnits,
  fetchSchemaSummary,
} from "../data/snapshot";

export const reviewerWorkspaceQueryKeys = {
  run: (runId: string) => ["reviewer-workspace", runId] as const,
  manifest: (runId: string) =>
    ["reviewer-workspace", runId, "manifest"] as const,
  reviewUnits: (runId: string) =>
    ["reviewer-workspace", runId, "review-units"] as const,
  schemaSummary: (runId: string) =>
    ["reviewer-workspace", runId, "schema-summary"] as const,
  demoConfig: (runId: string) =>
    ["reviewer-workspace", runId, "demo-config"] as const,
  paperRows: (runId: string, paperId: string) =>
    ["reviewer-workspace", runId, "rows", paperId] as const,
  reviewState: (runId: string, topicId: string) =>
    ["reviewer-workspace", runId, "review-state", topicId] as const,
  actions: (runId: string, topicId: string) =>
    ["reviewer-workspace", runId, "review-state", topicId, "actions"] as const,
  comments: (runId: string, topicId: string) =>
    [
      "reviewer-workspace",
      runId,
      "review-state",
      topicId,
      "comments",
    ] as const,
  actionHistory: (runId: string, topicId: string) =>
    [
      "reviewer-workspace",
      runId,
      "review-state",
      topicId,
      "action-history",
    ] as const,
  reviewerName: (runId: string, topicId: string) =>
    [
      "reviewer-workspace",
      runId,
      "review-state",
      topicId,
      "reviewer-name",
    ] as const,
};

export function useRunSnapshot(topicId: string) {
  const runId = resolveRunId(topicId);
  const enabled = runId !== null;
  const queryRunId = runId ?? "unresolved";

  const manifestQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.manifest(queryRunId),
    queryFn: () => fetchManifest(queryRunId),
    enabled,
  });

  const reviewUnitsQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.reviewUnits(queryRunId),
    queryFn: () => fetchReviewUnits(queryRunId),
    enabled,
  });

  const schemaSummaryQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.schemaSummary(queryRunId),
    queryFn: () => fetchSchemaSummary(queryRunId),
    enabled,
  });

  const demoConfigQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.demoConfig(queryRunId),
    queryFn: () => fetchDemoConfig(queryRunId),
    enabled,
  });

  return {
    runId,
    manifestQuery,
    reviewUnitsQuery,
    schemaSummaryQuery,
    demoConfigQuery,
  };
}
