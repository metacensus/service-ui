import { describe, expect, it } from "vitest";
import {
  countRevisedQueries,
  displayTitle,
  isRevisedQuery,
  stepSummaryLabel,
} from "./exploreView";

describe("displayTitle", () => {
  it("drops a trailing PMID bracket", () => {
    );
  });

  it("leaves a title without a bracket alone", () => {
  });

  it("keeps a bracket that is not a trailing PMID", () => {
    expect(displayTitle("Trial [NCT01] results")).toBe("Trial [NCT01] results");
  });
});

describe("stepSummaryLabel", () => {
  it("rewrites plural SQL wording", () => {
    expect(stepSummaryLabel("3 statements; 10 rows returned")).toBe(
      "3 search steps; 10 results reviewed"
    );
  });

  it("rewrites singular SQL wording", () => {
    expect(stepSummaryLabel("1 statement; 1 row returned")).toBe(
      "1 search step; 1 result reviewed"
    );
  });

  it("leaves an error summary untouched", () => {
    const summary = "error: no such column: foo";
    expect(stepSummaryLabel(summary)).toBe(summary);
  });

  it("does not rewrite a word that merely contains a keyword", () => {
    expect(stepSummaryLabel("14 sources resolved")).toBe("14 sources resolved");
  });
});

describe("revised queries", () => {
  it("identifies failed steps", () => {
    expect(isRevisedQuery({ tool: "execute_sql", summary: "error: bad" })).toBe(true);
    expect(isRevisedQuery({ tool: "execute_sql", summary: "1 statement" })).toBe(false);
  });

  it("counts them", () => {
    expect(
      countRevisedQueries([
        { tool: "execute_sql", summary: "error: bad" },
        { tool: "execute_sql", summary: "2 statements; 3 rows returned" },
        { tool: "execute_sql", summary: "error: worse" },
      ])
    ).toBe(2);
  });
});
    expect(
      countRevisedQueries([
        { tool: "execute_sql", summary: "error: bad" },
