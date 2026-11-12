import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Prop_Type } from "@metacensus/api";
import type { Prop } from "../../../../types/Prop";
import TopicGroupMembers, { groupMembers } from "./TopicGroupMembers";
import { dashboardStatements } from "./TopicStatementsCard";
import { ExtractionHeatmap } from "./TopicExtractionCard";
import type { ExtractionSummary } from "@/features/reviewer-workspace/model/extractionSummary";

const members = [
  { id: "user:12", name: "Sophia Taylor" },
  { id: "user:27", name: "Ada Lovelace (hypothetical)" },
];

describe("group members", () => {
  it("turns the hypothetical suffix into a flag", () => {
    expect(groupMembers(members)).toEqual([
      { id: "user:12", name: "Sophia Taylor", hypothetical: false },
      { id: "user:27", name: "Ada Lovelace", hypothetical: true },
    ]);
  });

  it("marks hypothetical members and explains them", () => {
    const html = renderToStaticMarkup(<TopicGroupMembers members={members} />);
    expect(html).toContain("Group members");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain(">hypothetical<");
    expect(html).toContain("not real accounts");
  });

  it("has an empty state", () => {
    const html = renderToStaticMarkup(<TopicGroupMembers members={[]} />);
    expect(html).toContain("No one has joined this topic yet.");
  });
});

const prop = (id: string, type: Prop_Type, recorded: string): Prop =>
  ({ id, type, recorded, topicId: "topic:1", description: id });

describe("dashboard statements", () => {
  it("previews up to three statements, oldest first, skipping the question", () => {
    const rows = [
      prop("q", Prop_Type.TopicQuestion, "2026-01-01"),
      prop("s4", Prop_Type.Statement, "2026-01-05"),
      prop("s2", Prop_Type.Statement, "2026-01-03"),
      prop("s1", Prop_Type.Statement, "2026-01-02"),
      prop("s3", Prop_Type.Statement, "2026-01-04"),
    ];
    expect(dashboardStatements(rows).map((p) => p.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("is empty for a topic with a question and no statements", () => {
    expect(dashboardStatements([prop("q", Prop_Type.TopicQuestion, "2026-01-01")])).toEqual([]);
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
