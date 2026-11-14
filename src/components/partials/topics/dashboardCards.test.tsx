import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Prop } from "../../../../types/Prop";
import type { Topic } from "../../../../types/Topic";
import TopicGroupMembers, { groupMembers } from "./TopicGroupMembers";
import { dashboardStatements } from "./TopicStatementsCard";
import { ExtractionHeatmap } from "./TopicExtractionCard";
import type { ExtractionSummary } from "@/features/reviewer-workspace/model/extractionSummary";

const topic = {
  topicContributors: [
    { contributor: { id: 12, name: "Sophia Taylor", role: "contributor" } },
    { contributor: { id: 27, name: "Ada Lovelace (hypothetical)", role: "contributor" } },
  ],
} as unknown as Topic;

describe("group members", () => {
  it("turns the hypothetical suffix into a flag", () => {
    expect(groupMembers(topic)).toEqual([
      { id: 12, name: "Sophia Taylor", role: "contributor", hypothetical: false },
      { id: 27, name: "Ada Lovelace", role: "contributor", hypothetical: true },
    ]);
  });

  it("marks hypothetical members and explains them", () => {
    const html = renderToStaticMarkup(<TopicGroupMembers topic={topic} />);
    expect(html).toContain("Group members");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain(">hypothetical<");
    expect(html).toContain("not real accounts");
  });

  it("has an empty state", () => {
    const html = renderToStaticMarkup(<TopicGroupMembers topic={null} />);
    expect(html).toContain("No one has joined this topic yet.");
  });
});

const prop = (id: string, type: Prop["type"], created: string): Prop =>
  ({ id, type, created, description: id, authorId: "1", concluded: "", conclusion: "open" }) as Prop;

describe("dashboard statements", () => {
  it("previews up to three statements, oldest first, skipping the question", () => {
    const rows = [
      prop("q", "TopicQuestion", "2026-01-01"),
      prop("s4", "Statement", "2026-01-05"),
      prop("s2", "Statement", "2026-01-03"),
      prop("s1", "Statement", "2026-01-02"),
      prop("s3", "Statement", "2026-01-04"),
    ];
    expect(dashboardStatements(rows).map((p) => p.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("is empty for a topic with a question and no statements", () => {
    expect(dashboardStatements([prop("q", "TopicQuestion", "2026-01-01")])).toEqual([]);
  });
});

describe("extraction heatmap", () => {
  it("draws one cell per paper per task kind", () => {
    const empty = { made: 0, total: 0 };
    const summary = {
      paperCount: 2,
      papersAdjudicated: 1,
      heatmap: ["A_2001", "B_2002"].map((paperId, i) => ({
        paperId,
        label: paperId,
        overall: empty,
        byKind: {
          inferred: empty,
          derived: i === 0 ? { made: 2, total: 2 } : { made: 0, total: 3 },
          verbatim: empty,
        },
      })),
    } as unknown as ExtractionSummary;
    const html = renderToStaticMarkup(<ExtractionHeatmap summary={summary} />);
    expect(html).toContain("1 of 2 papers fully adjudicated");
    expect(html.match(/class="h-4 /g)).toHaveLength(6);
    expect(html).toContain('title="A_2001 · Derived: 2 of 2 review tasks decided" class="h-4 bg-emerald-600"');
    expect(html).toContain('title="B_2002 · Derived: 0 of 3 review tasks decided" class="h-4 bg-gray-200"');
  });
});
