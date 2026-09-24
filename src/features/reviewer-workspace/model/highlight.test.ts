import { describe, expect, it } from "vitest";
import { hasTextHighlight } from "./highlight";

const rect = { x: 0.1, y: 0.2, w: 0.3, h: 0.02 };

describe("hasTextHighlight", () => {
  it("rects on a page count", () => {
    expect(hasTextHighlight({ highlight: [{ page: 3, rects: [rect] }] })).toBe(true);
    expect(hasTextHighlight({ highlight: [{ page: 1, rects: [rect] }] })).toBe(true);
  });

  it("a page-only entry (no rects) does not", () => {
    expect(hasTextHighlight({ highlight: [{ page: 3, rects: [] }] })).toBe(false);
    expect(hasTextHighlight({ highlight: [{ page: 3 }] })).toBe(false);
  });

  it("the page must be an integer >= 1", () => {
    expect(hasTextHighlight({ highlight: [{ page: 0, rects: [rect] }] })).toBe(false);
    expect(hasTextHighlight({ highlight: [{ page: -1, rects: [rect] }] })).toBe(false);
    expect(hasTextHighlight({ highlight: [{ page: 2.5, rects: [rect] }] })).toBe(false);
    expect(hasTextHighlight({ highlight: [{ page: "3", rects: [rect] }] })).toBe(false);
    expect(hasTextHighlight({ highlight: [{ page: null, rects: [rect] }] })).toBe(false);
    expect(hasTextHighlight({ highlight: [{ page: true, rects: [rect] }] })).toBe(false);
  });

  it("any one entry is enough", () => {
    expect(hasTextHighlight({ highlight: [{ page: 2, rects: [] }, { page: 3, rects: [rect] }] })).toBe(true);
  });

  it("reads only the highlight list", () => {
    const pageOnlyResolution = { resolution: "page_only", highlight: [{ page: 3, rects: [rect] }] };
    expect(hasTextHighlight(pageOnlyResolution)).toBe(true);
  });

  it("a missing, null or malformed list has none", () => {
    expect(hasTextHighlight(undefined)).toBe(false);
    expect(hasTextHighlight(null)).toBe(false);
    expect(hasTextHighlight({})).toBe(false);
    expect(hasTextHighlight({ highlight: null })).toBe(false);
    expect(hasTextHighlight({ highlight: "page 3" })).toBe(false);
    expect(hasTextHighlight({ highlight: [null, 3] })).toBe(false);
  });
});
