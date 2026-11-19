import { describe, expect, it } from "vitest";
import { Vote_Position, type VoteRecord } from "@metacensus/api";
import {
  citationsFromVotes,
  excerptForCitation,
  parseStatementCitation,
} from "./statementCitations";

const vote = (
  citations: VoteRecord["citations"],
  position = Vote_Position.Against
): VoteRecord => ({
  position,
  explanation: "obj",
  topicId: "topic:1",
  userId: "1",
  propId: "1",
  citations,
});

describe("parseStatementCitation", () => {
  it("accepts a half-open finite range", () => {
    expect(parseStatementCitation({ start: 0, end: 12 })).toEqual({
      start: 0,
      end: 12,
    });
  });

  it("rejects empty, reversed, negative, and non-finite ranges", () => {
    expect(parseStatementCitation({ start: 4, end: 4 })).toBeUndefined();
    expect(parseStatementCitation({ start: 2, end: 1 })).toBeUndefined();
    expect(parseStatementCitation({ start: -1, end: 3 })).toBeUndefined();
    expect(parseStatementCitation({ start: 0.5, end: 3 })).toBeUndefined();
    expect(
      parseStatementCitation({ start: Number.NaN, end: 3 })
    ).toBeUndefined();
    expect(
      parseStatementCitation({ start: 0, end: Number.POSITIVE_INFINITY })
    ).toBeUndefined();
  });
});

describe("citationsFromVotes", () => {
  it("keeps citations that start at index 0", () => {
    expect(citationsFromVotes([vote([{ start: 0, end: 12 }])])).toEqual([
      { start: 0, end: 12 },
    ]);
  });

  it("ignores For/Abstain and empty/invalid spans", () => {
    expect(
      citationsFromVotes([
        vote([{ start: 4, end: 4 }]),
        vote([{ start: 2, end: 1 }]),
        vote([]),
        vote([{ start: 0, end: 5 }], Vote_Position.For),
      ])
    ).toEqual([]);
  });

  it("flattens multiple Against citations", () => {
    expect(
      citationsFromVotes([
        vote([{ start: 0, end: 3 }]),
        vote([{ start: 10, end: 15 }]),
      ])
    ).toEqual([
      { start: 0, end: 3 },
      { start: 10, end: 15 },
    ]);
  });
});

describe("excerptForCitation", () => {
  it("slices the half-open range", () => {
    expect(
      excerptForCitation({
        statement: "DPYD testing should",
        citation: { start: 0, end: 4 },
      })
    ).toBe("DPYD");
  });
});
