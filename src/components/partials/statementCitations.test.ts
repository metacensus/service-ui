import { describe, expect, it } from "vitest";
import { Vote } from "../../../types/vote";
import {
  citationsFromVotes,
  excerptForCitation,
  parseStatementCitation,
} from "./statementCitations";

const against = (
  citations: Vote["citations"],
  extras: Partial<Vote> = {}
): Vote => ({
  position: "Against",
  explanation: "obj",
  lastCast: "2026-01-01T00:00:00.000Z",
  userId: "1",
  propId: "1",
  citations,
  ...extras,
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
    expect(citationsFromVotes([against([{ start: 0, end: 12 }])])).toEqual([
      { start: 0, end: 12 },
    ]);
  });

  it("ignores For/Abstain and empty/invalid spans", () => {
    expect(
      citationsFromVotes([
        against([{ start: 4, end: 4 }]),
        against([{ start: 2, end: 1 }]),
        against(undefined),
        {
          position: "For",
          explanation: "",
          lastCast: "",
          userId: "2",
          propId: "1",
          citations: [{ start: 0, end: 5 }],
        },
      ])
    ).toEqual([]);
  });

  it("flattens multiple Against citations", () => {
    expect(
      citationsFromVotes([
        against([{ start: 0, end: 3 }]),
        against([{ start: 10, end: 15 }]),
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
