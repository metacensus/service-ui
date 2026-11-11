// The Papers page's working-set membership rule. A synthetic all-active read
// stands in for the API's; the one-active read is derived from it in test code.

import { describe, expect, it } from "vitest";
import {
  syntheticPaperIds,
  workingSetFixture,
} from "@/features/reviewer-workspace/model/__fixtures__/workingSetFixture";
import { activePaperIds, type WorkingSet } from "@/features/reviewer-workspace/data/workingSet";
import { reviewPaperIdsByPmid } from "./paperReviewProgress";
import {
  membershipOfPaper,
  PAPER_MEMBERSHIP_LABELS,
  visibleMembership,
  type PaperMembershipStatus,
  type WorkingSetRead,
} from "./paperMembership";

const PAPER_IDS = syntheticPaperIds(5);
/** The pmids the papers table would hold: each paper id ends in `_<pmid>`. */
const DB_PMIDS = PAPER_IDS.map((id) => id.slice(id.lastIndexOf("_") + 1));
const [FIRST_PMID, SECOND_PMID, THIRD_PMID] = DB_PMIDS;
const THIRD_ID = PAPER_IDS[2];

function allActiveState(): WorkingSet {
  return workingSetFixture(PAPER_IDS);
}

/** Derived from the all-active read: only the third paper stays active. */
function derivedThirdOnly(): WorkingSet {
  const state = allActiveState();
  return {
    ...state,
    revision: PAPER_IDS.length - 1,
    members: state.members.map((member) =>
      member.paper_id === THIRD_ID ? member : { ...member, membership: "excluded" as const }
    ),
  };
}

const readyRead = (state: WorkingSet): WorkingSetRead => ({
  runId: state.run_id,
  status: "ready",
  activeByPmid: reviewPaperIdsByPmid(activePaperIds(state)),
});

describe("working-set membership on Papers", () => {
  it("maps every pmid to exactly one member of the all-active read", () => {
    const state = allActiveState();
    expect(state.members).toHaveLength(PAPER_IDS.length);
    expect(new Set(DB_PMIDS).size).toBe(PAPER_IDS.length);
    for (const pmid of DB_PMIDS) {
      expect(state.members.filter((member) => member.paper_id.endsWith(`_${pmid}`))).toHaveLength(1);
    }
    const read = readyRead(state);
    expect(read.activeByPmid.size).toBe(PAPER_IDS.length);
    for (const pmid of DB_PMIDS) expect(membershipOfPaper({ pmid }, read)).toBe("in");
  });

  it("the derived one-active read has that paper in and the others not in", () => {
    const read = readyRead(derivedThirdOnly());
    const statuses = DB_PMIDS.map((pmid) => membershipOfPaper({ pmid }, read));
    expect(membershipOfPaper({ pmid: THIRD_PMID }, read)).toBe("in");
    expect(membershipOfPaper({ pmid: FIRST_PMID }, read)).toBe("out");
    expect(statuses.filter((status) => status === "in")).toHaveLength(1);
    expect(statuses.filter((status) => status === "out")).toHaveLength(PAPER_IDS.length - 1);
  });

  it("matches by pmid, never by title", () => {
    const read = readyRead(derivedThirdOnly());
    const thirdTitleOtherPmid = {
      title: "Paper 3",
      pmid: SECOND_PMID,
    };
    expect(membershipOfPaper(thirdTitleOtherPmid, read)).toBe("out");
    expect(membershipOfPaper({ pmid: ` ${THIRD_PMID} ` }, read)).toBe("in");
  });

  it("a ready read never reports unavailable: no pmid or an unknown pmid is not in", () => {
    const read = readyRead(allActiveState());
    expect(membershipOfPaper({ pmid: "" }, read)).toBe("out");
    expect(membershipOfPaper({ pmid: undefined as unknown as string }, read)).toBe("out");
    expect(membershipOfPaper({ pmid: "99999999" }, read)).toBe("out");
    const empty: WorkingSetRead = { runId: "run", status: "ready", activeByPmid: new Map() };
    expect(membershipOfPaper({ pmid: THIRD_PMID }, empty)).toBe("out");
  });

  it("loading is its own state, not unavailable", () => {
    const loading: WorkingSetRead = { runId: "run", status: "loading", activeByPmid: new Map() };
    expect(membershipOfPaper({ pmid: THIRD_PMID }, loading)).toBe("loading");
  });

  it("a failed read or no run is unavailable, whatever the lookup holds", () => {
    const { activeByPmid } = readyRead(allActiveState());
    expect(membershipOfPaper({ pmid: THIRD_PMID }, { runId: "run", status: "error", activeByPmid })).toBe(
      "unavailable"
    );
    for (const status of ["loading", "ready", "error"] as const) {
      expect(membershipOfPaper({ pmid: THIRD_PMID }, { runId: null, status, activeByPmid })).toBe("unavailable");
    }
  });

  it("labels", () => {
    expect(PAPER_MEMBERSHIP_LABELS).toEqual({
      in: "In working set",
      out: "Not in working set",
      loading: "Checking working set…",
      unavailable: "Working-set membership unavailable",
    });
  });
});

describe("working-set membership visibility by lifecycle stage", () => {
  const statuses: PaperMembershipStatus[] = ["in", "out", "loading", "unavailable"];

  it("the first two columns show nothing, for every membership status", () => {
    for (const stage of ["Abstracts Gathered", "Abstracts Approved for Full-Text Review"] as const) {
      for (const status of statuses) expect(visibleMembership(status, stage)).toBeNull();
    }
  });

  it("an unknown placement (Review still loading) shows nothing", () => {
    for (const status of statuses) expect(visibleMembership(status, null)).toBeNull();
  });

  it("Extracted and Adjudicated show the membership status unchanged", () => {
    for (const stage of ["Papers Extracted", "Papers Adjudicated"] as const) {
      for (const status of statuses) expect(visibleMembership(status, stage)).toBe(status);
    }
  });
});
