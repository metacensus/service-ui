"use client";

// The shared working set for the Data and Review views: the server's read, and
// saves that change membership only after the server confirms each paper.

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activePaperIds,
  fetchWorkingSet,
  saveWorkingSetMembership,
  saveWorkingSetMemberships,
  withSavedMembership,
  type WorkingSet,
  type WorkingSetMember,
  type WorkingSetMembership,
} from "../data/workingSet";
import { membershipChanges } from "../model/workingSetControls";
import { reviewerWorkspaceQueryKeys } from "./useRunSnapshot";

/** A single-paper save: success carries the server's set after the write. */
export type MembershipSaveResult =
  | { ok: true; workingSet: WorkingSet | null }
  | { ok: false; error: unknown };

/** A several-paper save: how many of the changes it posted went through. */
export type MembershipsSaveResult =
  | { ok: true; saved: number; attempted: number }
  | { ok: false; error: unknown; saved: number; attempted: number };

export type WorkingSetControls = {
  status: "loading" | "ready" | "error";
  active: ReadonlySet<string>;
  /** The server's read while `status` is "ready"; never a guessed set. */
  workingSet: WorkingSet | null;
  revision: number | null;
  members: ReadonlyMap<string, WorkingSetMember>;
  /** Save one paper with the reviewer's reason (origin manual, at the current revision). */
  saveMembership: (
    paperId: string,
    membership: WorkingSetMembership,
    reason: string
  ) => Promise<MembershipSaveResult>;
  /**
   * Save the papers whose membership changes, one after another with one reason
   * (a blank reason saves the default), then re-read the set.
   */
  saveMemberships: (
    paperIds: string[],
    membership: WorkingSetMembership,
    reason: string
  ) => Promise<MembershipsSaveResult>;
  /** Re-read the set, e.g. after an agent-confirmed change. */
  refresh: () => Promise<void>;
};

export function useWorkingSet(topicId: string, runId: string | null): WorkingSetControls {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => reviewerWorkspaceQueryKeys.workingSet(runId ?? "unresolved", topicId),
    [runId, topicId]
  );

  const query = useQuery({
    queryKey,
    queryFn: () => fetchWorkingSet(topicId, runId!),
    enabled: Boolean(runId),
    retry: false,
  });

  const status = query.isPending ? "loading" : query.isError ? "error" : "ready";

  const active = useMemo(
    () => new Set(query.data ? activePaperIds(query.data) : []),
    [query.data]
  );

  const workingSet = status === "ready" ? query.data ?? null : null;
  const members = useMemo(
    () => new Map((workingSet?.members ?? []).map((member) => [member.paper_id, member])),
    [workingSet]
  );

  const saveMembership = useCallback(
    async (paperId: string, membership: WorkingSetMembership, reason: string): Promise<MembershipSaveResult> => {
      const current = queryClient.getQueryData<WorkingSet>(queryKey);
      if (!runId || !current) return { ok: false, error: new Error("The working set has not been read.") };
      await queryClient.cancelQueries({ queryKey });
      try {
        const result = await saveWorkingSetMembership(topicId, runId, {
          paperId,
          membership,
          reason,
          expectedRevision: current.revision,
        });
        queryClient.setQueryData<WorkingSet>(queryKey, (read) => (read ? withSavedMembership(read, result) : read));
        await queryClient.invalidateQueries({ queryKey });
        return { ok: true, workingSet: queryClient.getQueryData<WorkingSet>(queryKey) ?? null };
      } catch (error) {
        // Re-read so a stale save shows the server's latest state.
        await queryClient.invalidateQueries({ queryKey });
        return { ok: false, error };
      }
    },
    [queryClient, queryKey, runId, topicId]
  );

  const saveMemberships = useCallback(
    async (paperIds: string[], membership: WorkingSetMembership, reason: string): Promise<MembershipsSaveResult> => {
      const current = queryClient.getQueryData<WorkingSet>(queryKey);
      if (!runId || !current)
        return { ok: false, error: new Error("The working set has not been read."), saved: 0, attempted: 0 };
      const changes = membershipChanges(paperIds, membership, new Set(activePaperIds(current)), reason);
      if (changes.length === 0) return { ok: true, saved: 0, attempted: 0 };
      await queryClient.cancelQueries({ queryKey });
      let saved = 0;
      try {
        await saveWorkingSetMemberships(topicId, runId, changes, current.revision, (result) => {
          saved += 1;
          queryClient.setQueryData<WorkingSet>(queryKey, (read) => (read ? withSavedMembership(read, result) : read));
        });
        await queryClient.invalidateQueries({ queryKey });
        return { ok: true, saved, attempted: changes.length };
      } catch (error) {
        // Re-read so a failed or stale save shows the server's latest state.
        await queryClient.invalidateQueries({ queryKey });
        return { ok: false, error, saved, attempted: changes.length };
      }
    },
    [queryClient, queryKey, runId, topicId]
  );

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey }), [queryClient, queryKey]);

  // One object per change, so a consumer can memoize on it (Chat's membership context does).
  return useMemo(
    () => ({
      status,
      active,
      workingSet,
      revision: workingSet?.revision ?? null,
      members,
      saveMembership,
      saveMemberships,
      refresh,
    }),
    [status, active, workingSet, members, saveMembership, saveMemberships, refresh]
  );
}
