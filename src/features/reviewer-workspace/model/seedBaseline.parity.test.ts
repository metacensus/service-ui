
import { beforeAll, describe, expect, it } from "vitest";
import { computePaperReviewProgress } from "@/functions/paperReviewProgress";
import {
  buildReviewLanding,
  resolveReviewScope,
  REVIEW_TASK_DEFAULT_FILTERS,
  reviewTasksFromIndex,
  type ReviewTask,
} from "./reviewTasks";

const DEMO = ["Amstutz_2009_19530960", "Boige_2016_26794347", "Lecomte_2004_15355920"];

  let index: ReviewIndex;
  let tasks: ReviewTask[];
  beforeAll(() => {
    tasks = reviewTasksFromIndex(index);
  });
  const view = (paperIds: string[] | null, includeNonAmbiguous: boolean) =>
    buildReviewLanding({
      tasks,
      scope: paperIds
        ? resolveReviewScope(index, true, new Set(paperIds))
        : resolveReviewScope(index, false, null),
      actions: [],
      filters: REVIEW_TASK_DEFAULT_FILTERS,
      includeNonAmbiguous,
      seed,
    });
  const numbers = (v: ReturnType<typeof view>) => ({
    decided: `${v.panel.made}/${v.panel.total}`,
    kinds: [v.panel.byKind.inferred, v.panel.byKind.derived, v.panel.byKind.verbatim].map(
      (k) => `${k.made}/${k.total}`
    ),
  });

  it("applies to its own run", () => {
      expect(index.papers.some((paper) => paper.paper_id === paperId)).toBe(true);
    }
  });

  it("leaves the Review demo papers unseeded: 0/40 and 0/1095", () => {
    expect(numbers(view(DEMO, false))).toEqual({ decided: "0/40", kinds: ["0/15", "0/23", "0/2"] });
    expect(numbers(view(DEMO, true))).toEqual({ decided: "0/1095", kinds: ["0/82", "0/717", "0/296"] });
  });

  it("decides about a third of every kind across all 43 papers", () => {
    expect(numbers(view(null, false))).toEqual({
      decided: "452/1335",
      kinds: ["140/421", "297/867", "15/47"],
    });
    expect(numbers(view(null, true))).toEqual({
      decided: "4319/13308",
      kinds: ["427/1252", "2605/8106", "1287/3950"],
    });
    // The next task skips the seeded papers.
    const next = view(null, false).next!;
  });

  it("adjudicates exactly the 17 seeded papers", () => {
    const progress = computePaperReviewProgress(tasks, [], seed);
    const adjudicated = [...progress.values()].filter((p) => p.adjudicated).map((p) => p.paperId);
    expect(progress.size).toBe(43);
  });
});
