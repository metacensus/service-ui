"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLocalReviewerPersistence } from "../data/persistence";
import { reviewSeedQuery } from "../data/reviewSeed";
import { reviewSeedForRun } from "../model/rowStatus";
import type {
  NewReviewComment,
  ReviewAction,
  ReviewerPersistenceAdapter,
} from "../types";
import { reviewerWorkspaceQueryKeys } from "./useRunSnapshot";

function requireAdapter(
  adapter: ReviewerPersistenceAdapter | null
): ReviewerPersistenceAdapter {
  if (!adapter) throw new Error("No reviewer persistence adapter available.");
  return adapter;
}

export function useReviewState(topicId: string, runId: string | null) {
  const queryClient = useQueryClient();
  const enabled = runId !== null;
  const queryRunId = runId ?? "unresolved";

  const adapter = useMemo(
    () => (runId ? createLocalReviewerPersistence(topicId, runId) : null),
    [topicId, runId]
  );

  const storageModeKey = [
    "reviewer-workspace",
    queryRunId,
    "review-state",
    topicId,
    "storage-mode",
  ] as const;

  const storageModeQuery = useQuery({
    queryKey: storageModeKey,
    queryFn: () => requireAdapter(adapter).getStorageMode(),
    enabled,
  });

  const reviewerNameQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.reviewerName(queryRunId, topicId),
    queryFn: () => requireAdapter(adapter).getReviewerName(),
    enabled,
  });

  const actionsQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.actions(queryRunId, topicId),
    queryFn: () => requireAdapter(adapter).listActions(queryRunId),
    enabled,
  });

  const actionHistoryQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.actionHistory(queryRunId, topicId),
    queryFn: () => requireAdapter(adapter).listActionHistory(queryRunId),
    enabled,
  });

  const commentsQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.comments(queryRunId, topicId),
    queryFn: () => requireAdapter(adapter).listComments(queryRunId),
    enabled,
  });

  const seedQuery = useQuery({ ...reviewSeedQuery(queryRunId), enabled });

  const invalidateActions = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: reviewerWorkspaceQueryKeys.actions(queryRunId, topicId),
      }),
      queryClient.invalidateQueries({
        queryKey: reviewerWorkspaceQueryKeys.actionHistory(queryRunId, topicId),
      }),
    ]);

  const invalidateComments = () =>
    queryClient.invalidateQueries({
      queryKey: reviewerWorkspaceQueryKeys.comments(queryRunId, topicId),
    });

  const invalidateReviewerName = () =>
    queryClient.invalidateQueries({
      queryKey: reviewerWorkspaceQueryKeys.reviewerName(queryRunId, topicId),
    });

  const invalidateReviewState = () =>
    queryClient.invalidateQueries({
      queryKey: reviewerWorkspaceQueryKeys.reviewState(queryRunId, topicId),
    });

  const invalidateStorageMode = () =>
    queryClient.invalidateQueries({ queryKey: storageModeKey });

  const upsertActionMutation = useMutation({
    mutationFn: (action: ReviewAction) =>
      requireAdapter(adapter).upsertAction(action),
    onSuccess: invalidateActions,
    onSettled: invalidateStorageMode,
  });

  const bulkUpsertActionsMutation = useMutation({
    mutationFn: (actions: ReviewAction[]) =>
      requireAdapter(adapter).bulkUpsertActions(queryRunId, actions),
    onSuccess: invalidateActions,
    onSettled: invalidateStorageMode,
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: NewReviewComment) =>
      requireAdapter(adapter).addComment(comment),
    onSuccess: invalidateComments,
    onSettled: invalidateStorageMode,
  });

  const deleteActionMutation = useMutation({
    mutationFn: (id: number) => requireAdapter(adapter).deleteAction(id),
    onSuccess: invalidateActions,
    onSettled: invalidateStorageMode,
  });

  const setReviewerNameMutation = useMutation({
    mutationFn: (name: string) => requireAdapter(adapter).setReviewerName(name),
    onSuccess: invalidateReviewerName,
    onSettled: invalidateStorageMode,
  });

  const resetReviewStateMutation = useMutation({
    mutationFn: () => requireAdapter(adapter).resetReviewState(queryRunId),
    onSuccess: invalidateReviewState,
    onSettled: invalidateStorageMode,
  });

  return {
    actions: actionsQuery.data ?? [],
    /** The static seed baseline for this run, or null. Never stored. */
    reviewSeed: reviewSeedForRun(seedQuery.data, runId),
    /** True until the seed fetch settles (found, absent or failed): gate on it with the index. */
    reviewSeedPending: enabled && seedQuery.isPending,
    actionHistory: actionHistoryQuery.data ?? [],
    comments: commentsQuery.data ?? [],
    reviewerName: reviewerNameQuery.data ?? null,
    storageMode: storageModeQuery.data ?? "persistent",
    actionsQuery,
    actionHistoryQuery,
    commentsQuery,
    reviewerNameQuery,
    storageModeQuery,
    upsertAction: upsertActionMutation.mutateAsync,
    deleteAction: deleteActionMutation.mutateAsync,
    bulkUpsertActions: bulkUpsertActionsMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    setReviewerName: setReviewerNameMutation.mutateAsync,
    resetReviewState: resetReviewStateMutation.mutateAsync,
    mutations: {
      upsertAction: upsertActionMutation,
      deleteAction: deleteActionMutation,
      bulkUpsertActions: bulkUpsertActionsMutation,
      addComment: addCommentMutation,
      setReviewerName: setReviewerNameMutation,
      resetReviewState: resetReviewStateMutation,
    },
  };
}
