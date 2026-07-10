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
  }
}

  return `${paperId}::${rowIndex}::${field}`;
}

      if (action.row_index == null || action.field == null) continue;
  paperId: string,
  rowIndex: number,
export function latestActionFor(
  actions: StoredReviewAction[],
  paperId: string,
  rowIndex: number,
  field: string
): StoredReviewAction | null {
}

export function reviewStateFor(
  actions: StoredReviewAction[],
  paperId: string,
  rowIndex: number,
): RowReviewState {
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
