import { describe, expect, it } from "vitest";
import { WorkingSetSaveError, type WorkingSetMember } from "../data/workingSet";
import { FAILED_SAVE_MESSAGE, STALE_SAVE_MESSAGE } from "./membership";
import {
  batchSaveMessage,
  canSelectAll,
  canUnselectAll,
  cleanReason,
  clearWorkingSetCurrentLine,
  clearWorkingSetRequest,
  membershipChanges,
  selectionConfirmLabel,
  selectionCurrentLine,
  selectionSubject,
  tickedListed,
  viewFilter,
  workingSetButton,
  workingSetViewLabel,
} from "./workingSetControls";


describe("working-set controls", () => {
  it("reads 'Remove N from working set' when every listed paper is active", () => {
    expect(button).toEqual({ label: "Remove 3 from working set", membership: "excluded" });
  });

  it("reads 'Add N to working set' with N the listed count when any listed paper is out", () => {
    expect(button).toEqual({ label: "Add 3 to working set", membership: "active" });
  });

  it("an empty list offers 'Add 0', never 'Remove'", () => {
    expect(workingSetButton([], new Set(LISTED)).label).toBe("Add 0 to working set");
  });

  it("Add changes only the listed papers that are not already active, with the fixed reason", () => {
    ]);
  });

  it("Remove changes only the listed papers that are active, with the fixed reason", () => {
    ]);
  });
});

describe("ticked papers", () => {
  it("the button acts on the ticked papers: one ticked and out reads 'Add 1'", () => {
      label: "Add 1 to working set",
      membership: "active",
    });
  });

  it("every ticked paper in reads 'Remove N'", () => {
    expect(workingSetButton(ticked, new Set(ticked)).label).toBe("Remove 2 from working set");
  });

  it("a mixed selection (some in, some out) reads 'Add N' with N every ticked paper", () => {
      label: "Add 3 to working set",
      membership: "active",
    });
  });

  it("only ticked papers that are listed count, in list order", () => {
  });

  it("Select all is enabled while any listed paper is unticked, and never for an empty list", () => {
    expect(canSelectAll(LISTED, new Set())).toBe(true);
    expect(canSelectAll(LISTED, new Set(LISTED.slice(1)))).toBe(true);
    expect(canSelectAll(LISTED, new Set(LISTED))).toBe(false);
    expect(canSelectAll([], new Set())).toBe(false);
  });

  it("Unselect all is enabled only while a listed paper is ticked; a hidden tick does not count", () => {
    expect(canUnselectAll(LISTED, new Set())).toBe(false);
  });
});

describe("the Table reason", () => {
  it("replaces each run of control characters with one space, then trims", () => {
    expect(cleanReason("line one\nline two")).toBe("line one line two");
    expect(cleanReason("a\r\n\tb\u0000\u007fc")).toBe("a b c");
    expect(cleanReason("\n  HapB3 carriers \t")).toBe("HapB3 carriers");
  });

  it("an empty, blank or control-only reason cleans to nothing", () => {
    expect(cleanReason("")).toBe("");
    expect(cleanReason("   ")).toBe("");
    expect(cleanReason("\n\t\r")).toBe("");
  });

  it("a typed reason is sent for every changed paper", () => {
    ]);
  });

  it("a reason that cleans to nothing saves the default", () => {
    ]);
    ]);
  });
});

describe("the Table editor text", () => {
  const boige: WorkingSetMember = {
    membership: "excluded",
    decision_origin: "default",
    reason: null,
    actor: null,
    changed_at: null,
  };

  it("titles one paper by name and several by count", () => {
      "2 papers"
    );
  });

  it("one paper reads the chat's current line", () => {
      "Current: Excluded by default — no decision recorded — no recorded reason"
    );
  });

  it("several papers read how many are in", () => {
    expect(selectionCurrentLine(pair, new Set())).toBe("Current: 0 of 2 selected papers in the working set");
    expect(selectionCurrentLine(pair, new Set(pair))).toBe("Current: 2 of 2 selected papers in the working set");
  });

  it("a mixed selection says only the ones not in it will be added", () => {
      "Current: 1 of 2 selected papers in the working set — only the 1 not in it will be added"
    );
      "Current: 1 of 3 selected papers in the working set — only the 2 not in it will be added"
    );
  });

  it("confirms with Add or Remove", () => {
    expect(selectionConfirmLabel("active")).toBe("Add to set");
    expect(selectionConfirmLabel("excluded")).toBe("Remove from set");
  });

  it("nothing saved reads the chat's stale or failed message", () => {
    expect(batchSaveMessage(new WorkingSetSaveError("/m", 409, "stale_revision"), 0, 2)).toBe(STALE_SAVE_MESSAGE);
    expect(batchSaveMessage(new WorkingSetSaveError("/m", 400, "invalid_reason"), 0, 2)).toBe(FAILED_SAVE_MESSAGE);
    expect(batchSaveMessage(new Error("network"), 0, 1)).toBe(FAILED_SAVE_MESSAGE);
  });

  it("a partial save says how many went through", () => {
    expect(batchSaveMessage(new WorkingSetSaveError("/m", 409, "stale_revision"), 3, 43)).toBe(
      "Only 3 of 43 changes were saved. It now shows what was saved; try again."
    );
  });
});

describe("working-set table view", () => {
  const rows = LISTED.map((paper_id) => ({ paper_id }));

  it("'All papers' keeps every row in order", () => {
    expect(viewFilter(rows, (row) => row.paper_id, "all", active)).toEqual(rows);
  });

  it("'Working set only' keeps only active papers, in list order", () => {
    expect(viewFilter(rows, (row) => row.paper_id, "workingSet", new Set())).toEqual([]);
  });

  it("labels the view with the working-set size", () => {
    expect(workingSetViewLabel(active)).toBe("Working set (2)");
    expect(workingSetViewLabel(new Set())).toBe("Working set (0)");
  });
});

describe("clear working set", () => {
  it("removes every active paper, not just the listed ones", () => {
    expect(clearWorkingSetRequest(active)).toEqual({
      membership: "excluded",
      reason: "Working set cleared in Data → Table",
    });
  });

  it("keeps a typed reason, cleaned", () => {
    expect(clearWorkingSetRequest(new Set(["a"]), "  starting\nover ").reason).toBe("starting over");
  });

  it("each cleared paper becomes one recorded removal", () => {
    const active = new Set(["a", "b"]);
    const { paperIds, membership, reason } = clearWorkingSetRequest(active, "reset");
    expect(membershipChanges(paperIds, membership, active, reason)).toEqual([
      { paperId: "a", membership: "excluded", reason: "reset" },
      { paperId: "b", membership: "excluded", reason: "reset" },
    ]);
  });

  it("describes what will be removed", () => {
    expect(clearWorkingSetCurrentLine(new Set(["a"]))).toBe("Current: 1 paper in the working set — all will be removed");
    expect(clearWorkingSetCurrentLine(new Set(["a", "b"]))).toBe("Current: 2 papers in the working set — all will be removed");
  });
});
