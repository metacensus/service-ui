/** Compare API/JWT ids that may be number or string. */
export function sameEntityId(a: unknown, b: unknown): boolean {
  if (a == null || b == null || a === "" || b === "") return false;
  return String(a) === String(b);
}

/** Exact user match — not substring (`"10".includes("1")` is true). */
export function findVoteForUser<T extends { userId: string }>(
  votes: T[] | null | undefined,
  userId: string | undefined
): T | undefined {
  if (!votes || userId == null || userId === "") return undefined;
  return votes.find((vote) => sameEntityId(vote.userId, userId));
}

const CLOSED_CONCLUSIONS = new Set(["passed", "failed", "expired"]);

/** True only for terminal conclusions — not `"open"` (truthy but still votable). */
export function isPropVoteClosed<
  T extends { concluded?: string; conclusion?: string },
>(
  prop: T | null | undefined
): prop is T & { concluded: string; conclusion: string } {
  if (!prop?.concluded) return false;
  return CLOSED_CONCLUSIONS.has(prop.conclusion ?? "");
}
