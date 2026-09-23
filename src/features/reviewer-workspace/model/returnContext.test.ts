import { describe, expect, it } from "vitest";
import {
  EMPTY_TABLE_STATE,
  parseReviewOrigin,
  parseSelectionParam,
  parseTableState,
  reviewBackHref,
  reviewBackLabel,
  reviewSearchFromData,
  selectionParam,
  tableStateParams,
  unitHrefWithOrigin,
} from "./returnContext";

const searchOf = (query: string) => new URLSearchParams(query);

describe("parseReviewOrigin", () => {
  it("accepts chat and table", () => {
    expect(parseReviewOrigin("chat")).toEqual({ mode: "chat" });
    expect(parseReviewOrigin("table")).toEqual({
      mode: "table",
      table: EMPTY_TABLE_STATE,
    });
  });

  it("treats anything else as not-from-Data", () => {
    expect(parseReviewOrigin(undefined)).toBe(null);
    expect(parseReviewOrigin("explore")).toBe(null);
  });

  it("snapshots table params for table origins only", () => {
    const origin = parseReviewOrigin(
      "table",
      searchOf("paper=p1&q=hapb3&field=gene&status=open&sel=2%3Agene")
    );
    expect(origin).toEqual({
      mode: "table",
    });
    expect(parseReviewOrigin("chat", searchOf("paper=p1"))).toEqual({
      mode: "chat",
    });
  });
});

describe("selectionParam / parseSelectionParam", () => {
  it("rejects a selection without a paper or a parsable row index", () => {
    expect(parseSelectionParam("p1", "2:gene")).toEqual({
      paperId: "p1",
      rowIndex: 2,
      field: "gene",
    });
    expect(parseSelectionParam("", "2:gene")).toBe(null);
    expect(parseSelectionParam("p1", "")).toBe(null);
    expect(parseSelectionParam("p1", "nope")).toBe(null);
  });

  it("round-trips the sel wire format", () => {
    expect(selectionParam({ rowIndex: 2, field: "gene" })).toBe("2:gene");
    expect(selectionParam(null)).toBe("");
    expect(parseSelectionParam("p1", selectionParam({ rowIndex: 0, field: "a:b" }))).toEqual({
      paperId: "p1",
      rowIndex: 0,
      field: "a:b",
    });
  });
});

describe("parseTableState / tableStateParams", () => {
  it("falls back to empty on missing or invalid values", () => {
    expect(parseTableState(searchOf("status=bogus&field=&paper="))).toEqual(
      EMPTY_TABLE_STATE
    );
  });

  it("round-trips through params, omitting defaults", () => {
    expect(tableStateParams(EMPTY_TABLE_STATE)).toEqual({});
    expect(tableStateParams(table)).toEqual({
      paper: "p1",
      q: "x",
      status: "open",
    });
    expect(parseTableState(new URLSearchParams(tableStateParams(table)))).toEqual(table);
  });
});

    expect(tableStateParams(EMPTY_TABLE_STATE)).toEqual({});
describe("review navigation hrefs", () => {
  const base = "/topics/t/topic-review";

  it("opens units with the origin and returns to the originating mode", () => {
    expect(unitHrefWithOrigin(base, "u1", { mode: "chat" })).toBe(
      `${base}/units/u1?from=chat`
    );
    expect(reviewBackHref(base, { mode: "table", table: EMPTY_TABLE_STATE })).toBe(
      `${base}/data?mode=table`
    );
  });

  it("carries the table snapshot through unit and back hrefs", () => {
      paper: "p1",
      q: "hapb3",
    };
    const unitHref = unitHrefWithOrigin(base, "u1", { mode: "table", table });
    expect(unitHref).toContain("from=table");
    expect(unitHref).toContain("paper=p1");
    expect(unitHref).toContain("q=hapb3");
    const origin = parseReviewOrigin(
      "table",
      new URLSearchParams(unitHref.split("?")[1])
    );
    expect(origin).toMatchObject({ mode: "table", table: { paper: "p1", q: "hapb3" } });
    expect(reviewBackHref(base, origin)).toContain("mode=table");
    expect(reviewBackHref(base, origin)).toContain("paper=p1");
  });

  it("preserves the queue behavior for users who did not come from Data", () => {
    expect(unitHrefWithOrigin(base, "u1", null)).toBe(`${base}/units/u1`);
    expect(reviewBackHref(base, null)).toBe(base);
    expect(reviewBackLabel(null)).toBe("Back to the review queue");
  });

  it("labels the back link honestly: filters only for Table", () => {
    expect(reviewBackLabel(null)).toBe("Back to the review queue");
    expect(reviewBackLabel({ mode: "chat" })).toBe("Back to Data — Chat");
    expect(
      reviewBackLabel({ mode: "table", table: EMPTY_TABLE_STATE })
    ).toContain("filters restored");
  });

  it("builds the Review link from the entry mode", () => {
    expect(reviewSearchFromData("chat", searchOf(""))).toBe("?from=chat");
  });

  it("carries the table snapshot into the Review link", () => {
    expect(
      reviewSearchFromData(
        "table",
        searchOf("paper=p1&q=hapb3&field=gene&status=open&sel=2%3Agene")
      )
    ).toBe("?from=table&paper=p1&q=hapb3&field=gene&status=open&sel=2%3Agene");
  });
});
