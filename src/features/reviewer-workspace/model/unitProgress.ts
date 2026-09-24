import type { ReviewUnit, StoredReviewAction } from "../types";
import { isDecided, memberKey, resolveReview, type ReviewSeed } from "./rowStatus";

export { memberKey };

export type DecisionUnit = Pick<ReviewUnit, "id" | "paper_id" | "members" | "member_count">;

export type UnitProgress = {
  cleared: boolean;
  clearedMembers: number;
};

export function latestActionByMember(
  actions: readonly StoredReviewAction[]
): Map<string, StoredReviewAction> {
  const latest = new Map<string, StoredReviewAction>();
  for (const a of actions) {
    if (a.row_index == null || a.field == null) continue;
    const key = memberKey(a.paper_id, a.row_index, a.field);
    const prev = latest.get(key);
    if (!prev || a.id > prev.id) latest.set(key, a);
  }
  return latest;
}

/** Decided (approved or corrected) members, resolved on demand; never an expanded list. */
export type ClearedMembers = {
  isCleared(paperId: string, rowIndex: number, field: string): boolean;
};

export function clearedMembersFor(
  actions: StoredReviewAction[],
  seed?: ReviewSeed | null
): ClearedMembers {
  return {
    isCleared: (paperId, rowIndex, field) =>
      isDecided(resolveReview(actions, paperId, rowIndex, field, seed).state),
  };
}

export function computeUnitProgress(
  unit: DecisionUnit,
  cleared: ClearedMembers | ReadonlySet<string>
): UnitProgress {
  let clearedMembers = 0;
  const paperId = unit.paper_id;

  if (paperId) {
    for (const member of unit.members) {
      if (
        "isCleared" in cleared
          ? cleared.isCleared(paperId, member.row_index, member.field)
          : cleared.has(memberKey(paperId, member.row_index, member.field))
      ) {
        clearedMembers += 1;
      }
    }
  }

  return {
    cleared: unit.member_count > 0 && clearedMembers === unit.member_count,
    clearedMembers,
  };
}
