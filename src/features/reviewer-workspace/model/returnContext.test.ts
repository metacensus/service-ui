import { describe, expect, it } from "vitest";
import {
  parseReviewOrigin,
  reviewBackHref,
  unitHrefWithOrigin,
} from "./returnContext";

describe("parseReviewOrigin", () => {
  it("accepts chat and table", () => {
  });

  it("treats anything else as not-from-Data", () => {
    expect(parseReviewOrigin(undefined)).toBe(null);
    expect(parseReviewOrigin("explore")).toBe(null);
  });
});

describe("review navigation hrefs", () => {
  const base = "/topics/t/topic-review";

  it("opens units with the origin and returns to the originating mode", () => {
    );
  });

  it("preserves the queue behavior for users who did not come from Data", () => {
    expect(unitHrefWithOrigin(base, "u1", null)).toBe(`${base}/units/u1`);
    expect(reviewBackHref(base, null)).toBe(base);
  });
});
