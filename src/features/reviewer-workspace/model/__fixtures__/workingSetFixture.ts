// A synthetic working-set read in the API's shape, for tests that need one.

import type { WorkingSet } from "../../data/workingSet";
import { RUN, TOPIC } from "./reviewTaskFixtures";

/** `n` generic review paper ids, each ending in a numeric pmid: `paper-1_2000_1000001`, ... */
export function syntheticPaperIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `paper-${i + 1}_2000_${1000001 + i}`);
}

/** A full read: every paper active with the default origin, revision 0, no history. */
export function workingSetFixture(paperIds: readonly string[]): WorkingSet {
  return {
    topic_id: TOPIC,
    run_id: RUN,
    revision: 0,
    members: paperIds.map((paper_id) => ({
      paper_id,
      membership: "active",
      decision_origin: "default",
      reason: null,
      actor: null,
      changed_at: null,
    })),
    history: [],
  };
}
