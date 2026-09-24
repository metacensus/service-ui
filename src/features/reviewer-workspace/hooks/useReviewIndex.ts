"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchReviewIndex, fetchReviewTasks } from "../data/reviewIndex";
import { reviewTasksFromIndex } from "../model/reviewTasks";

const staticSeedFile = { staleTime: Infinity, retry: false } as const;

const reviewIndexQueryKey = (runId: string) =>
  ["reviewer-workspace", runId, "review-index"] as const;

const reviewTasksQueryKey = (runId: string, paperId: string) =>
  ["reviewer-workspace", runId, "review-tasks", paperId] as const;

export function useReviewIndex(runId: string | null) {
  const query = useQuery({
    queryKey: reviewIndexQueryKey(runId ?? "unresolved"),
    queryFn: () => fetchReviewIndex(runId!),
    enabled: runId !== null,
    ...staticSeedFile,
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
    ...staticSeedFile,
  });
}
