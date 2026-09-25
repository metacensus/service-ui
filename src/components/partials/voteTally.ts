type Positioned = { position?: string | null };

export type VoteTally = {
  for: number;
  against: number;
  abstain: number;
  total: number;
};

/** Counts For / Against / Abstain. Any other position counts toward the total
 *  only, so the three bar segments never overstate what was cast. */
export function tallyVotes(votes: readonly Positioned[] | null | undefined): VoteTally {
  const tally: VoteTally = { for: 0, against: 0, abstain: 0, total: 0 };
  for (const vote of votes ?? []) {
    tally.total += 1;
    if (vote.position === "For") tally.for += 1;
    else if (vote.position === "Against") tally.against += 1;
    else if (vote.position === "Abstain") tally.abstain += 1;
  }
  return tally;
}

/** Segment widths as percentages of the votes cast; all zero with no votes. */
export function tallyPercents(tally: VoteTally) {
  const pct = (n: number) => (tally.total ? (n / tally.total) * 100 : 0);
  return {
    for: pct(tally.for),
    abstain: pct(tally.abstain),
    against: pct(tally.against),
  };
}
