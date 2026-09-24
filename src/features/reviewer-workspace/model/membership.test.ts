import { describe, expect, it } from "vitest";
import {
  WorkingSetSaveError,
  type WorkingSet,
  type WorkingSetMember,
} from "../data/workingSet";
import {
  BLANK_REASON_MESSAGE,
  FAILED_SAVE_MESSAGE,
  STALE_SAVE_MESSAGE,
  bubbleAriaLabel,
  doneMessage,
  editorAction,
  editorCurrentLine,
  excludedLensNote,
  membershipDot,
  membershipShortLabel,
  membershipStateLabel,
  revisionTag,
  saveErrorMessage,
  summaryLists,
  summaryText,
  workingSetCounts,
} from "./membership";

function member(overrides: Partial<WorkingSetMember> = {}): WorkingSetMember {
  return {
    membership: "excluded",
    decision_origin: "default",
    reason: null,
    actor: null,
    changed_at: null,
    ...overrides,
  };
}

const includedDefault = member({ membership: "active" });
const includedManual = member({ membership: "active", decision_origin: "manual", reason: "In scope" });
const includedAgent = member({ membership: "active", decision_origin: "agent_confirmed", reason: "Confirmed in chat" });
const excludedAgent = member({ decision_origin: "agent_confirmed", reason: "Agent removed" });
const excludedDefault = member();

function workingSet(members: WorkingSetMember[], revision = 3): WorkingSet {
  return { topic_id: "topc:x", run_id: "run", revision, members, history: [] };
}

describe("membership state labels", () => {
  it("gives each of the six states its full label", () => {
    expect(membershipStateLabel(includedDefault)).toBe("Included by default");
    expect(membershipStateLabel(includedManual)).toBe("Included — recorded decision (manual)");
    expect(membershipStateLabel(includedAgent)).toBe("Included — recorded decision (agent-confirmed)");
    expect(membershipStateLabel(excludedManual)).toBe("Excluded — recorded decision (manual)");
    expect(membershipStateLabel(excludedAgent)).toBe("Excluded — recorded decision (agent-confirmed)");
    expect(membershipStateLabel(excludedDefault)).toBe("Excluded by default — no decision recorded");
  });

  it("uses Included / Excluded as the bubble text", () => {
    expect(membershipShortLabel(includedDefault)).toBe("Included");
    expect(membershipShortLabel(includedAgent)).toBe("Included");
    expect(membershipShortLabel(excludedDefault)).toBe("Excluded");
    expect(membershipShortLabel(excludedManual)).toBe("Excluded");
  });

  it("gives default and recorded states different dot shapes", () => {
    expect(membershipDot(includedDefault)).toBe("included-default");
    expect(membershipDot(includedManual)).toBe("included-recorded");
    expect(membershipDot(includedAgent)).toBe("included-recorded");
    expect(membershipDot(excludedManual)).toBe("excluded-recorded");
    expect(membershipDot(excludedAgent)).toBe("excluded-recorded");
    expect(membershipDot(excludedDefault)).toBe("excluded-default");
  });

  it("builds the bubble aria-label from the title and full label", () => {
    );
  });
});

describe("membership editor", () => {
  it("shows the recorded reason, or says there is none", () => {
    expect(editorCurrentLine(includedManual)).toBe("Current: Included — recorded decision (manual) — reason: “In scope”");
    expect(editorCurrentLine(excludedDefault)).toBe("Current: Excluded by default — no decision recorded — no recorded reason");
    expect(editorCurrentLine(member({ membership: "active", reason: "stale default reason" }))).toBe(
      "Current: Included by default — no recorded reason"
    );
  });

  it("offers the single opposite action", () => {
    expect(editorAction(includedDefault)).toEqual({ label: "Remove from set", membership: "excluded" });
    expect(editorAction(includedAgent)).toEqual({ label: "Remove from set", membership: "excluded" });
    expect(editorAction(excludedManual)).toEqual({ label: "Add back to set", membership: "active" });
    expect(editorAction(excludedDefault)).toEqual({ label: "Add to set", membership: "active" });
  });

  it("maps a 409 to the stale text and anything else to the failure text", () => {
    expect(saveErrorMessage(new WorkingSetSaveError("/x", 409, "stale_revision"))).toBe(STALE_SAVE_MESSAGE);
    expect(saveErrorMessage(new WorkingSetSaveError("/x", 500, null))).toBe(FAILED_SAVE_MESSAGE);
    expect(saveErrorMessage(new TypeError("Failed to fetch"))).toBe(FAILED_SAVE_MESSAGE);
    expect(STALE_SAVE_MESSAGE).toBe("The working set changed elsewhere. It now shows the latest; try again.");
    expect(FAILED_SAVE_MESSAGE).toBe("That save didn’t go through — nothing changed.");
    expect(BLANK_REASON_MESSAGE).toBe("Give a reason before saving — nothing changed.");
  });
});

describe("working-set summary", () => {
  const set = workingSet([
    includedManual,
  ]);

  it("counts included and excluded against the member count", () => {
    const counts = workingSetCounts(set);
    expect(counts).toEqual({ included: 1, excluded: 2, total: 3 });
    expect(summaryText(counts)).toBe("1 / 3 papers included · 2 excluded");
  });

    const seed = workingSet(
      Array.from({ length: 43 }, (_, index) => member({ paper_id: `paper_${index}` })),
      0
    );
    expect(summaryText(workingSetCounts(seed))).toBe("0 / 43 papers included · 43 excluded");
  });

  it("splits the lists and keeps only recorded reasons", () => {
    const lists = summaryLists(set, (paperId) => `Title of ${paperId}`);
    expect(lists.included).toEqual([
    ]);
    expect(lists.excluded).toEqual([
    ]);
  });

  it("writes the Done text with the server's counts", () => {
    );
    );
  });
});

describe("revisionTag", () => {
  it("tags an answer given at another revision", () => {
    expect(revisionTag(2, 3)).toEqual({
      title: "Answered at working-set revision 2; the set is now at revision 3",
    });
  });

    expect(revisionTag(3, 3)).toBeNull();
    expect(revisionTag(undefined, 3)).toBeNull();
    expect(revisionTag(2, null)).toBeNull();
  });
});

describe("excludedLensNote", () => {
  it("says the paper is outside the set, with a recorded reason when there is one", () => {
    expect(excludedLensNote(excludedManual)).toBe(
    );
  });

  it("has no note for an included paper", () => {
    expect(excludedLensNote(includedDefault)).toBeNull();
    expect(excludedLensNote(includedManual)).toBeNull();
  });
});
