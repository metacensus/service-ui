import { describe, expect, it } from "vitest";
import { activeStageIndex, stageState, topicFlowStages } from "./topicFlow";

const stages = topicFlowStages("t1");

describe("topic flow", () => {
  it("runs Papers, Extraction, Analysis, Statements in order", () => {
    expect(stages.map((s) => s.name)).toEqual([
      "Papers",
      "Extraction",
      "Analysis",
      "Statements",
    ]);
  });

  it("marks no stage current on the dashboard", () => {
    const active = activeStageIndex(stages, "/topics/t1/topic-dashboard");
    expect(active).toBe(-1);
    expect(stages.map((_, i) => stageState(i, active))).toEqual([
      "future",
      "future",
      "future",
      "future",
    ]);
  });

  it("treats every review sub-page as the Extraction stage", () => {
    for (const path of [
      "/topics/t1/topic-review",
      "/topics/t1/topic-review/data",
      "/topics/t1/topic-review/units/u1",
    ]) {
      expect(activeStageIndex(stages, path)).toBe(1);
    }
  });

  it("marks earlier stages past and later ones future", () => {
    const active = activeStageIndex(stages, "/topics/t1/topic-analysis");
    expect(stages.map((_, i) => stageState(i, active))).toEqual([
      "past",
      "past",
      "current",
      "future",
    ]);
  });

  it("matches a paper detail page to Papers but not a prefix lookalike", () => {
    expect(activeStageIndex(stages, "/topics/t1/topic-papers/p9")).toBe(0);
    expect(activeStageIndex(stages, "/topics/t1/topic-papers-old")).toBe(-1);
  });
});
