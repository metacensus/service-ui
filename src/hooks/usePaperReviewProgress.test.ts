import { describe, expect, it } from "vitest";
import { papersReviewStatus } from "./usePaperReviewProgress";

describe("papersReviewStatus", () => {
  it("is loading while the index, actions or seed is pending, so seeded papers never flash unreviewed", () => {
    expect(papersReviewStatus({ hasRun: true, failed: false, pending: true })).toBe("loading");
  });

  it("is ready once everything has settled", () => {
    expect(papersReviewStatus({ hasRun: true, failed: false, pending: false })).toBe("ready");
  });

  it("is unavailable without a run or after a failed read, even while something is pending", () => {
    expect(papersReviewStatus({ hasRun: false, failed: false, pending: true })).toBe("unavailable");
    expect(papersReviewStatus({ hasRun: true, failed: true, pending: true })).toBe("unavailable");
  });
});
