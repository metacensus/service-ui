import { beforeEach, describe, expect, it, vi } from "vitest";

const indexedDb = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/indexdb", () => indexedDb);

import { createLocalReviewerPersistence } from "../data/persistence";
import { fixtureIndex, fixtureP1Tasks, RUN, T1 } from "./__fixtures__/reviewTaskFixtures";
import { buildTaskDecisionActions, shouldAdvanceAfterDecision } from "./reviewTaskDecisions";
import {
  isDecided,
  openQuestions,
  taskQuestionMembers,
  taskQuestionStates,
} from "./reviewTaskPage";
import { reviewTasksFromIndex } from "./reviewTasks";
import { clearedMembersFor, computeUnitProgress } from "./unitProgress";

let adapterCount = 0;

/** The existing persistence path, in its memory fallback (no IndexedDB in node). */
function persistence() {
  indexedDb.get.mockResolvedValue(undefined);
  indexedDb.set.mockRejectedValue(new Error("no IndexedDB"));
  return createLocalReviewerPersistence(`topic-decisions-${(adapterCount += 1)}`, RUN);
}

const doc = fixtureP1Tasks();
const t1 = doc.tasks[0];
const t1Unit = reviewTasksFromIndex(fixtureIndex()).find((t) => t.id === T1.id)!.unit;

describe("task questions", () => {
  beforeEach(() => indexedDb.get.mockReset());

  it("a question's members agree with the index's task_list", () => {
    expect(taskQuestionMembers(t1)).toEqual([
      [
        { row_index: 0, field: "a" },
        { row_index: 1, field: "a" },
      ],
      [{ row_index: 2, field: "b" }],
    ]);
    const fromIndex = reviewTasksFromIndex(fixtureIndex()).filter((t) => t.paperId === "P1");
    for (const task of doc.tasks) {
      expect(taskQuestionMembers(task).flat()).toEqual(fromIndex.find((t) => t.id === task.id)!.unit.members);
    }
  });
});

describe("deciding checked questions writes exactly their members", () => {
  it("approving the checked questions writes exactly their members, one action each", async () => {
    const adapter = persistence();
    const actions = buildTaskDecisionActions(doc, t1, [0], { action: "approve" }, RUN, "Reviewer");
    expect(actions.map(({ reviewed_at: _, ...a }) => a)).toEqual([
      { action: "approve", run_id: RUN, paper_id: "P1", row_index: 0, field: "a", expect_identity: { key: "row-0" }, via_unit: T1.id, reviewed_by: "Reviewer" },
      { action: "approve", run_id: RUN, paper_id: "P1", row_index: 1, field: "a", expect_identity: { key: "row-1" }, via_unit: T1.id, reviewed_by: "Reviewer" },
    ]);
    await adapter.bulkUpsertActions(RUN, actions);
    const saved = await adapter.listActions(RUN);
    expect(saved).toHaveLength(2);

    // The unchecked question stays open, so the task is not decided.
    const states = taskQuestionStates("P1", t1, saved);
    expect(states.map(isDecided)).toEqual([true, false]);
    expect(openQuestions(states)).toEqual([1]);
    expect(computeUnitProgress(t1Unit, clearedMembersFor(saved))).toEqual({ cleared: false, clearedMembers: 2 });
    expect(shouldAdvanceAfterDecision("P1", t1, [], { action: "approve" }, [0])).toBe(false);

    // Deciding the last question decides the task, and the view may advance.
    expect(shouldAdvanceAfterDecision("P1", t1, saved, { action: "approve" }, [1])).toBe(true);
    await adapter.bulkUpsertActions(RUN, buildTaskDecisionActions(doc, t1, [1], { action: "approve" }, RUN, "Reviewer"));
    const after = await adapter.listActions(RUN);
    expect(after).toHaveLength(3);
    expect(openQuestions(taskQuestionStates("P1", t1, after))).toEqual([]);
    expect(computeUnitProgress(t1Unit, clearedMembersFor(after)).cleared).toBe(true);
  });

  it("whole-task approval is every question checked", () => {
    const whole = buildTaskDecisionActions(doc, t1, "all", { action: "approve" }, RUN, "R");
    const checked = buildTaskDecisionActions(doc, t1, [1, 0], { action: "approve" }, RUN, "R");
    const strip = (xs: typeof whole) => xs.map(({ reviewed_at: _, ...a }) => a);
    expect(strip(whole)).toEqual(strip(checked));
    expect(whole.map((a) => [a.row_index, a.field])).toEqual([[0, "a"], [1, "a"], [2, "b"]]);
    expect(shouldAdvanceAfterDecision("P1", t1, [], { action: "approve" }, "all")).toBe(true);
  });

  it("a flag leaves the question open and never advances; a correction decides it", async () => {
    const adapter = persistence();
    const flag = buildTaskDecisionActions(doc, t1, [1], { action: "flag", reason: "wrong row" }, RUN, "R");
    expect(flag.map((a) => [a.action, a.flag_reason, a.via_unit])).toEqual([["flag", "wrong row", T1.id]]);
    await adapter.bulkUpsertActions(RUN, flag);
    expect(openQuestions(taskQuestionStates("P1", t1, await adapter.listActions(RUN)))).toEqual([0, 1]);
    expect(shouldAdvanceAfterDecision("P1", t1, [], { action: "flag" }, "all")).toBe(false);

    const correction = { value: 2, note: "table says 2" };
    const correct = buildTaskDecisionActions(doc, t1, [1], { action: "correct", corrected: correction }, RUN, "R");
    expect(correct).toHaveLength(1);
    expect(correct[0]).toMatchObject({ action: "correct", corrected: correction, row_index: 2, field: "b", via_unit: T1.id });
    await adapter.bulkUpsertActions(RUN, correct);
    const saved = await adapter.listActions(RUN);
    // bulkUpsertActions keeps the latest action per (paper, row, field).
    expect(saved.map((a) => a.action)).toEqual(["correct"]);
    expect(openQuestions(taskQuestionStates("P1", t1, saved))).toEqual([0]);
  });

  it("a row with no recorded identity gets no expect_identity; other tasks are untouched", () => {
    const t4 = doc.tasks[3];
    const [action] = buildTaskDecisionActions(doc, t4, "all", { action: "approve" }, RUN, "R");
    expect(action).toMatchObject({ row_index: 4, field: "a", via_unit: t4.id });
    expect(action).not.toHaveProperty("expect_identity");
    const other = buildTaskDecisionActions(doc, t1, "all", { action: "approve" }, RUN, "R");
    expect(other.some((a) => a.row_index === 4)).toBe(false);
  });
});
