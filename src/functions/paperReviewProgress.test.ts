import { describe, expect, it } from "vitest";
import {
  fixtureIndex,
  RUN,
  stored,
  T1,
  T2,
  T3,
  T4,
} from "@/features/reviewer-workspace/model/__fixtures__/reviewTaskFixtures";
import { buildActions, type TaskDecision } from "@/features/reviewer-workspace/model/actionBuilders";
import { reviewTasksFromIndex } from "@/features/reviewer-workspace/model/reviewTasks";
import type { ReviewSeed } from "@/features/reviewer-workspace/model/rowStatus";
import type { ReviewAction } from "@/features/reviewer-workspace/types";
import type { ReviewIndex } from "@/features/reviewer-workspace/data/reviewIndex";
import type { Paper } from "../../types/Paper";
import { getPaperLifecycleStage } from "./getPaperStatusCount";
import {
  computePaperReviewProgress,
  progressForPaper,
  reviewPaperIdsByPmid,
  seededTaskIds,
} from "./paperReviewProgress";

const tasks = reviewTasksFromIndex(fixtureIndex());
const byId = new Map(tasks.map((t) => [t.id, t]));
const decide = (decision: TaskDecision, ...ids: string[]): ReviewAction[] =>
  ids.flatMap((id) => buildActions(byId.get(id)!.unit, RUN, "Reviewer", decision));
const approve = (...ids: string[]) => decide({ action: "approve" }, ...ids);
const P1_TASKS = [T1.id, T2.id, T3.id, T4.id];
const SEED: ReviewSeed = {
  runId: RUN,
  reviewer: "Seeded demo reviewer (simulated)",
  action: "approve",
  reviewedAt: "2026-09-24T00:00:00.000Z",
  paperIds: ["P1"],
};

describe("paper adjudication from Review tasks", () => {
  it("all tasks approved: adjudicated", () => {
    const p1 = computePaperReviewProgress(tasks, stored(approve(...P1_TASKS))).get("P1")!;
    expect(p1).toMatchObject({ decided: 4, total: 4, adjudicated: true });
  });

  it("one clean task open: not adjudicated", () => {
    const p1 = computePaperReviewProgress(tasks, stored(approve(T1.id, T3.id, T4.id))).get("P1")!;
    expect(p1).toMatchObject({ decided: 3, total: 4, adjudicated: false });
  });

  it("a flag leaves the task open: not adjudicated", () => {
    const all = stored(approve(...P1_TASKS));
    const flagged = stored(decide({ action: "flag", reason: "check" }, T4.id), all);
    expect(computePaperReviewProgress(tasks, flagged).get("P1")!.adjudicated).toBe(false);
  });

  it("a correct counts as decided", () => {
    const actions = stored([
      ...approve(T1.id, T2.id, T4.id),
      ...decide({ action: "correct", corrected: { value: 2 } }, T3.id),
    ]);
    expect(computePaperReviewProgress(tasks, actions).get("P1")!.adjudicated).toBe(true);
  });

  it("a paper with no tasks, or with no index entry, is never adjudicated", () => {
    const index: ReviewIndex = {
      ...fixtureIndex(),
      papers: [...fixtureIndex().papers, { paper_id: "Empty_2020_111", fields: [], task_list: [] }],
    } as ReviewIndex;
    const progress = computePaperReviewProgress(reviewTasksFromIndex(index), [], {
      ...SEED,
      paperIds: ["Empty_2020_111"],
    });
    expect(progress.has("Empty_2020_111")).toBe(false);
    const byPmid = reviewPaperIdsByPmid(index.papers.map((p) => p.paper_id));
    expect(progressForPaper({ pmid: "111" }, byPmid, progress)).toBeNull();
    expect(progressForPaper({ pmid: "999" }, byPmid, progress)).toBeNull();
    expect(progressForPaper({ pmid: "" }, byPmid, progress)).toBeNull();
  });

  it("working-set membership plays no part", () => {
    const p1 = computePaperReviewProgress(tasks, stored(approve(...P1_TASKS))).get("P1")!;
    const paper = { id: 1, status: "Pending Approval" } as Paper;
    for (const workingSetMembership of [true, false, undefined]) {
      expect(getPaperLifecycleStage({ ...paper, workingSetMembership } as Paper, p1.adjudicated)).toBe(
        "Papers Adjudicated"
      );
    }
  });

  it("reopening a task removes adjudication without changing stored status", () => {
    const done = stored(approve(...P1_TASKS));
    const reopened = stored(decide({ action: "flag", reason: "recheck" }, T1.id), done);
    const accepted = { id: 1, status: "Accepted" } as Paper;
    const rejected = { id: 2, status: "Rejected" } as Paper;
    const adjudicated = (actions: typeof done) =>
      computePaperReviewProgress(tasks, actions).get("P1")!.adjudicated;
    expect(getPaperLifecycleStage(accepted, adjudicated(done))).toBe("Papers Adjudicated");
    expect(getPaperLifecycleStage(accepted, adjudicated(reopened))).toBe("Papers Extracted");
    expect(getPaperLifecycleStage(rejected, adjudicated(done))).toBe("Papers Adjudicated");
    expect(getPaperLifecycleStage(rejected, adjudicated(reopened))).toBe("Abstracts Gathered");
    expect(accepted.status).toBe("Accepted");
  });
});

describe("tier progress", () => {
  it("Tier 1 is Inferred + Derived, Tier 2 Verbatim, both levels counted, ambiguous apart", () => {
    const p1 = computePaperReviewProgress(tasks, stored(approve(T1.id, T4.id))).get("P1")!;
    expect(p1.tiers).toEqual({
      tier1: { decided: 1, total: 3, ambiguousDecided: 1, ambiguousTotal: 2 },
      tier2: { decided: 1, total: 1, ambiguousDecided: 0, ambiguousTotal: 0 },
    });
  });
});

describe("with the seed baseline", () => {
  it("a seeded paper is adjudicated with no stored actions; its tasks are marked seeded", () => {
    const progress = computePaperReviewProgress(tasks, [], SEED);
    const p1 = progress.get("P1")!;
    expect(p1).toMatchObject({ decided: 4, total: 4, adjudicated: true });
    expect(progress.get("P2")!.adjudicated).toBe(false);
    expect([...seededTaskIds(p1.rows, [], SEED)].sort()).toEqual([...P1_TASKS].sort());
  });

  it("a real flag on a seeded paper reopens it; a real approve keeps it, no longer seeded", () => {
    const flagged = stored(decide({ action: "flag", reason: "check" }, T2.id));
    const p1 = computePaperReviewProgress(tasks, flagged, SEED).get("P1")!;
    expect(p1).toMatchObject({ decided: 3, adjudicated: false });
    const approved = stored(approve(T2.id));
    const again = computePaperReviewProgress(tasks, approved, SEED).get("P1")!;
    expect(again.adjudicated).toBe(true);
    expect(seededTaskIds(again.rows, approved, SEED).has(T2.id)).toBe(false);
  });

  it("maps stored papers to Review papers by the pmid suffix", () => {
    const byPmid = reviewPaperIdsByPmid(["Northfield_2018_11111111", "south_field_2017_22222222"]);
    expect(byPmid.get("11111111")).toBe("Northfield_2018_11111111");
    expect(byPmid.get("22222222")).toBe("south_field_2017_22222222");
  });
});
