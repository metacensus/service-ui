import { describe, expect, it } from "vitest";
import { findMatches, marksByPage, stepMatch, TextRun } from "./pdfSearch";

const run = (str: string, x = 0, hasEOL = false): TextRun => ({
  str,
  hasEOL,
  x,
  y: 0.1,
  w: str.length / 100,
  h: 0.02,
});

describe("findMatches", () => {
  it("finds every match on every page, ignoring case", () => {
    const pages = [[run("Cannabis and cannabinoids")], [], [run("CANNABIS")]];
    expect(findMatches(pages, "cannabi").map((m) => m.page)).toEqual([1, 1, 3]);
  });

  it("boxes the matched characters within a run", () => {
    const [match] = findMatches([[run("the dose", 0.5)]], "dose");
    expect(match.rects).toHaveLength(1);
    expect(match.rects[0].x).toBeCloseTo(0.54);
    expect(match.rects[0].w).toBeCloseTo(0.04);
  });

  it("matches across a line break, one box per run", () => {
    const pages = [[run("low", 0, true), run("dose", 0.2)]];
    const [match] = findMatches(pages, "low dose");
    expect(match.rects).toHaveLength(2);
    expect(match.rects[1].x).toBeCloseTo(0.2);
  });

  it("finds nothing for an empty or blank query", () => {
    const pages = [[run("text")]];
    expect(findMatches(pages, "")).toEqual([]);
    expect(findMatches(pages, "  ")).toEqual([]);
  });
});

describe("stepMatch", () => {
  it("steps forward and back, wrapping at either end", () => {
    expect(stepMatch(0, 3, 1)).toBe(1);
    expect(stepMatch(2, 3, 1)).toBe(0);
    expect(stepMatch(0, 3, -1)).toBe(2);
  });

  it("stays at zero with no matches", () => {
    expect(stepMatch(0, 0, 1)).toBe(0);
  });
});

describe("marksByPage", () => {
  const pages = [[run("dose and dose")], [run("dose")]];

  it("marks each page's matches, the current one apart", () => {
    const marks = marksByPage(findMatches(pages, "dose"), 2);
    expect(marks.get(1)?.map((m) => m.current)).toEqual([false, false]);
    expect(marks.get(2)?.map((m) => m.current)).toEqual([true]);
  });
});
