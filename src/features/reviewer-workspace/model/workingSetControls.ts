import type {
  WorkingSetChange,
  WorkingSetMember,
  WorkingSetMembership,
} from "@/features/reviewer-workspace/data/workingSet";
import { editorCurrentLine, saveErrorMessage } from "@/features/reviewer-workspace/model/membership";

const DEFAULT_REASON: Record<WorkingSetMembership, string> = {
  active: "Added in Data → Table",
  excluded: "Removed in Data → Table",
};

/** The typed reason as saved: each run of control characters becomes one space, then trimmed. */
export function cleanReason(typed: string): string {
  return typed.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/** A reason left empty after cleaning saves the default for the action. */
export function membershipChanges(
  paperIds: string[],
  membership: WorkingSetMembership,
  active: ReadonlySet<string>,
  typedReason = ""
): WorkingSetChange[] {
  const reason = cleanReason(typedReason) || DEFAULT_REASON[membership];
  return paperIds
    .filter((id) => active.has(id) !== (membership === "active"))
    .map((paperId) => ({ paperId, membership, reason }));
}

export function workingSetButton(
  paperIds: string[],
  active: ReadonlySet<string>
): { label: string; membership: WorkingSetMembership } {
  return paperIds.length > 0 && paperIds.every((id) => active.has(id))
    ? { label: `Remove ${paperIds.length} from working set`, membership: "excluded" }
    : { label: `Add ${paperIds.length} to working set`, membership: "active" };
}

/** Ticked papers that are currently listed, in list order; hidden ticks count for nothing. */
export function tickedListed(listedIds: string[], ticked: ReadonlySet<string>): string[] {
  return listedIds.filter((id) => ticked.has(id));
}

export function canSelectAll(listedIds: string[], ticked: ReadonlySet<string>): boolean {
  return listedIds.some((id) => !ticked.has(id));
}

export function canUnselectAll(listedIds: string[], ticked: ReadonlySet<string>): boolean {
  return listedIds.some((id) => ticked.has(id));
}

/** The editor's subject after "Paper selection — ". */
export function selectionSubject(names: string[]): string {
  return names.length === 1 ? names[0] : `${names.length} papers`;
}

/** One paper reads like the chat; several read as a count of those already in. */
export function selectionCurrentLine(
  paperIds: string[],
  active: ReadonlySet<string>,
  single?: WorkingSetMember
): string {
  if (paperIds.length === 1 && single) return editorCurrentLine(single);
  const total = paperIds.length;
  const inSet = paperIds.filter((id) => active.has(id)).length;
  const line = `Current: ${inSet} of ${total} selected papers in the working set`;
  return inSet > 0 && inSet < total ? `${line} — only the ${total - inSet} not in it will be added` : line;
}

export function selectionConfirmLabel(membership: WorkingSetMembership): string {
  return membership === "active" ? "Add to set" : "Remove from set";
}

export function batchSaveMessage(error: unknown, saved: number, attempted: number): string {
  return saved === 0
    ? saveErrorMessage(error)
    : `Only ${saved} of ${attempted} changes were saved. It now shows what was saved; try again.`;
}

/** Data → Table's row filter: every paper, or only those in the working set. */
export type TableView = "all" | "workingSet";

export function viewFilter<T>(entries: T[], idOf: (entry: T) => string, view: TableView, active: ReadonlySet<string>): T[] {
  return view === "workingSet" ? entries.filter((entry) => active.has(idOf(entry))) : entries;
}

export function workingSetViewLabel(active: ReadonlySet<string>): string {
  return `Working set (${active.size})`;
}

const CLEAR_REASON = "Working set cleared in Data → Table";

/**
 * "Clear working set" removes every active paper through the same per-paper
 * remove path, so each removal is recorded in history. The papers are sorted
 * so the save order is stable.
 */
export function clearWorkingSetRequest(
  active: ReadonlySet<string>,
  typedReason = ""
): { paperIds: string[]; membership: WorkingSetMembership; reason: string } {
  return { paperIds: [...active].sort(), membership: "excluded", reason: cleanReason(typedReason) || CLEAR_REASON };
}

export function clearWorkingSetCurrentLine(active: ReadonlySet<string>): string {
  const n = active.size;
  return `Current: ${n} ${n === 1 ? "paper" : "papers"} in the working set — all will be removed`;
}
