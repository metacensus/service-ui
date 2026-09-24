import type {
  ReviewTaskDetail,
  ReviewTaskHeader,
  ReviewTaskQuestion,
  ReviewTasksDocument,
} from "../data/reviewIndex";

export type TaskRowHeader = ReviewTaskHeader & {
  /** Rows of this task under the header. */
  rows: number;
};

export type TaskQuestionSection = {
  header: TaskRowHeader | null;
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
    const last = sections[sections.length - 1];
  });
}

export function questionRowHeaders(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail,
  question: ReviewTaskQuestion
): { header: TaskRowHeader | null; rows: number }[] | null {
    : null;
}


export const questionRowCount = (task: ReviewTaskDetail, questionIndex: number) =>

export type QuestionDetail = {
  value: unknown;
  derivation: string;
  reasoning: string;
};

export function questionDetail(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail,
  questionIndex: number
): QuestionDetail | null {
  if (!first) return null;
  return {
    value: first.value,
  };
}

export function taskFirstQuote(
  doc: ReviewTasksDocument,
  task: ReviewTaskDetail
  const first = task.citations[0];
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
  const sources = questionDetail(doc, task, questionIndex)?.sources ?? [];
  const shown = taskFirstQuote(doc, task);
  return (shown && sources.find((s) => sameQuote(s, shown))) ?? sources[0] ?? shown;
}

export type TaskHistoryEntry = {
  action: StoredReviewAction["action"];
  reviewedBy: string;
  reviewedAt: string;
  rowEntries: number;
};

export function taskDecisionHistory(
  actions: readonly StoredReviewAction[],
  history: readonly StoredReviewAction[],
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
  return [...byDecision.values()].sort((a, b) =>
    b.reviewedAt < a.reviewedAt ? -1 : b.reviewedAt > a.reviewedAt ? 1 : 0
  );
}

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
): RowReviewState[] {
}
