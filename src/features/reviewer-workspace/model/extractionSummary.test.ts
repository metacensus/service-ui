import { describe, expect, it } from "vitest";
import type { Manifest, ReviewAction } from "../types";
import { fixtureIndex, RUN, stored, T1, U1 } from "./__fixtures__/reviewTaskFixtures";
import { buildActions } from "./actionBuilders";
import { buildExtractionSummary, heatCellTone } from "./extractionSummary";
import { reviewTasksFromIndex } from "./reviewTasks";
import type { ReviewSeed } from "./rowStatus";

const tasks = reviewTasksFromIndex(fixtureIndex());
const byId = new Map(tasks.map((t) => [t.id, t]));
const approve = (...ids: string[]): ReviewAction[] =>
  ids.flatMap((id) => buildActions(byId.get(id)!.unit, RUN, "Reviewer", { action: "approve" }));

const manifest = {
  papers: [
    { paper_id: "P1", row_count: 5 },
    { paper_id: "P2", row_count: 3 },
    { paper_id: "P3", row_count: 1 },
    { paper_id: "P4", row_count: 7 },
  ],
  identity_dimensions: [
    { field: "pmid", description: "" },
    { field: "entity_raw", description: "" },
  ],
} as unknown as Manifest;

describe("extraction summary", () => {
  it("sizes the extraction from the manifest", () => {
    const s = buildExtractionSummary({ manifest, tasks, actions: [] });
    expect([s.paperCount, s.rowCount, s.identityColumnCount]).toEqual([4, 16, 2]);
  });

  it("counts nothing decided with no actions and no seed", () => {
    const s = buildExtractionSummary({ manifest, tasks, actions: [] });
    expect(s.tasks).toEqual({ made: 0, total: 7 });
    expect(s.ambiguousTasks).toEqual({ made: 0, total: 3 });
    expect(s.papersAdjudicated).toBe(0);
  });

  it("counts decided tasks per paper and kind", () => {
    const s = buildExtractionSummary({ manifest, tasks, actions: stored(approve(T1.id, U1.id)) });
    expect(s.tasks.made).toBe(2);
    expect(s.ambiguousTasks).toEqual({ made: 2, total: 3 });
    const p1 = s.heatmap.find((p) => p.paperId === "P1")!;
    expect(p1.byKind.inferred).toEqual({ made: 1, total: 2 });
    expect(p1.byKind.verbatim).toEqual({ made: 0, total: 1 });
  });

  it("counts a seeded paper as adjudicated", () => {
    const seed: ReviewSeed = {
      runId: RUN,
      reviewer: "Seed",
      action: "approve",
      reviewedAt: "2026-01-01T00:00:00.000Z",
      paperIds: ["P2"],
    };
    const s = buildExtractionSummary({ manifest, tasks, actions: [], seed });
    expect(s.papersAdjudicated).toBe(1);
    expect(s.heatmap.find((p) => p.paperId === "P2")!.overall).toEqual({ made: 2, total: 2 });
  });

  it("keeps a manifest paper with no tasks as an empty column", () => {
    const s = buildExtractionSummary({ manifest, tasks, actions: [] });
    expect(s.heatmap.map((p) => p.paperId)).toEqual(["P1", "P2", "P3", "P4"]);
    expect(s.heatmap[3].overall).toEqual({ made: 0, total: 0 });
  });

  it("falls back to the index's papers without a manifest", () => {
    const s = buildExtractionSummary({ manifest: null, tasks, actions: [] });
    expect([s.paperCount, s.rowCount, s.identityColumnCount]).toEqual([3, null, null]);
  });
});

describe("heat cell tone", () => {
  it("bands by share decided", () => {
    expect(heatCellTone({ made: 0, total: 0 })).toBe("none");
    expect(heatCellTone({ made: 0, total: 4 })).toBe("open");
    expect(heatCellTone({ made: 1, total: 4 })).toBe("started");
    expect(heatCellTone({ made: 2, total: 4 })).toBe("most");
    expect(heatCellTone({ made: 4, total: 4 })).toBe("done");
  });
});
