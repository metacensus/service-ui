import type { ReviewUnit, StoredReviewAction } from "../types";

export type UnitProgress = {
  cleared: boolean;
  clearedMembers: number;
};

}

export function computeUnitProgress(
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
