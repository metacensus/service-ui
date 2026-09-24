import type { ReviewUnit, StoredReviewAction } from "../types";

export type UnitProgress = {
  cleared: boolean;
  clearedMembers: number;
};

  const latest = new Map<string, StoredReviewAction>();
  for (const a of actions) {
    if (a.row_index == null || a.field == null) continue;
    const prev = latest.get(key);
    if (!prev || a.id > prev.id) latest.set(key, a);
  }
}

export function computeUnitProgress(
): UnitProgress {
  let clearedMembers = 0;
  const paperId = unit.paper_id;

  if (paperId) {
    for (const member of unit.members) {
        clearedMembers += 1;
      }
    }
  }

  return {
    cleared: unit.member_count > 0 && clearedMembers === unit.member_count,
    clearedMembers,
  };
}
