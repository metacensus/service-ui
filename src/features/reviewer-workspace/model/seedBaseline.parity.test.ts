// The landing with the demo seed baseline, fed the real seed-time index. Reads the
// seed (/metacensus/demo/review-seed/<run>.json) and the index
// (/reviewer-snapshots/index/<run>/review-index.json) from a local demo, like
// reviewTasks.parity.test.ts. The seed is passed explicitly.

import { beforeAll, describe, expect, it } from "vitest";
import { computePaperReviewProgress } from "@/functions/paperReviewProgress";
import { demoFetch, demoJson, demoReachable, EXPORT_RUN as RUN } from "../data/loadExportRows.testutil";
import { reviewIndexUrl, validateReviewIndex, type ReviewIndex } from "../data/reviewIndex";
import { fetchReviewSeed } from "../data/reviewSeed";
import {
  buildReviewLanding,
  resolveReviewScope,
  REVIEW_TASK_DEFAULT_FILTERS,
  reviewTasksFromIndex,
  type ReviewTask,
} from "./reviewTasks";
import { reviewSeedForRun, type ReviewSeed } from "./rowStatus";

const DEMO = ["Amstutz_2009_19530960", "Boige_2016_26794347", "Lecomte_2004_15355920"];

// Null only when the demo is unreachable. A reachable demo that 404s the seed or the
// index, or answers an invalid seed, throws and fails the file.
async function readDemo(): Promise<{ seed: ReviewSeed; indexJson: unknown } | null> {
  if (!(await demoReachable())) return null;
  const seed = await fetchReviewSeed(RUN, demoFetch);
  if (!seed) throw new Error(`The demo has no review seed for ${RUN}`);
  return { seed, indexJson: await demoJson(reviewIndexUrl(RUN)) };
}

const demo = await readDemo();

describe.skipIf(!demo)("the seed baseline on the real index", () => {
  // Built in beforeAll: skipIf still runs this body, so nothing here may assume the demo answered.
  let index: ReviewIndex;
  let tasks: ReviewTask[];
  let seedData: ReviewSeed;
  let seed: ReviewSeed | null;
  beforeAll(() => {
    index = validateReviewIndex(demo!.indexJson, RUN);
    tasks = reviewTasksFromIndex(index);
    seedData = demo!.seed;
    seed = reviewSeedForRun(seedData, RUN);
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
    expect(seed).toBe(seedData);
    for (const paperId of seedData.paperIds) {
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
    expect(seedData.paperIds).not.toContain(next.task.paperId);
  });

  it("adjudicates exactly the 17 seeded papers", () => {
    const progress = computePaperReviewProgress(tasks, [], seed);
    const adjudicated = [...progress.values()].filter((p) => p.adjudicated).map((p) => p.paperId);
    expect(adjudicated.sort()).toEqual([...seedData.paperIds].sort());
    expect(progress.size).toBe(43);
  });
});
