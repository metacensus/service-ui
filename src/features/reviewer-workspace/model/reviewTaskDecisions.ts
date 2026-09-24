import type { ReviewTaskDetail, ReviewTasksDocument } from "../data/reviewIndex";

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
    .sort((a, b) => a - b)
    .flatMap((i) => byQuestion[i] ?? []);
}

export function shouldAdvanceAfterDecision(
  paperId: string,
  task: ReviewTaskDetail,
  actions: StoredReviewAction[],
  decision: TaskDecision,
): boolean {
  if (decision.action === "flag") return false;
  if (decidedQuestions === "all") return true;
  const done = new Set(decidedQuestions);
  );
}
