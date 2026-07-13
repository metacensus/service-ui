"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLocalReviewerPersistence } from "../data/persistence";
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

  const upsertActionMutation = useMutation({
    mutationFn: (action: ReviewAction) =>
      requireAdapter(adapter).upsertAction(action),
    onSuccess: invalidateActions,
  });

  const bulkUpsertActionsMutation = useMutation({
    mutationFn: (actions: ReviewAction[]) =>
      requireAdapter(adapter).bulkUpsertActions(queryRunId, actions),
    onSuccess: invalidateActions,
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: NewReviewComment) =>
      requireAdapter(adapter).addComment(comment),
    onSuccess: invalidateComments,
  });

  const deleteActionMutation = useMutation({
    mutationFn: (id: number) => requireAdapter(adapter).deleteAction(id),
    onSuccess: invalidateActions,
  });

  const setReviewerNameMutation = useMutation({
    mutationFn: (name: string) => requireAdapter(adapter).setReviewerName(name),
    onSuccess: invalidateReviewerName,
  });

  const resetReviewStateMutation = useMutation({
    mutationFn: () => requireAdapter(adapter).resetReviewState(queryRunId),
    onSuccess: invalidateReviewState,
  });

  return {
    actions: actionsQuery.data ?? [],
    actionHistory: actionHistoryQuery.data ?? [],
    comments: commentsQuery.data ?? [],
    reviewerName: reviewerNameQuery.data ?? null,
    actionsQuery,
    actionHistoryQuery,
    commentsQuery,
    reviewerNameQuery,
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
