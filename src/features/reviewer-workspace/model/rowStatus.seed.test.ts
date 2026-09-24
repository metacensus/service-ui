import { describe, expect, it } from "vitest";
import type { StoredReviewAction } from "../types";
import {
  latestActionFor,
  latestReviewActions,
  resolveReview,
  reviewSeedForRun,
  reviewStateFor,
  type ReviewSeed,
} from "./rowStatus";

const SEED: ReviewSeed = {
  runId: "run-1",
  reviewer: "Seeded demo reviewer (simulated)",
  action: "approve",
  reviewedAt: "2026-09-24T00:00:00.000Z",
  paperIds: ["SEEDED"],
};

let nextId = 1;
function action(
  kind: StoredReviewAction["action"],
  paperId: string,
  rowIndex = 0,
  field = "dose",
  id = nextId++
): StoredReviewAction {
  return {
    id,
    created_at: "2026-09-24T10:00:00.000Z",
    action: kind,
    run_id: "run-1",
    paper_id: paperId,
    row_index: rowIndex,
    field,
    reviewed_by: "Ann",
    reviewed_at: "2026-09-24T10:00:00.000Z",
  };
}

describe("the one review-state resolver", () => {
  it("a seeded paper with no real action reads approved, marked seeded", () => {
    expect(resolveReview([], "SEEDED", 0, "dose", SEED)).toEqual({
      state: "approved",
      action: null,
      seeded: true,
    });
    expect(reviewStateFor([], "SEEDED", 3, "any_field", SEED)).toBe("approved");
  });

  it("a real flag, correct or approve on a seeded paper wins over the seed", () => {
    for (const [kind, state] of [
      ["flag", "flagged"],
      ["correct", "corrected"],
      ["approve", "approved"],
    ] as const) {
      const real = action(kind, "SEEDED");
      expect(resolveReview([real], "SEEDED", 0, "dose", SEED)).toEqual({
        state,
        action: real,
        seeded: false,
      });
    }
    // Only the member with the real action changes; the rest stay seeded.
    expect(resolveReview([action("flag", "SEEDED")], "SEEDED", 1, "dose", SEED).seeded).toBe(true);
  });

  it("an unseeded paper with no action is open", () => {
    expect(resolveReview([], "OTHER", 0, "dose", SEED)).toEqual({
      state: "open",
      action: null,
      seeded: false,
    });
  });

  it("the latest real action by id decides, whatever the array order", () => {
    const flag = action("flag", "OTHER", 0, "dose", 20);
    const approve = action("approve", "OTHER", 0, "dose", 10);
    expect(reviewStateFor([flag, approve], "OTHER", 0, "dose")).toBe("flagged");
    expect(latestActionFor([approve, flag], "OTHER", 0, "dose")).toBe(flag);
  });

  it("adjudicate_gold is ignored", () => {
    const gold = action("adjudicate_gold", "SEEDED", 0, "dose", 99);
    expect(resolveReview([gold], "SEEDED", 0, "dose", SEED)).toMatchObject({
      state: "approved",
      seeded: true,
    });
    const approve = action("approve", "OTHER", 0, "dose", 1);
    expect(reviewStateFor([approve, { ...gold, paper_id: "OTHER" }], "OTHER", 0, "dose")).toBe(
      "approved"
    );
    expect(latestActionFor([{ ...gold, paper_id: "OTHER" }], "OTHER", 0, "dose")).toBeNull();
  });

  it("a different run gets no seed", () => {
    expect(reviewSeedForRun(SEED, "run-1")).toBe(SEED);
    expect(reviewSeedForRun(SEED, "run-2")).toBeNull();
    expect(reviewSeedForRun(SEED, null)).toBeNull();
    expect(reviewSeedForRun(null, "run-1")).toBeNull();
    expect(reviewStateFor([], "SEEDED", 0, "dose", reviewSeedForRun(SEED, "run-2"))).toBe("open");
  });

  it("without a seed, the four-argument signature is unchanged", () => {
    expect(reviewStateFor([], "SEEDED", 0, "dose")).toBe("open");
  });

  it("builds the latest-per-member lookup once per actions array", () => {
    const actions = [action("approve", "OTHER")];
    expect(latestReviewActions(actions)).toBe(latestReviewActions(actions));
    expect(latestReviewActions([...actions])).not.toBe(latestReviewActions(actions));
  });
});
