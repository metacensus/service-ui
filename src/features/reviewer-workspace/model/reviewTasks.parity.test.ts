// The landing model fed the real seed-time index reproduces the demo papers'
// numbers. Reads the index from a local demo (/reviewer-snapshots/index/<run>)
// and skips when the demo is unreachable.
// Working sets: every paper of the index active and, derived from it in test
// code, the 3 demo papers active and Lecomte 2004 alone.

import { beforeAll, describe, expect, it, vi } from "vitest";

const indexedDb = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/indexdb", () => indexedDb);

import { demoJson, demoReachable, EXPORT_RUN as RUN } from "../data/loadExportRows.testutil";
import { createLocalReviewerPersistence } from "../data/persistence";
import {
  reviewIndexUrl,
  reviewTasksUrl,
  validateReviewIndex,
  validateReviewTasks,
  type ReviewIndex,
} from "../data/reviewIndex";
import { activePaperIds, type WorkingSet } from "../data/workingSet";
import { workingSetFixture } from "./__fixtures__/workingSetFixture";
import { hasTextHighlight } from "./highlight";
import { buildTaskDecisionActions } from "./reviewTaskDecisions";
import { questionDetail, questionEvidence, taskFirstQuote } from "./reviewTaskPage";
import {
  buildReviewLanding,
  resolveReviewScope,
  REVIEW_TASK_DEFAULT_FILTERS,
  reviewTasksFromIndex,
  type ReviewLanding,
  type ReviewScope,
  type ReviewTask,
} from "./reviewTasks";
import type { StoredReviewAction } from "../types";

const DEMO = ["Amstutz_2009_19530960", "Boige_2016_26794347", "Lecomte_2004_15355920"];
const LECOMTE = "Lecomte_2004_15355920";

/** Every paper of the index active, except those not listed in `active` (when given). */
function workingSetWith(index: ReviewIndex, active?: string[]): WorkingSet {
  const state = workingSetFixture(index.papers.map((paper) => paper.paper_id));
  return {
    ...state,
    members: state.members.map((member) =>
      !active || active.includes(member.paper_id) ? member : { ...member, membership: "excluded" as const }
    ),
  };
}

const FIRST_DEMO = "src:Amstutz_2009_19530960:inferred:figures/figure_12.png+tables/table_2.md:2967e5275c";
const FIRST_LECOMTE_AMBIGUOUS =
  "src:Lecomte_2004_15355920:derived:sections/analysis_of_efficacy_of_palliative_5_fu_based_chemotherapy.md+sections/discussion.md:02c9dd59d3";
const FIRST_LECOMTE = "src:Lecomte_2004_15355920:inferred:sections/analysis_of_toxicity.md:f5beb17c55";
const FIRST_ALL =
  "src:Kristensen_2010_20819423:inferred:sections/gene_variants_in_dpyd_mthfr_and_tyms_predict_5_fu_related_toxicity__sec18.md:2d1cbbf51c";

describe.skipIf(!(await demoReachable()))("the landing reproduces the demo papers' numbers from the real index", () => {
  // Read in beforeAll: skipIf still runs this body, so a read here would fail
  // collection when the demo is unreachable.
  let index: ReviewIndex;
  let tasks: ReviewTask[];
  let all43: ReviewScope;
  let view43: ReviewLanding;
  let demoScope: ReviewScope;
  let lecomteScope: ReviewScope;
  beforeAll(async () => {
    index = validateReviewIndex(await demoJson(reviewIndexUrl(RUN)), RUN);
    tasks = reviewTasksFromIndex(index);
    all43 = resolveReviewScope(index, true, new Set(activePaperIds(workingSetWith(index))));
    view43 = buildReviewLanding({
      tasks,
      scope: all43,
      actions: [],
      filters: REVIEW_TASK_DEFAULT_FILTERS,
      includeNonAmbiguous: false,
    });
    demoScope = resolveReviewScope(index, true, new Set(activePaperIds(workingSetWith(index, DEMO))));
    lecomteScope = resolveReviewScope(index, true, new Set(activePaperIds(workingSetWith(index, [LECOMTE]))));
  });

  const view = (actions: StoredReviewAction[], includeNonAmbiguous: boolean, scope = demoScope) =>
    buildReviewLanding({
      tasks,
      scope,
      actions,
      filters: REVIEW_TASK_DEFAULT_FILTERS,
      includeNonAmbiguous,
    });
  const panelNumbers = (v: ReturnType<typeof view>) => ({
    decided: `${v.panel.made}/${v.panel.total}`,
    kinds: [v.panel.byKind.inferred, v.panel.byKind.derived, v.panel.byKind.verbatim].map(
      (k) => `${k.made}/${k.total}`
    ),
  });
  const headers = (v: ReturnType<typeof view>) =>
    v.sections.map((s) => [s.heading, `${s.decided}/${s.total}`, s.ambiguous.length, s.confident.length]);

  it("the 3 demo papers, selector off and on, and Confident", () => {
    expect(demoScope.paperIds).toEqual(DEMO);
    const off = view([], false);
    expect(panelNumbers(off)).toEqual({ decided: "0/40", kinds: ["0/15", "0/23", "0/2"] });
    expect(off.panel.remaining).toBe(40);
    expect(off.paperOptions.map((o) => o.label)).toEqual(["Amstutz 2009", "Boige 2016", "Lecomte 2004"]);
    const on = view([], true);
    expect(panelNumbers(on)).toEqual({ decided: "0/1095", kinds: ["0/82", "0/717", "0/296"] });
    expect(on.panel.remaining).toBe(1095);
    expect(headers(off)).toEqual([
      ["Inferred", "0/15", 15, 67],
      ["Derived", "0/23", 23, 694],
      ["Verbatim", "0/2", 2, 294],
    ]);
    expect(headers(on)).toEqual([
      ["Inferred", "0/82", 15, 67],
      ["Derived", "0/717", 23, 694],
      ["Verbatim", "0/296", 2, 294],
    ]);
    // The first task is ambiguous, so it comes first in both states.
    expect(off.next?.task.id).toBe(FIRST_DEMO);
    expect(on.next?.task.id).toBe(FIRST_DEMO);
  });

  it("all 43 papers active", () => {
    expect(all43.paperIds).toHaveLength(43);
    expect(view43.panel.total).toBe(1335);
    expect(panelNumbers(view43).kinds).toEqual(["0/421", "0/867", "0/47"]);
    const on = buildReviewLanding({
      tasks,
      scope: all43,
      actions: [],
      filters: REVIEW_TASK_DEFAULT_FILTERS,
      includeNonAmbiguous: true,
    });
    expect(on.panel.total).toBe(13308);
    expect(on.sections.map((s) => s.confident.length)).toEqual([831, 7239, 3903]);
    expect(view43.next?.task.id).toBe(FIRST_ALL);
    expect(on.next?.task.id).toBe(FIRST_ALL);
    // "Use working set" off: every index paper, the same counts.
    const allPapers = resolveReviewScope(index, false, null);
    expect(allPapers.paperIds).toEqual(all43.paperIds);
  });

  it("Lecomte 2004 alone", () => {
    expect(lecomteScope.paperIds).toEqual([LECOMTE]);
    const off = view([], false, lecomteScope);
    expect(panelNumbers(off)).toEqual({ decided: "0/8", kinds: ["0/0", "0/6", "0/2"] });
    expect(headers(off)).toEqual([
      ["Inferred", "0/0", 0, 56],
      ["Derived", "0/6", 6, 140],
      ["Verbatim", "0/2", 2, 75],
    ]);
    expect(off.next?.task.id).toBe(FIRST_LECOMTE_AMBIGUOUS);
    const on = view([], true, lecomteScope);
    expect(panelNumbers(on)).toEqual({ decided: "0/279", kinds: ["0/56", "0/146", "0/77"] });
    expect(on.next?.task.id).toBe(FIRST_LECOMTE);
  });

  it("after approving Lecomte's 8 ambiguous tasks (built actions, saved through the persistence path)", async () => {
    const doc = validateReviewTasks(await demoJson(reviewTasksUrl(RUN, LECOMTE)), LECOMTE);
    const ambiguous = doc.tasks.filter((t) => t.certainty === "ambiguous");
    expect(ambiguous).toHaveLength(8);
    indexedDb.get.mockResolvedValue(undefined);
    indexedDb.set.mockRejectedValue(new Error("no IndexedDB"));
    const adapter = createLocalReviewerPersistence("topic-real-index", RUN);
    for (const task of ambiguous) {
      const actions = buildTaskDecisionActions(doc, task, "all", { action: "approve" }, RUN, "Parity reviewer");
      // Built actions cover the task's members exactly as the index lists them.
      const members = tasks.find((t) => t.id === task.id)!.unit.members;
      expect(actions.map((a) => [a.row_index, a.field])).toEqual(members.map((m) => [m.row_index, m.field]));
      expect(actions.every((a) => a.via_unit === task.id && a.expect_identity)).toBe(true);
      await adapter.bulkUpsertActions(RUN, actions);
    }
    const saved = await adapter.listActions(RUN);

    const off = view(saved, false);
    expect(panelNumbers(off)).toEqual({ decided: "8/40", kinds: ["0/15", "6/23", "2/2"] });
    const on = view(saved, true);
    expect(on.panel.made).toBe(8);
    // The queue skips the decided tasks.
    expect(off.next?.progress.cleared).toBe(false);
    expect(off.next?.task.id).toBe(off.rows.find((r) => !r.progress.cleared && r.task.level === "ambiguous")?.task.id);

    // Lecomte alone, selector off: every ambiguous task decided, so the
    // scope is complete and nothing is next; its clean tasks stay open.
    const lecomteOff = view(saved, false, lecomteScope);
    expect(lecomteOff.panel).toMatchObject({ made: 8, total: 8, remaining: 0, allDecided: true });
    expect(lecomteOff.next).toBeNull();
    expect(lecomteOff.rows.find((r) => r.task.id === FIRST_LECOMTE)?.progress.cleared).toBe(false);
    // Selector on: 271 of 279 remain, and next is the first clean task.
    const lecomteOn = view(saved, true, lecomteScope);
    expect(lecomteOn.panel).toMatchObject({ made: 8, total: 279, remaining: 271, allDecided: false });
    expect(lecomteOn.next?.task.id).toBe(FIRST_LECOMTE);
  });

  it("every demo task and question opens a highlighted source first", async () => {
    const pageOnly = { taskOpen: 0, questionOpen: 0, listFirst: 0 };
    for (const paper of DEMO) {
      const doc = validateReviewTasks(await demoJson(reviewTasksUrl(RUN, paper)), paper);
      for (const task of doc.tasks) {
        if (!hasTextHighlight(taskFirstQuote(doc, task))) pageOnly.taskOpen += 1;
        task.questions.forEach((_, i) => {
          if (!hasTextHighlight(questionEvidence(doc, task, i))) pageOnly.questionOpen += 1;
          if (!hasTextHighlight(questionDetail(doc, task, i)?.sources[0])) pageOnly.listFirst += 1;
        });
      }
    }
    expect(pageOnly).toEqual({ taskOpen: 0, questionOpen: 0, listFirst: 0 });
  });
});
