import { describe, expect, it } from "vitest";
import type { ReviewUnit, StoredReviewAction } from "../types";

const unit: ReviewUnit = {
  id: "unit-1",
  kind: "read_item",
  tier: 1,
  gate_blocking: true,
  title: "Review critical values",
  why: "These values affect the analysis.",
  paper_id: "paper-1",
  members: [
    { row_index: 0, field: "outcome" },
    { row_index: 1, field: "outcome" },
  ],
  member_count: 2,
  suggested_action: "read_each",
};

function action(
  kind: StoredReviewAction["action"],
  rowIndex: number
): StoredReviewAction {
  return {
    id: rowIndex + 1,
    created_at: "2026-07-13T00:00:00.000Z",
    action: kind,
    run_id: "run-1",
    paper_id: "paper-1",
    row_index: rowIndex,
    field: "outcome",
    reviewed_by: "Reviewer",
    reviewed_at: "2026-07-13T00:00:00.000Z",
  };
}

describe("computeUnitProgress", () => {
  it("only clears members with approved or corrected decisions", () => {
    expect(
    ).toEqual({ cleared: false, clearedMembers: 1 });

    expect(
    ).toEqual({ cleared: true, clearedMembers: 2 });
  });

  it("does not count actions from another paper", () => {
    const otherPaper = { ...action("approve", 0), paper_id: "paper-2" };
      cleared: false,
      clearedMembers: 0,
    });
  });
});
