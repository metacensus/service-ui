
import { describe, expect, it } from "vitest";
import {
import { reviewPaperIdsByPmid } from "./paperReviewProgress";
import {
  membershipOfPaper,
  PAPER_MEMBERSHIP_LABELS,
  visibleMembership,
  type PaperMembershipStatus,
  type WorkingSetRead,
} from "./paperMembership";


function allActiveState(): WorkingSet {
}

  const state = allActiveState();
  return {
    ...state,
    members: state.members.map((member) =>
    ),
  };
}

const readyRead = (state: WorkingSet): WorkingSetRead => ({
  runId: state.run_id,
  status: "ready",
  activeByPmid: reviewPaperIdsByPmid(activePaperIds(state)),
});

describe("working-set membership on Papers", () => {
    const state = allActiveState();
    for (const pmid of DB_PMIDS) {
      expect(state.members.filter((member) => member.paper_id.endsWith(`_${pmid}`))).toHaveLength(1);
    }
    const read = readyRead(state);
    for (const pmid of DB_PMIDS) expect(membershipOfPaper({ pmid }, read)).toBe("in");
  });

    const statuses = DB_PMIDS.map((pmid) => membershipOfPaper({ pmid }, read));
    expect(statuses.filter((status) => status === "in")).toHaveLength(1);
  });

  it("matches by pmid, never by title", () => {
    };
  });

  it("a ready read never reports unavailable: no pmid or an unknown pmid is not in", () => {
    const read = readyRead(allActiveState());
    expect(membershipOfPaper({ pmid: "" }, read)).toBe("out");
    expect(membershipOfPaper({ pmid: undefined as unknown as string }, read)).toBe("out");
    expect(membershipOfPaper({ pmid: "99999999" }, read)).toBe("out");
    const empty: WorkingSetRead = { runId: "run", status: "ready", activeByPmid: new Map() };
  });

  it("loading is its own state, not unavailable", () => {
    const loading: WorkingSetRead = { runId: "run", status: "loading", activeByPmid: new Map() };
  });

  it("a failed read or no run is unavailable, whatever the lookup holds", () => {
    const { activeByPmid } = readyRead(allActiveState());
      "unavailable"
    );
    for (const status of ["loading", "ready", "error"] as const) {
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
