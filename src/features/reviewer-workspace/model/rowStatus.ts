import type { ReviewComment, StoredReviewAction } from "../types";

export type RowReviewState = "approved" | "corrected" | "flagged" | "open";

/** Shared chip styling for a value's review state. */
export function stateChipClass(state: RowReviewState): string {
  switch (state) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "corrected":
      return "bg-blue-100 text-blue-800";
    case "flagged":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-secondary";
  }
}

/** A static baseline of whole papers approved by a simulated reviewer
 *  (fetched from the demo by data/reviewSeed.ts). Model functions take it explicitly; none reads it. */
export type ReviewSeed = {
  readonly runId: string;
  readonly reviewer: string;
  readonly action: "approve";
  readonly reviewedAt: string;
  readonly paperIds: readonly string[];
};

/** The seed applies only to its own run. */
export function reviewSeedForRun(
  seed: ReviewSeed | null | undefined,
  runId: string | null
): ReviewSeed | null {
  return seed && runId !== null && seed.runId === runId ? seed : null;
}

export function memberKey(paperId: string, rowIndex: number, field: string): string {
  return `${paperId}::${rowIndex}::${field}`;
}

const latestByActions = new WeakMap<
  readonly StoredReviewAction[],
  Map<string, StoredReviewAction>
>();

/** Latest real action (not adjudicate_gold) per member, by id; built once per `actions` array. */
export function latestReviewActions(
  actions: readonly StoredReviewAction[]
): ReadonlyMap<string, StoredReviewAction> {
  let latest = latestByActions.get(actions);
  if (!latest) {
    latest = new Map();
    for (const action of actions) {
      if (action.action === "adjudicate_gold") continue;
      if (action.row_index == null || action.field == null) continue;
      const key = memberKey(action.paper_id, action.row_index, action.field);
      const prev = latest.get(key);
      if (!prev || action.id > prev.id) latest.set(key, action);
    }
    latestByActions.set(actions, latest);
  }
  return latest;
}

const seedPapers = new WeakMap<ReviewSeed, ReadonlySet<string>>();

function isSeededPaper(seed: ReviewSeed, paperId: string): boolean {
  let papers = seedPapers.get(seed);
  if (!papers) {
    papers = new Set(seed.paperIds);
    seedPapers.set(seed, papers);
  }
  return papers.has(paperId);
}

export type ResolvedReview = {
  state: RowReviewState;
  /** The real action that decides the state; null when seeded or open. */
  action: StoredReviewAction | null;
  seeded: boolean;
};

const OPEN: ResolvedReview = Object.freeze({ state: "open", action: null, seeded: false });
const SEEDED: ResolvedReview = Object.freeze({ state: "approved", action: null, seeded: true });

/** The one review-state rule: the latest real action, else the seed's approval
 *  when the paper is in the seed, else open. Real decisions always win. */
export function resolveReview(
  actions: readonly StoredReviewAction[],
  paperId: string,
  rowIndex: number,
  field: string,
  seed?: ReviewSeed | null
): ResolvedReview {
  const action = latestReviewActions(actions).get(memberKey(paperId, rowIndex, field));
  if (action) {
    const state: RowReviewState =
      action.action === "approve"
        ? "approved"
        : action.action === "correct"
          ? "corrected"
          : action.action === "flag"
            ? "flagged"
            : "open";
    return { state, action, seeded: false };
  }
  return seed && isSeededPaper(seed, paperId) ? SEEDED : OPEN;
}

/** Approved or corrected; a flag stays open. */
export const isDecided = (state: RowReviewState) => state === "approved" || state === "corrected";

export function latestActionFor(
  actions: StoredReviewAction[],
  paperId: string,
  rowIndex: number,
  field: string
): StoredReviewAction | null {
  return resolveReview(actions, paperId, rowIndex, field).action;
}

export function reviewStateFor(
  actions: StoredReviewAction[],
  paperId: string,
  rowIndex: number,
  field: string,
  seed?: ReviewSeed | null
): RowReviewState {
  return resolveReview(actions, paperId, rowIndex, field, seed).state;
}

export function commentsFor(
  comments: ReviewComment[],
  paperId: string,
  rowIndex: number | null,
  field: string | null
): ReviewComment[] {
  return comments.filter(
    (comment) =>
      comment.paper_id === paperId &&
      (comment.row_index ?? null) === (rowIndex ?? null) &&
      (comment.field ?? null) === (field ?? null)
  );
}
