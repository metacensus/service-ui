import type {
  ReviewSource,
  ReviewTaskDetail,
  ReviewTaskHeader,
  ReviewTaskQuestion,
  ReviewTasksDocument,
} from "../data/reviewIndex";
import type { ProvSource, StoredReviewAction, UnitMember } from "../types";
import { isDecided, resolveReview, type ReviewSeed, type RowReviewState } from "./rowStatus";

export { isDecided };

export type TaskRowHeader = ReviewTaskHeader & {
  /** Rows of this task under the header. */
  rows: number;
};

export type TaskQuestionSection = {
  header: TaskRowHeader | null;
  questionIndexes: number[];
};

function taskHeader(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail,
  i: number
): TaskRowHeader | null {
  const entry = task.headers[i];
  const header = entry ? doc.headers[entry[0]] : undefined;
  return header ? { ...header, rows: entry[1] } : null;
}

export function taskQuestionSections(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail
): TaskQuestionSection[] {
  const several = task.headers.findIndex(
    ([h]) => doc.headers[h]?.state === "several"
  );
  const sections: (TaskQuestionSection & { key: number })[] = [];
  task.questions.forEach((question, i) => {
    const key = question.spans ? several : (question.header ?? -1);
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.questionIndexes.push(i);
    else sections.push({ key, header: key >= 0 ? taskHeader(doc, task, key) : null, questionIndexes: [i] });
  });
  return sections.map(({ header, questionIndexes }) => ({ header, questionIndexes }));
}

export function questionRowHeaders(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail,
  question: ReviewTaskQuestion
): { header: TaskRowHeader | null; rows: number }[] | null {
  return question.spans
    ? question.spans.map(([h, rows]) => ({ header: taskHeader(doc, task, h), rows }))
    : null;
}

/** "n events = 2" */
export const questionLabel = (question: ReviewTaskQuestion) =>
  `${question.field.replace(/_/g, " ")} = ${question.value_text}`;

export const questionRowCount = (task: ReviewTaskDetail, questionIndex: number) =>
  new Set(task.questions[questionIndex].values.flatMap((v) => v.rows)).size;

export const taskQuestionMembers = (task: ReviewTaskDetail): UnitMember[][] =>
  task.questions.map((question) =>
    question.values
      .flatMap((value) => value.rows)
      .sort((a, b) => a - b)
      .map((row_index) => ({ row_index, field: question.field }))
  );

export type QuestionDetail = {
  value: unknown;
  sources: ReviewSource[];
  derivation: string;
  reasoning: string;
};

export function questionDetail(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail,
  questionIndex: number
): QuestionDetail | null {
  const first = task.questions[questionIndex]?.values[0];
  if (!first) return null;
  return {
    value: first.value,
    sources: first.sources.map((i) => doc.evidence.sources[i]),
    derivation: first.derivation != null ? doc.evidence.derivation[first.derivation] : "",
    reasoning: first.reasoning != null ? doc.evidence.reasoning[first.reasoning] : "",
  };
}

export function taskFirstQuote(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail
): ReviewSource | null {
  const first = task.citations[0];
  return first ? doc.evidence.sources[first.source] : null;
}

const sameQuote = (a: ProvSource, b: ProvSource) =>
  a.location === b.location &&
  a.quote.replace(/\s+/g, " ").trim() === b.quote.replace(/\s+/g, " ").trim();

/** A chosen question's own citation of the quote being shown (its page and
 *  highlight), else its first source. */
export function questionEvidence(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail,
  questionIndex: number
): ReviewSource | null {
  const sources = questionDetail(doc, task, questionIndex)?.sources ?? [];
  const shown = taskFirstQuote(doc, task);
  return (shown && sources.find((s) => sameQuote(s, shown))) ?? sources[0] ?? shown;
}

export type TaskHistoryEntry = {
  action: StoredReviewAction["action"];
  reviewedBy: string;
  reviewedAt: string;
  rowEntries: number;
  /** The simulated seed baseline, not a stored action. */
  seeded?: true;
};

/** Newest first; one entry per action, reviewer and time. With `seeded`, one
 *  more entry for the task's members still resolved by the seed. */
export function taskDecisionHistory(
  actions: readonly StoredReviewAction[],
  history: readonly StoredReviewAction[],
  taskId: string,
  seeded?: { seed: ReviewSeed | null; paperId: string; members: readonly UnitMember[] }
): TaskHistoryEntry[] {
  const seen = new Set<number>();
  const byDecision = new Map<string, TaskHistoryEntry>();
  for (const a of [...history, ...actions]) {
    if (a.via_unit !== taskId || seen.has(a.id)) continue;
    seen.add(a.id);
    const key = `${a.action}|${a.reviewed_by}|${a.reviewed_at}`;
    const entry = byDecision.get(key) ?? {
      action: a.action,
      reviewedBy: a.reviewed_by,
      reviewedAt: a.reviewed_at,
      rowEntries: 0,
    };
    entry.rowEntries += 1;
    byDecision.set(key, entry);
  }
  if (seeded?.seed) {
    const { seed, paperId, members } = seeded;
    const rowEntries = members.filter(
      (m) => resolveReview(actions, paperId, m.row_index, m.field, seed).seeded
    ).length;
    if (rowEntries > 0) {
      byDecision.set("seed", {
        action: seed.action,
        reviewedBy: seed.reviewer,
        reviewedAt: seed.reviewedAt,
        rowEntries,
        seeded: true,
      });
    }
  }
  return [...byDecision.values()].sort((a, b) =>
    b.reviewedAt < a.reviewedAt ? -1 : b.reviewedAt > a.reviewedAt ? 1 : 0
  );
}

export const openQuestions = (states: readonly RowReviewState[]) =>
  states.flatMap((state, i) => (isDecided(state) ? [] : [i]));

export const combinedState = (states: readonly RowReviewState[]): RowReviewState =>
  states.length > 0 && states.every(isDecided)
    ? states.includes("corrected")
      ? "corrected"
      : "approved"
    : states.includes("flagged")
      ? "flagged"
      : "open";

export function taskQuestionStates(
  paperId: string,
  task: ReviewTaskDetail,
  actions: readonly StoredReviewAction[],
  seed?: ReviewSeed | null
): RowReviewState[] {
  return taskQuestionMembers(task).map((members) =>
    combinedState(
      members.map((m) => resolveReview(actions, paperId, m.row_index, m.field, seed).state)
    )
  );
}
