
export function membershipChanges(
  paperIds: string[],
  membership: WorkingSetMembership,
): WorkingSetChange[] {
  return paperIds
    .filter((id) => active.has(id) !== (membership === "active"))
    .map((paperId) => ({ paperId, membership, reason }));
}

export function workingSetButton(
  active: ReadonlySet<string>
): { label: string; membership: WorkingSetMembership } {
}
