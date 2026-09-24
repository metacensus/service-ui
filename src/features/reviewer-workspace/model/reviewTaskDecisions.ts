import type { ReviewAction, StoredReviewAction } from "../types";
import type { ReviewTaskDetail, ReviewTasksDocument } from "../data/reviewIndex";
import { buildActions, type TaskDecision } from "./actionBuilders";
import { isDecided, taskQuestionMembers, taskQuestionStates } from "./reviewTaskPage";
import type { ReviewSeed } from "./rowStatus";

/** `"all"` is whole-task approval. */
export function buildTaskDecisionActions(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail,
  questionIndexes: readonly number[] | "all",
  decision: TaskDecision,
  runId: string,
  reviewerName: string
): ReviewAction[] {
  const indexes =
    questionIndexes === "all" ? task.questions.map((_, i) => i) : questionIndexes;
  const byQuestion = taskQuestionMembers(task);
  const members = [...new Set(indexes)]
    .sort((a, b) => a - b)
    .flatMap((i) => byQuestion[i] ?? []);
  return buildActions(
    { id: task.id, paper_id: doc.paper_id, members, member_count: members.length },
    runId,
    reviewerName,
    decision,
    doc.rows
  );
}

/** `actions` may predate the save. */
export function shouldAdvanceAfterDecision(
  paperId: string,
  task: ReviewTaskDetail,
  actions: StoredReviewAction[],
  decision: TaskDecision,
  decidedQuestions: readonly number[] | "all",
  seed?: ReviewSeed | null
): boolean {
  if (decision.action === "flag") return false;
  if (decidedQuestions === "all") return true;
  const done = new Set(decidedQuestions);
  return taskQuestionStates(paperId, task, actions, seed).every(
    (state, i) => done.has(i) || isDecided(state)
  );
}
