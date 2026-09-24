"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reviewTasksFromIndex } from "../model/reviewTasks";

  ["reviewer-workspace", runId, "review-index"] as const;

  ["reviewer-workspace", runId, "review-tasks", paperId] as const;

export function useReviewIndex(runId: string | null) {
  const query = useQuery({
    queryKey: reviewIndexQueryKey(runId ?? "unresolved"),
    queryFn: () => fetchReviewIndex(runId!),
    enabled: runId !== null,
  });
  const tasks = useMemo(
    () => (query.data ? reviewTasksFromIndex(query.data) : null),
    [query.data]
  );
  return { query, index: query.data ?? null, tasks };
}
export function useReviewTasksDocument(runId: string | null, paperId: string | null) {
  return useQuery({
    queryKey: reviewTasksQueryKey(runId ?? "unresolved", paperId ?? "none"),
    queryFn: () => fetchReviewTasks(runId!, paperId!),
    enabled: runId !== null && paperId !== null,
