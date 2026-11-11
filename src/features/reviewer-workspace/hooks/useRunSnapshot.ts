"use client";

import { useQuery } from "@tanstack/react-query";
import { resolveRunId } from "../data/runResolver";
import {
  fetchDemoConfig,
  fetchManifest,
  fetchReviewUnits,
  fetchRunLabels,
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
  runLabels: (runId: string) =>
    ["reviewer-workspace", runId, "labels"] as const,
  normalizationManifest: (runId: string) =>
    ["reviewer-workspace", runId, "normalization"] as const,
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
  schemaIndex: (runId: string) =>
    ["reviewer-workspace", runId, "schema-index"] as const,
  workingSet: (runId: string, topicId: string) =>
    ["reviewer-workspace", runId, "working-set", topicId] as const,
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

  const runLabelsQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.runLabels(queryRunId),
    queryFn: () => fetchRunLabels(queryRunId),
    enabled,
    // A failure settles at once: the page shows values as stored rather than waiting on retries.
    retry: false,
  });

  return {
    runId,
    manifestQuery,
    reviewUnitsQuery,
    schemaSummaryQuery,
    demoConfigQuery,
    runLabelsQuery,
  };
}
