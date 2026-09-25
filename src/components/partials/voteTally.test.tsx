import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import VoteBar from "./VoteBar";
import { tallyPercents, tallyVotes } from "./voteTally";

describe("vote tally", () => {
  it("counts each position and the total", () => {
    const votes = [
      ...Array(12).fill({ position: "For" }),
      { position: "Abstain" },
    ];
    expect(tallyVotes(votes)).toEqual({ for: 12, against: 0, abstain: 1, total: 13 });
  });

  it("is empty for missing data", () => {
    expect(tallyVotes(undefined)).toEqual({ for: 0, against: 0, abstain: 0, total: 0 });
    expect(tallyPercents(tallyVotes([]))).toEqual({ for: 0, abstain: 0, against: 0 });
  });

  it("gives segment widths as shares of votes cast", () => {
    const pct = tallyPercents(
      tallyVotes([{ position: "For" }, { position: "For" }, { position: "Against" }, { position: "Abstain" }])
    );
    expect(pct).toEqual({ for: 50, abstain: 25, against: 25 });
  });
});

describe("vote bar", () => {
  it("labels the split for screen readers and shows the legend", () => {
    const html = renderToStaticMarkup(
      <VoteBar tally={{ for: 12, against: 0, abstain: 1, total: 13 }} />
    );
    expect(html).toContain('aria-label="12 for, 1 abstain, 0 against"');
    expect(html).toContain("12 for");
    expect(html).toContain("1 abstain");
  });

  it("says so when no votes are cast", () => {
    const html = renderToStaticMarkup(
      <VoteBar tally={{ for: 0, against: 0, abstain: 0, total: 0 }} />
    );
    expect(html).toContain('aria-label="No votes cast yet"');
  });
});
