// Review landing progress, the task page's question states and history, Data's
// reviewStateFor and the Papers adjudication all read the one resolver, so they
// agree on one fixture: the seed on P1 plus a real flag on one P1 question.

import { describe, expect, it } from "vitest";
import { computePaperReviewProgress } from "@/functions/paperReviewProgress";
import { fixtureIndex, fixtureP1Tasks, RUN, stored, T1, T2, T3, T4 } from "./__fixtures__/reviewTaskFixtures";
import { buildTaskDecisionActions, shouldAdvanceAfterDecision } from "./reviewTaskDecisions";
import { combinedState, isDecided, taskDecisionHistory, taskQuestionMembers, taskQuestionStates } from "./reviewTaskPage";
import {
  buildReviewLanding,
  decidedTaskHistory,
  resolveReviewScope,
  REVIEW_TASK_DEFAULT_FILTERS,
  reviewTasksFromIndex,
} from "./reviewTasks";
import { reviewStateFor, type ReviewSeed } from "./rowStatus";

const SEED: ReviewSeed = {
  runId: RUN,
  reviewer: "Seeded demo reviewer (simulated)",
  action: "approve",
  reviewedAt: "2026-09-24T00:00:00.000Z",
  paperIds: ["P1"],
};

const tasks = reviewTasksFromIndex(fixtureIndex());
const all = resolveReviewScope(fixtureIndex(), false, null);
const doc = fixtureP1Tasks();
const t1 = doc.tasks[0];
// Flag T1's first question (members P1 0/a and 1/a), later than the seed.
const flagged = stored(
  buildTaskDecisionActions(doc, t1, [0], { action: "flag", reason: "check" }, RUN, "Ann").map((a) => ({
    ...a,
    reviewed_at: "2026-09-24T12:00:00.000Z",
  }))
);
const landing = (actions: typeof flagged, seed: ReviewSeed | null) =>
  buildReviewLanding({
    tasks,
    scope: all,
    actions,
    filters: REVIEW_TASK_DEFAULT_FILTERS,
    includeNonAmbiguous: true,
    seed,
  });
const decidedIds = (view: ReturnType<typeof landing>) =>
  view.rows.filter((row) => row.progress.cleared).map((row) => row.task.id);

describe("one resolver, four readers", () => {
  it("agree on the seeded paper with a real flag", () => {
    const view = landing(flagged, SEED);
    expect(decidedIds(view).sort()).toEqual([T2.id, T3.id, T4.id].sort());
    expect(view.panel).toMatchObject({ made: 3, total: 7 });

    const states = taskQuestionStates("P1", t1, flagged, SEED);
    expect(states).toEqual(["flagged", "approved"]);
    expect(isDecided(combinedState(states))).toBe(false);

    expect(reviewStateFor(flagged, "P1", 0, "a", SEED)).toBe("flagged");
    expect(reviewStateFor(flagged, "P1", 1, "a", SEED)).toBe("flagged");
    expect(reviewStateFor(flagged, "P1", 2, "b", SEED)).toBe("approved");
    expect(reviewStateFor(flagged, "P2", 0, "a", SEED)).toBe("open");

    const p1 = computePaperReviewProgress(tasks, flagged, SEED).get("P1")!;
    expect(p1).toMatchObject({ decided: 3, total: 4, adjudicated: false });
    expect(p1.rows.filter((row) => row.progress.cleared).map((row) => row.task.id).sort()).toEqual(
      decidedIds(view).sort()
    );
  });

  it("agree again after a reset (no real actions): the seed alone", () => {
    const view = landing([], SEED);
    expect(decidedIds(view).sort()).toEqual([T1.id, T2.id, T3.id, T4.id].sort());
    expect(taskQuestionStates("P1", t1, [], SEED)).toEqual(["approved", "approved"]);
    expect(reviewStateFor([], "P1", 0, "a", SEED)).toBe("approved");
    expect(computePaperReviewProgress(tasks, [], SEED).get("P1")!.adjudicated).toBe(true);
  });

  it("without the seed the resolver behaves as before", () => {
    expect(decidedIds(landing(flagged, null))).toEqual([]);
    expect(taskQuestionStates("P1", t1, flagged)).toEqual(["flagged", "open"]);
    expect(computePaperReviewProgress(tasks, flagged).get("P1")!.adjudicated).toBe(false);
  });
});

describe("histories with the seed", () => {
  it("the task page history shows the real flag above one seeded entry for the members the seed still decides", () => {
    const history = taskDecisionHistory(flagged, [], t1.id, {
      seed: SEED,
      paperId: "P1",
      members: taskQuestionMembers(t1).flat(),
    });
    expect(history).toEqual([
      { action: "flag", reviewedBy: "Ann", reviewedAt: "2026-09-24T12:00:00.000Z", rowEntries: 2 },
      {
        action: "approve",
        reviewedBy: "Seeded demo reviewer (simulated)",
        reviewedAt: "2026-09-24T00:00:00.000Z",
        rowEntries: 1,
        seeded: true,
      },
    ]);
    // A seed-only task: exactly one entry covering every member.
    expect(
      taskDecisionHistory([], [], t1.id, { seed: SEED, paperId: "P1", members: taskQuestionMembers(t1).flat() })
    ).toEqual([
      {
        action: "approve",
        reviewedBy: "Seeded demo reviewer (simulated)",
        reviewedAt: "2026-09-24T00:00:00.000Z",
        rowEntries: 3,
        seeded: true,
      },
    ]);
    // No seed for an unseeded paper.
    expect(taskDecisionHistory([], [], t1.id, { seed: SEED, paperId: "P2", members: taskQuestionMembers(t1).flat() })).toEqual([]);
  });

  it("the landing's decided history lists seed-only tasks as seeded approvals, without crashing", () => {
    const view = landing(flagged, SEED);
    const entries = decidedTaskHistory(view.rows, flagged, SEED);
    expect(entries.map((e) => [e.row.task.id, e.action, e.seeded ?? false])).toEqual(
      view.rows
        .filter((row) => row.progress.cleared)
        .map((row) => [row.task.id, "approve", true])
    );
  });

  it("deciding the flagged question advances: the other question is decided by the seed", () => {
    expect(shouldAdvanceAfterDecision("P1", t1, flagged, { action: "approve" }, [0], SEED)).toBe(true);
    expect(shouldAdvanceAfterDecision("P1", t1, flagged, { action: "approve" }, [0])).toBe(false);
  });
});
