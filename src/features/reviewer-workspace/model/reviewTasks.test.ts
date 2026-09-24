import { describe, expect, it } from "vitest";
import { activePaperIds, fetchWorkingSet, type WorkingSet } from "../data/workingSet";
import type { ReviewAction, StoredReviewAction } from "../types";
import {
  DISPLAY_ORDER,
  fixtureIndex,
  RUN,
  stored,
  stubFetch,
  T1,
  T2,
  T3,
  T4,
  TOPIC,
  U1,
  U2,
  V1,
  workingSetOf,
} from "./__fixtures__/reviewTaskFixtures";
import { buildActions } from "./actionBuilders";
import {
  buildReviewLanding,
  computeReviewPanelStats,
  decidedTaskHistory,
  filterReviewTaskRows,
  nextUndecidedTask,
  resolveReviewScope,
  REVIEW_TASK_DEFAULT_FILTERS,
  reviewKindSections,
  reviewTaskRows,
  reviewTasksFromIndex,
  type ReviewTask,
  type ReviewTaskFilters,
} from "./reviewTasks";
import { clearedMembersFor, computeUnitProgress } from "./unitProgress";

const tasks = reviewTasksFromIndex(fixtureIndex());
const byId = new Map(tasks.map((t) => [t.id, t]));
const approve = (...ids: string[]): ReviewAction[] =>
  ids.flatMap((id) => buildActions(byId.get(id)!.unit, RUN, "Reviewer", { action: "approve" }));
const active = (workingSet: WorkingSet) => new Set(activePaperIds(workingSet));

function landing(
  scope: ReturnType<typeof resolveReviewScope>,
  actions: StoredReviewAction[] = [],
  filters: ReviewTaskFilters = REVIEW_TASK_DEFAULT_FILTERS,
  includeNonAmbiguous = false
) {
  return buildReviewLanding({ tasks, scope, actions, filters, includeNonAmbiguous });
}

const ids = (rows: { task: ReviewTask }[]) => rows.map((row) => row.task.id);
const papersOf = (rows: { task: ReviewTask }[]) => [...new Set(rows.map((r) => r.task.paperId))];

describe("tasks from the index", () => {
  it("are every task_list entry, in display order across papers, as ReviewUnits", () => {
    expect(ids(tasks.map((task) => ({ task })))).toEqual(DISPLAY_ORDER);
    const t1 = byId.get(T1.id)!;
    expect(t1.unit.members).toEqual([
      { row_index: 0, field: "a" },
      { row_index: 1, field: "a" },
      { row_index: 2, field: "b" },
    ]);
    expect(t1.unit).toMatchObject({ id: T1.id, paper_id: "P1", member_count: 3 });
    expect([t1.kind, t1.level, t1.questionCount, t1.fieldCount, t1.paperLabel]).toEqual([
      "inferred",
      "ambiguous",
      2,
      2,
      "P1",
    ]);
  });
});

describe("scope: only active papers' tasks enter the queue, panel and sections", () => {
  it("only active papers' tasks enter the queue, stats and sections; filters apply after scope", async () => {
    const read = stubFetch(workingSetOf(["P1", "P3"]));
    const workingSet = await fetchWorkingSet(TOPIC, RUN, { fetchFn: read.fetchFn, headers: {} });
    expect(read.urls).toHaveLength(1);
    const scope = resolveReviewScope(fixtureIndex(), true, active(workingSet));
    expect(scope).toEqual({ paperIds: ["P1", "P3"], emptyWorkingSet: false });

    const view = landing(scope);
    expect(papersOf(view.rows)).toEqual(["P1", "P3"]);
    expect(ids(view.rows)).toEqual([T1.id, T2.id, T3.id, T4.id, V1.id]);
    expect(view.panel.total).toBe(2); // T1, T3: the ambiguous tasks in scope
    expect(view.paperOptions.map((o) => o.value)).toEqual(["P1", "P3"]);
    expect(view.sections.flatMap((s) => [...s.ambiguous, ...s.confident]).every((r) => r.task.paperId !== "P2")).toBe(true);
    expect(view.next?.task.id).toBe(T1.id);

    // Filters narrow the listed tasks after scope; the queue and panel keep the scope.
    const listedPerKind = (v: typeof view) => v.sections.map((s) => s.ambiguous.length + s.confident.length);
    const filtered = landing(scope, [], { paperId: "P3", status: "all" });
    expect(listedPerKind(filtered)).toEqual([0, 0, 1]);
    expect(filtered.rows).toHaveLength(5);
    expect(filtered.panel).toEqual(view.panel);
    // A filter naming a paper out of scope lists nothing: it never widens scope.
    expect(listedPerKind(landing(scope, [], { paperId: "P2", status: "all" }))).toEqual([0, 0, 0]);
  });
});

describe("scope: turning the working set off and on changes no membership or decision", () => {
  it("off gives every index paper with the filters kept; on restores the active ones; nothing is written", () => {
    const workingSet = workingSetOf(["P2"]);
    const actions = stored(approve(U1.id));
    const before = JSON.parse(JSON.stringify({ workingSet, actions }));
    const filters: ReviewTaskFilters = { paperId: "all", status: "open" };

    const on = landing(resolveReviewScope(fixtureIndex(), true, active(workingSet)), actions, filters);
    const off = landing(resolveReviewScope(fixtureIndex(), false, active(workingSet)), actions, filters);
    const onAgain = landing(resolveReviewScope(fixtureIndex(), true, active(workingSet)), actions, filters);

    expect(papersOf(on.rows)).toEqual(["P2"]);
    expect(off.scope).toEqual({ paperIds: ["P1", "P2", "P3"], emptyWorkingSet: false });
    expect(off.rows).toHaveLength(7);
    // The status filter still applies with the toggle off: U1 is decided, so not listed.
    const listed = (v: typeof off) => v.sections.flatMap((s) => [...s.ambiguous, ...s.confident]);
    expect(ids(listed(off))).not.toContain(U1.id);
    expect(listed(off)).toHaveLength(6);
    expect(onAgain).toEqual(on);
    // Neither toggle changed membership or decisions.
    expect({ workingSet, actions }).toEqual(before);
  });

  it("off needs no working set; on without a read throws instead of showing all papers", () => {
    expect(resolveReviewScope(fixtureIndex(), false, null).paperIds).toEqual(["P1", "P2", "P3"]);
    expect(() => resolveReviewScope(fixtureIndex(), true, null)).toThrow("never falls back");
  });
});

describe("scope: an empty or failed working set never becomes all papers", () => {
  it("no active paper gives an explicit empty scope: 0 in queue, stats and next", () => {
    const scope = resolveReviewScope(fixtureIndex(), true, active(workingSetOf([])));
    expect(scope).toEqual({ paperIds: [], emptyWorkingSet: true });
    const view = landing(scope);
    expect(view.rows).toEqual([]);
    expect(view.next).toBeNull();
    expect(view.panel).toMatchObject({ made: 0, total: 0, allDecided: false });
    expect(view.paperOptions).toEqual([]);
    expect(view.sections.map((s) => s.total)).toEqual([0, 0, 0]);
    // An empty scope is never "all decided", with the selector on either.
    expect(landing(scope, [], REVIEW_TASK_DEFAULT_FILTERS, true).panel.allDecided).toBe(false);
    // "Show all papers" is the toggle off.
    expect(landing(resolveReviewScope(fixtureIndex(), false, active(workingSetOf([])))).rows).toHaveLength(7);
  });
});

describe("scope: decisions stay recorded while their paper is out of the set", () => {
  it("a decided task's paper leaves the set and returns; its task is decided again, no action removed", () => {
    const actions = stored(approve(U1.id));
    const count = actions.length;
    const all = resolveReviewScope(fixtureIndex(), true, active(workingSetOf(["P1", "P2", "P3"])));
    const without = resolveReviewScope(fixtureIndex(), true, active(workingSetOf(["P1", "P3"])));

    const decided = (v: ReturnType<typeof landing>) =>
      v.rows.find((r) => r.task.id === U1.id)?.progress.cleared;
    expect(decided(landing(all, actions))).toBe(true);
    expect(decided(landing(without, actions))).toBeUndefined();
    expect(decided(landing(all, actions))).toBe(true);
    expect(decided(landing(resolveReviewScope(fixtureIndex(), false, null), actions))).toBe(true);
    expect(actions).toHaveLength(count);
  });
});

describe("tasks come only from the index task list", () => {
  it("tasks come only from task_list; a review_units.json unit never reaches the queue", () => {
    const view = landing(resolveReviewScope(fixtureIndex(), false, null));
    const indexIds = fixtureIndex().papers.flatMap((p) => p.task_list.map((t) => t.id));
    expect(ids(view.rows).sort()).toEqual([...indexIds].sort());
  });
});

describe("the panel counts ambiguous tasks unless non-ambiguous are included", () => {
  const all = resolveReviewScope(fixtureIndex(), false, null);

  it("off counts ambiguous tasks only; on counts every task; Confident keeps its own counts", () => {
    const actions = stored(approve(T2.id, U1.id));
    const off = landing(all, actions);
    expect(off.panel).toMatchObject({
      includeNonAmbiguous: false,
      made: 1,
      total: 3,
      remaining: 2,
      allDecided: false,
      byKind: { inferred: { made: 0, total: 1 }, derived: { made: 1, total: 2 }, verbatim: { made: 0, total: 0 } },
    });
    const on = landing(all, actions, REVIEW_TASK_DEFAULT_FILTERS, true);
    expect(on.panel).toMatchObject({
      includeNonAmbiguous: true,
      made: 2,
      total: 7,
      byKind: { inferred: { made: 1, total: 2 }, derived: { made: 1, total: 3 }, verbatim: { made: 0, total: 2 } },
    });
    expect(off.paperOptions).toEqual([
      { value: "P1", label: "P1" },
      { value: "P2", label: "P2" },
      { value: "P3", label: "P3" },
    ]);
  });

  it("panel counts ignore the filters", () => {
    const rows = reviewTaskRows(tasks, all, []);
    const listed = filterReviewTaskRows(rows, { paperId: "P1", status: "decided" });
    expect(listed).toEqual([]);
    expect(computeReviewPanelStats(rows, all, false).total).toBe(3);
    expect(reviewKindSections(listed, false).map((s) => s.total)).toEqual([0, 0, 0]);
    expect(reviewKindSections(listed, true).map((s) => s.total)).toEqual([0, 0, 0]);
  });
});

describe("kind headers follow the selector; Confident keeps its own counts", () => {
  const all = resolveReviewScope(fixtureIndex(), false, null);
  const header = (view: ReturnType<typeof landing>) =>
    view.sections.map((s) => [s.heading, s.decided, s.total, s.ambiguous.length, s.confident.length]);

  it("off counts the listed ambiguous tasks; on counts every listed task", () => {
    const actions = stored(approve(T2.id, U1.id));
    expect(header(landing(all, actions))).toEqual([
      ["Inferred", 0, 1, 1, 1],
      ["Derived", 1, 2, 2, 1],
      ["Verbatim", 0, 0, 0, 2],
    ]);
    expect(header(landing(all, actions, REVIEW_TASK_DEFAULT_FILTERS, true))).toEqual([
      ["Inferred", 1, 2, 1, 1],
      ["Derived", 1, 3, 2, 1],
      ["Verbatim", 0, 2, 0, 2],
    ]);
  });

  it("headers count over the filtered rows in both states", () => {
    const actions = stored(approve(T2.id, U1.id));
    const filters: ReviewTaskFilters = { paperId: "all", status: "open" };
    expect(header(landing(all, actions, filters))).toEqual([
      ["Inferred", 0, 1, 1, 0],
      ["Derived", 0, 1, 1, 1],
      ["Verbatim", 0, 0, 0, 2],
    ]);
    expect(header(landing(all, actions, filters, true))).toEqual([
      ["Inferred", 0, 1, 1, 0],
      ["Derived", 0, 2, 1, 1],
      ["Verbatim", 0, 2, 0, 2],
    ]);
  });
});

describe("completion: every counted task decided", () => {
  const all = resolveReviewScope(fixtureIndex(), false, null);

  it("off: deciding every ambiguous task completes with clean tasks open; on: not until they are decided", () => {
    const actions = stored(approve(T1.id, T3.id, U1.id));
    const off = landing(all, actions);
    expect(off.panel).toMatchObject({ made: 3, total: 3, remaining: 0, allDecided: true });
    expect(off.next).toBeNull();
    expect(off.rows.filter((r) => !r.progress.cleared).map((r) => r.task.id)).toEqual([T2.id, U2.id, T4.id, V1.id]);

    const on = landing(all, actions, REVIEW_TASK_DEFAULT_FILTERS, true);
    expect(on.panel).toMatchObject({ made: 3, total: 7, remaining: 4, allDecided: false });
    expect(on.next?.task.id).toBe(T2.id);

    const every = stored(approve(T2.id, U2.id, T4.id, V1.id), actions);
    const onDone = landing(all, every, REVIEW_TASK_DEFAULT_FILTERS, true);
    expect(onDone.panel).toMatchObject({ made: 7, total: 7, remaining: 0, allDecided: true });
    expect(onDone.next).toBeNull();
    expect(landing(all, every).panel).toMatchObject({ made: 3, total: 3, allDecided: true });
    expect(landing(all, every).next).toBeNull();
  });

  it("a non-empty scope with no counted task is all decided; an empty scope is not", () => {
    const p3 = resolveReviewScope(fixtureIndex(), true, active(workingSetOf(["P3"])));
    const off = landing(p3);
    expect(off.panel).toMatchObject({ made: 0, total: 0, allDecided: true });
    expect(off.next).toBeNull();
    const on = landing(p3, [], REVIEW_TASK_DEFAULT_FILTERS, true);
    expect(on.panel).toMatchObject({ made: 0, total: 1, allDecided: false });
    expect(on.next?.task.id).toBe(V1.id);
    const empty = resolveReviewScope(fixtureIndex(), true, active(workingSetOf([])));
    expect(landing(empty).panel).toMatchObject({ made: 0, total: 0, allDecided: false });
    expect(landing(empty, [], REVIEW_TASK_DEFAULT_FILTERS, true).panel.allDecided).toBe(false);
  });

  it("a flag leaves the task open, so the scope is not complete", () => {
    const flagged = stored([
      ...approve(T1.id, U1.id),
      ...buildActions(byId.get(T3.id)!.unit, RUN, "Reviewer", { action: "flag", reason: "wrong cell" }),
    ]);
    const view = landing(all, flagged);
    expect(view.panel).toMatchObject({ made: 2, total: 3, allDecided: false });
    expect(view.next?.task.id).toBe(T3.id);
  });
});

describe("the queue follows the selector, in display order", () => {
  const all = resolveReviewScope(fixtureIndex(), false, null);

  it("on: next-undecided walks display order across kinds and levels, clean included, skipping decided tasks", () => {
    const rows = reviewTaskRows(tasks, all, stored(approve(T1.id, T3.id)));
    expect(nextUndecidedTask(rows, true)?.task.id).toBe(T2.id); // clean, before the Derived tasks
    expect(nextUndecidedTask(rows, true, T2.id)?.task.id).toBe(U1.id); // T3 is decided
    expect(nextUndecidedTask(rows, true, U2.id)?.task.id).toBe(T4.id);
    expect(nextUndecidedTask(rows, true, V1.id)).toBeNull(); // the last: no wrap-around
    expect(nextUndecidedTask(rows, true, "not-in-scope")?.task.id).toBe(T2.id);
  });

  it("off: next-undecided walks only the ambiguous tasks, skipping clean and decided ones", () => {
    const rows = reviewTaskRows(tasks, all, stored(approve(T1.id)));
    expect(nextUndecidedTask(rows, false)?.task.id).toBe(T3.id); // T2 is clean
    expect(nextUndecidedTask(rows, false, T1.id)?.task.id).toBe(T3.id);
    expect(nextUndecidedTask(rows, false, T3.id)?.task.id).toBe(U1.id);
    expect(nextUndecidedTask(rows, false, U1.id)).toBeNull(); // clean tasks after it: none queued, no wrap-around
    expect(nextUndecidedTask(rows, false, "not-in-scope")?.task.id).toBe(T3.id);
  });

  it("off, after a clean task: the next undecided ambiguous task after it, or none", () => {
    const rows = reviewTaskRows(tasks, all, []);
    expect(nextUndecidedTask(rows, false, T2.id)?.task.id).toBe(T3.id); // T2 is clean
    expect(nextUndecidedTask(rows, false, U2.id)).toBeNull(); // only clean tasks follow U2
    const decidedT3 = reviewTaskRows(tasks, all, stored(approve(T3.id)));
    expect(nextUndecidedTask(decidedT3, false, T2.id)?.task.id).toBe(U1.id);
    // Earlier undecided ambiguous tasks are not revisited: no wrap-around.
    expect(nextUndecidedTask(rows, false, V1.id)).toBeNull();
  });

  it("the landing's next follows the selector", () => {
    const actions = stored(approve(T1.id));
    expect(landing(all, actions).next?.task.id).toBe(T3.id);
    expect(landing(all, actions, REVIEW_TASK_DEFAULT_FILTERS, true).next?.task.id).toBe(T2.id);
  });

  it("the status filter does not change the queue", () => {
    const actions = stored(approve(T1.id));
    const open = landing(all, actions, { paperId: "P2", status: "open" });
    expect(open.next?.task.id).toBe(T3.id);
    expect(landing(all, actions, { paperId: "P2", status: "open" }, true).next?.task.id).toBe(T2.id);
    expect(ids(open.rows)).toEqual(DISPLAY_ORDER);
  });

  it("progress is computeUnitProgress over the task's members", () => {
    const actions = stored(approve(T1.id).slice(0, 2));
    const rows = reviewTaskRows(tasks, all, actions);
    for (const row of rows) {
      expect(row.progress).toEqual(computeUnitProgress(row.task.unit, clearedMembersFor(actions)));
    }
    expect(rows[0].progress).toEqual({ cleared: false, clearedMembers: 2 });
  });
});

describe("decided history", () => {
  const all = resolveReviewScope(fixtureIndex(), false, null);

  it("lists every decided task in scope, both levels, in display order, with its latest action", () => {
    expect(decidedTaskHistory(landing(all).rows, [])).toEqual([]);
    const first = stored(approve(T3.id, T2.id));
    const corrected = stored(
      buildActions(byId.get(T3.id)!.unit, RUN, "Reviewer", { action: "correct", corrected: { value: 2 } }),
      first
    );
    const flagged = stored(
      buildActions(byId.get(U1.id)!.unit, RUN, "Reviewer", { action: "flag", reason: "check" }),
      corrected
    );
    const entries = decidedTaskHistory(landing(all, flagged).rows, flagged);
    expect(entries.map((e) => [e.row.task.id, e.action])).toEqual([
      [T2.id, "approve"],
      [T3.id, "correct"],
    ]);
    const p2Only = resolveReviewScope(fixtureIndex(), true, active(workingSetOf(["P2"])));
    expect(decidedTaskHistory(landing(p2Only, flagged).rows, flagged)).toEqual([]);
  });
});
