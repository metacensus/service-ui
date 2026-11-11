import { describe, expect, it } from "vitest";
import { NO_LABELS } from "../../data/snapshot";
import { featuredPapers, orderFeatured } from "./demoLabels";

const labels = { ...NO_LABELS, featured_papers: ["paper-b", "paper-c"] };

describe("featuredPapers", () => {
  it("takes the export's list, else the run's labels'", () => {
    expect(featuredPapers({ featured_papers: ["paper-a"] }, labels)).toEqual(["paper-a"]);
    expect(featuredPapers({}, labels)).toEqual(["paper-b", "paper-c"]);
    expect(featuredPapers(null, NO_LABELS)).toEqual([]);
  });
});

describe("orderFeatured", () => {
  it("lists featured papers first, in order; the rest keep theirs", () => {
    const papers = ["paper-a", "paper-c", "paper-d", "paper-b"].map((paper_id) => ({ paper_id }));
    expect(orderFeatured(papers, ["paper-b", "paper-c"]).map((paper) => paper.paper_id)).toEqual([
      "paper-b",
      "paper-c",
      "paper-a",
      "paper-d",
    ]);
  });
});
