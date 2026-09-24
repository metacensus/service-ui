// Working-set membership copy for Data → Chat: the labels, the editor text
// and the summary counts, all derived from the server's members. A paper with
// no member row has no state here — callers show "Selection unavailable".

import {
  WorkingSetSaveError,
  type WorkingSet,
  type WorkingSetMember,
  type WorkingSetMembership,
} from "../data/workingSet";

type MemberState = Pick<WorkingSetMember, "membership" | "decision_origin">;

/** Shape of the dot before the bubble text; shape carries the origin, not colour alone. */
export type MembershipDot =
  | "included-default"
  | "included-recorded"
  | "excluded-recorded"
  | "excluded-default";

export function membershipDot(member: MemberState): MembershipDot {
  const recorded = member.decision_origin !== "default";
  if (member.membership === "active") return recorded ? "included-recorded" : "included-default";
  return recorded ? "excluded-recorded" : "excluded-default";
}

export function membershipShortLabel(member: MemberState): "Included" | "Excluded" {
  return member.membership === "active" ? "Included" : "Excluded";
}

export function membershipStateLabel(member: MemberState): string {
  const origin = member.decision_origin === "agent_confirmed" ? "agent-confirmed" : "manual";
  if (member.membership === "active") {
    return member.decision_origin === "default"
      ? "Included by default"
      : `Included — recorded decision (${origin})`;
  }
  return member.decision_origin === "default"
    ? "Excluded by default — no decision recorded"
    : `Excluded — recorded decision (${origin})`;
}

export function bubbleAriaLabel(title: string, member: MemberState): string {
  return `Paper selection for ${title}: ${membershipStateLabel(member)}. Activate for reason and action.`;
}

/** The reason worth showing: only a recorded decision carries one. */
function recordedReason(member: WorkingSetMember): string | null {
  return member.decision_origin !== "default" && member.reason ? member.reason : null;
}

export function editorCurrentLine(member: WorkingSetMember): string {
  const reason = recordedReason(member);
  return `Current: ${membershipStateLabel(member)} — ${reason ? `reason: “${reason}”` : "no recorded reason"}`;
}

export function editorAction(member: MemberState): { label: string; membership: WorkingSetMembership } {
  if (member.membership === "active") return { label: "Remove from set", membership: "excluded" };
  return member.decision_origin === "default"
    ? { label: "Add to set", membership: "active" }
    : { label: "Add back to set", membership: "active" };
}

export const BLANK_REASON_MESSAGE = "Give a reason before saving — nothing changed.";
export const STALE_SAVE_MESSAGE = "The working set changed elsewhere. It now shows the latest; try again.";
export const FAILED_SAVE_MESSAGE = "That save didn’t go through — nothing changed.";

export function saveErrorMessage(error: unknown): string {
  return error instanceof WorkingSetSaveError && error.code === "stale_revision"
    ? STALE_SAVE_MESSAGE
    : FAILED_SAVE_MESSAGE;
}

export type WorkingSetCounts = { included: number; excluded: number; total: number };

export function workingSetCounts(workingSet: WorkingSet): WorkingSetCounts {
  const included = workingSet.members.filter((member) => member.membership === "active").length;
  return { included, excluded: workingSet.members.length - included, total: workingSet.members.length };
}

export function summaryText(counts: WorkingSetCounts): string {
  return `${counts.included} / ${counts.total} papers included · ${counts.excluded} excluded`;
}

export function doneMessage(title: string, membership: WorkingSetMembership, counts: WorkingSetCounts): string {
  const where = membership === "active" ? "in" : "out of";
  return `Done — ${title} is ${where} the set. ${counts.included} of ${counts.total} papers included.`;
}

export type SummaryItem = { paperId: string; title: string; reason: string | null };

/** Members split into the summary's two lists, in the server's order. */
export function summaryLists(
  workingSet: WorkingSet,
  titleFor: (paperId: string) => string
): { included: SummaryItem[]; excluded: SummaryItem[] } {
  const included: SummaryItem[] = [];
  const excluded: SummaryItem[] = [];
  for (const member of workingSet.members) {
    const item = { paperId: member.paper_id, title: titleFor(member.paper_id), reason: recordedReason(member) };
    (member.membership === "active" ? included : excluded).push(item);
  }
  return { included, excluded };
}

/** Only an answer that reports a numeric revision other than the current one is tagged. */
export function revisionTag(
  setRevision: number | undefined,
  currentRevision: number | null
): { text: string; title: string } | null {
  if (typeof setRevision !== "number" || currentRevision === null || setRevision === currentRevision) return null;
  return {
    title: `Answered at working-set revision ${setRevision}; the set is now at revision ${currentRevision}`,
  };
}

export function excludedLensNote(member: WorkingSetMember): string | null {
  if (member.membership !== "excluded") return null;
  const reason = recordedReason(member);
}
