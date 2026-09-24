import { describe, expect, it } from "vitest";
import type { ExploreEvidence } from "../types";
import {
  countRevisedQueries,
  displayTitle,
  evidenceKind,
  hasMembershipUpdate,
  isFailedMembershipUpdate,
  isRevisedQuery,
  stepLabel,
  stepSummaryLabel,
  valueSources,
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

function evidenceItem(overrides: Partial<ExploreEvidence>): ExploreEvidence {
  return {
    evidence_id: "ev_a",
    row_index: 16,
    field: "n_total",
    source_index: 0,
    pdf_available: true,
    value: 46,
    quote: "All toxicities | YES | 174 | 48",
    location: "sections/discussion.md",
    article_page: 3,
    pdf_page: 3,
    resolution: "exact",
    highlight: null,
    cell: null,
    provenance_type: "derived",
    derivation: "34 + 12 = 46",
    derivation_kind: "derived",
    extraction_certainty: "ambiguous",
    reasoning: null,
    review_status: "unreviewed",
    ...overrides,
  };
}

describe("revised queries and membership steps", () => {
  it("does not count a failed working-set change as a revised query", () => {
    expect(isRevisedQuery({ tool: "membership_update", summary: "error: 409 stale_revision" })).toBe(false);
    expect(
      countRevisedQueries([
        { tool: "membership_update", summary: "error: 409 stale_revision" },
        { tool: "execute_sql", summary: "error: bad" },
      ])
    ).toBe(1);
  });
});

describe("stepLabel", () => {
  it("labels a confirmed working-set change with its summary", () => {
    );
  });

  it("labels a failed working-set change as a failure, not a revised query", () => {
    expect(stepLabel({ tool: "membership_update", summary: "error: Working-set write failed: 409 stale_revision" })).toBe(
      "Working-set change failed · nothing changed"
    );
  });

  it("keeps the baseline labels for other steps", () => {
    expect(stepLabel({ tool: "execute_sql", summary: "error: no such column" })).toBe(
      "The agent revised an unsuccessful query."
    );
    expect(stepLabel({ tool: "execute_sql", summary: "2 statements; 9 rows returned" })).toBe(
      "Evidence search · 2 search steps; 9 results reviewed"
    );
    );
  });
});

describe("isFailedMembershipUpdate", () => {
  it("is true only for a failed working-set change", () => {
    expect(isFailedMembershipUpdate({ tool: "membership_update", summary: "error: 409 stale_revision" })).toBe(true);
    expect(isFailedMembershipUpdate({ tool: "membership_update", summary: "X -> active at revision 2" })).toBe(false);
    expect(isFailedMembershipUpdate({ tool: "execute_sql", summary: "error: bad" })).toBe(false);
  });
});

describe("hasMembershipUpdate", () => {
  it("is true for any membership_update step, successful or failed", () => {
    expect(hasMembershipUpdate([{ tool: "membership_update", summary: "X -> active at revision 2" }])).toBe(true);
    expect(hasMembershipUpdate([{ tool: "membership_update", summary: "error: 409" }])).toBe(true);
    expect(hasMembershipUpdate([{ tool: "execute_sql", summary: "1 statement" }])).toBe(false);
    expect(hasMembershipUpdate([])).toBe(false);
  });
});

describe("valueSources", () => {
  const first = evidenceItem({ evidence_id: "ev_1", source_index: 0 });
  const second = evidenceItem({ evidence_id: "ev_2", source_index: 1, pdf_page: 4 });
  const third = evidenceItem({ evidence_id: "ev_3", source_index: 2 });
  const otherField = evidenceItem({ evidence_id: "ev_4", field: "n_events" });
  const otherRow = evidenceItem({ evidence_id: "ev_5", row_index: 17 });

  it("returns every source of the same paper, row and field in source_index order", () => {
    const sources = valueSources([third, otherField, first, otherRow, second, otherPaper], second);
    expect(sources.map((item) => item.evidence_id)).toEqual(["ev_1", "ev_2", "ev_3"]);
  });

  it("treats a single source as a list of one", () => {
    expect(valueSources([otherPaper, first], otherPaper).map((item) => item.evidence_id)).toEqual(["ev_6"]);
  });

  it("always includes the linked item", () => {
    expect(valueSources([first, third], second).map((item) => item.evidence_id)).toEqual(["ev_1", "ev_2", "ev_3"]);
  });
});

describe("evidenceKind", () => {
  it("uses the stated derivation kind", () => {
    expect(evidenceKind({ derivation_kind: "verbatim", provenance_type: "paper" })).toBe("verbatim");
    expect(evidenceKind({ derivation_kind: "derived", provenance_type: "derived" })).toBe("derived");
    expect(evidenceKind({ derivation_kind: "inferred", provenance_type: "derived" })).toBe("inferred");
  });

  it("falls back to the provenance type", () => {
    expect(evidenceKind({ derivation_kind: null, provenance_type: "paper" })).toBe("verbatim");
    expect(evidenceKind({ derivation_kind: null, provenance_type: "derived" })).toBe("derived");
    expect(evidenceKind({ derivation_kind: "arithmetic", provenance_type: "derived" })).toBe("derived");
    expect(evidenceKind({ derivation_kind: null, provenance_type: null })).toBe("verbatim");
  });
});
