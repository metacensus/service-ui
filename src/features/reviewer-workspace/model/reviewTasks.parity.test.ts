// The landing model fed the real seed-time index reproduces the demo papers'


const indexedDb = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/indexdb", () => indexedDb);

import { createLocalReviewerPersistence } from "../data/persistence";
import {
  validateReviewIndex,
  validateReviewTasks,
  type ReviewIndex,
} from "../data/reviewIndex";
import { buildTaskDecisionActions } from "./reviewTaskDecisions";
import {
  buildReviewLanding,
  resolveReviewScope,
  REVIEW_TASK_DEFAULT_FILTERS,
  reviewTasksFromIndex,
  type ReviewTask,
} from "./reviewTasks";
import type { StoredReviewAction } from "../types";

const DEMO = ["Amstutz_2009_19530960", "Boige_2016_26794347", "Lecomte_2004_15355920"];
const LECOMTE = "Lecomte_2004_15355920";

  return {
    ...state,
    members: state.members.map((member) =>
    ),
  };
}

const FIRST_DEMO = "src:Amstutz_2009_19530960:inferred:figures/figure_12.png+tables/table_2.md:2967e5275c";
const FIRST_LECOMTE_AMBIGUOUS =
  "src:Lecomte_2004_15355920:derived:sections/analysis_of_efficacy_of_palliative_5_fu_based_chemotherapy.md+sections/discussion.md:02c9dd59d3";
const FIRST_LECOMTE = "src:Lecomte_2004_15355920:inferred:sections/analysis_of_toxicity.md:f5beb17c55";

      tasks,
      scope: all43,
      actions: [],
      filters: REVIEW_TASK_DEFAULT_FILTERS,
      includeNonAmbiguous: false,
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
    const on = view([], true);
    expect(headers(off)).toEqual([
    ]);
    expect(headers(on)).toEqual([
    ]);
    // The first task is ambiguous, so it comes first in both states.
    expect(off.next?.task.id).toBe(FIRST_DEMO);
    expect(on.next?.task.id).toBe(FIRST_DEMO);
  });

    expect(all43.paperIds).toHaveLength(43);
    const on = buildReviewLanding({
      tasks,
      scope: all43,
      actions: [],
      filters: REVIEW_TASK_DEFAULT_FILTERS,
      includeNonAmbiguous: true,
    });
    expect(view43.next?.task.id).toBe(FIRST_ALL);
    expect(on.next?.task.id).toBe(FIRST_ALL);
    // "Use working set" off: every index paper, the same counts.
    const allPapers = resolveReviewScope(index, false, null);
    expect(allPapers.paperIds).toEqual(all43.paperIds);
  });

    expect(lecomteScope.paperIds).toEqual([LECOMTE]);
    const off = view([], false, lecomteScope);
    expect(headers(off)).toEqual([
    ]);
    expect(off.next?.task.id).toBe(FIRST_LECOMTE_AMBIGUOUS);
    const on = view([], true, lecomteScope);
    expect(on.next?.task.id).toBe(FIRST_LECOMTE);
  });

    const ambiguous = doc.tasks.filter((t) => t.certainty === "ambiguous");
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
    const on = view(saved, true);
    // The queue skips the decided tasks.

    // Lecomte alone, selector off: every ambiguous task decided, so the
    // scope is complete and nothing is next; its clean tasks stay open.
    const lecomteOff = view(saved, false, lecomteScope);
    expect(lecomteOff.next).toBeNull();
    const lecomteOn = view(saved, true, lecomteScope);
    expect(lecomteOn.next?.task.id).toBe(FIRST_LECOMTE);
  });
});
