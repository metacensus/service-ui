import type { Identity, ProvSource } from "../types";

export type ReviewTaskKind = "inferred" | "derived" | "verbatim";
export type ReviewTaskLevel = "ambiguous" | "clean";

export const REVIEW_TASK_KINDS: readonly ReviewTaskKind[] = [
  "inferred",
  "derived",
  "verbatim",
];
export const REVIEW_TASK_LEVELS: readonly ReviewTaskLevel[] = [
  "ambiguous",
  "clean",
];

export type ReviewIndexTask = {
  id: string;
  kind: ReviewTaskKind;
  certainty: ReviewTaskLevel;
  title: string;
  source_line: string;
  question_count: number;
  /** Question by question, rows ascending. */
  members: [rowIndex: number, fieldIndex: number][];
};

export type ReviewIndexPaper = {
  paper_id: string;
  fields: string[];
  task_list: ReviewIndexTask[];
};

export type ReviewIndex = {
  run_id: string;
  papers: ReviewIndexPaper[];
};

export type ReviewTaskHeaderState =
  | "row"
  | "study_wide"
  | "none"
  | "study_wide_only"
  | "several";

export type ReviewTaskHeader = {
  text: string;
  detail: string;
  full: string;
  state: ReviewTaskHeaderState;
};

export type ReviewTaskQuestion = {
  field: string;
  value_text: string;
  basis?: string;
  /** Index into the task's `headers`. */
  header?: number;
  /** [header index, rows under it] for a question "In several rows". */
  spans?: [header: number, rows: number][];
  values: ReviewTaskValue[];
};

export type ReviewTaskCitation = {
  location: string;
  label: string;
  quote: string;
  pages: number[];
  resolutions: Record<string, number>;
  /** Index into `evidence.sources`: one representative source. */
  source: number;
};

export type ReviewTaskValue = {
  field: string;
  value: unknown;
  extraction_certainty?: string;
  /** Indices into `evidence.sources`. */
  sources: number[];
  /** Index into `evidence.reasoning`. */
  reasoning?: number;
  /** Index into `evidence.derivation`. */
  derivation?: number;
  rows: number[];
};

export type ReviewTaskDetail = {
  id: string;
  kind: ReviewTaskKind;
  certainty: ReviewTaskLevel;
  title: string;
  source_line: string;
  headers: [header: number, rows: number][];
  shared_context?: string;
  questions: ReviewTaskQuestion[];
  citations: ReviewTaskCitation[];
};

export type ReviewSource = ProvSource & { pdf?: string };

export type ReviewTasksDocument = {
  paper_id: string;
  study_wide: { context: string[]; full: string[] };
  headers: ReviewTaskHeader[];
  /** Row identity by row index (as a string key): `expect_identity`. */
  rows: Record<string, Identity | null>;
  evidence: {
    sources: ReviewSource[];
    reasoning: string[];
    derivation: string[];
  };
  tasks: ReviewTaskDetail[];
};

export class ReviewIndexNotFoundError extends Error {
  status: number;
  url: string;

  constructor(url: string, status: number, statusText: string) {
    super(`Review index file not found: ${status} ${statusText} (${url})`);
    this.name = "ReviewIndexNotFoundError";
    this.status = status;
    this.url = url;
  }
}

function reviewIndexBaseUrl(runId: string): string {
  const base =
    (import.meta.env.VITE_REVIEWER_INDEX_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
    "/reviewer-snapshots/index";
  return `${base}/${encodeURIComponent(runId)}`;
}

export function reviewIndexUrl(runId: string): string {
  return `${reviewIndexBaseUrl(runId)}/review-index.json`;
}

export function reviewTasksUrl(runId: string, paperId: string): string {
  return `${reviewIndexBaseUrl(runId)}/review-tasks/${encodeURIComponent(paperId)}.json`;
}

const KINDS: ReadonlySet<string> = new Set(REVIEW_TASK_KINDS);
const LEVELS: ReadonlySet<string> = new Set(REVIEW_TASK_LEVELS);
const HEADER_STATES: ReadonlySet<string> = new Set([
  "row",
  "study_wide",
  "none",
  "study_wide_only",
  "several",
]);

function invalid(where: string, what: string): never {
  throw new Error(`Invalid review index at ${where}: ${what}`);
}

const isIndex = (x: unknown, length: number) =>
  Number.isInteger(x) && (x as number) >= 0 && (x as number) < length;
const isNatural = (x: unknown) => Number.isInteger(x) && (x as number) >= 0;

function assertTaskHead(
  task: Record<string, unknown>,
  where: string
): asserts task is Record<string, unknown> & {
  id: string;
  kind: ReviewTaskKind;
  certainty: ReviewTaskLevel;
} {
  if (typeof task.id !== "string") invalid(where, "id must be a string");
  if (typeof task.kind !== "string" || !KINDS.has(task.kind)) {
    invalid(where, `unsupported kind ${JSON.stringify(task.kind)}`);
  }
  if (typeof task.certainty !== "string" || !LEVELS.has(task.certainty)) {
    invalid(where, `unsupported certainty ${JSON.stringify(task.certainty)}`);
  }
  if (typeof task.title !== "string") invalid(where, "title must be a string");
  if (typeof task.source_line !== "string") {
    invalid(where, "source_line must be a string");
  }
}

export function validateReviewIndex(value: unknown, runId: string): ReviewIndex {
  if (!value || typeof value !== "object") invalid(runId, "must be an object");
  const body = value as Record<string, unknown>;
  if (body.run_id !== runId) {
    invalid(runId, `run_id ${JSON.stringify(body.run_id)} is not ${runId}`);
  }
  if (!Array.isArray(body.papers)) invalid(runId, "papers must be an array");
  const seen = new Set<string>();
  for (const paper of body.papers as ReviewIndexPaper[]) {
    if (!paper || typeof paper !== "object" || typeof paper.paper_id !== "string") {
      invalid(runId, "malformed paper");
    }
    const pid = paper.paper_id;
    if (seen.has(pid)) invalid(pid, "duplicate paper");
    seen.add(pid);
    if (!Array.isArray(paper.fields) || !paper.fields.every((f) => typeof f === "string")) {
      invalid(pid, "fields must be an array of strings");
    }
    if (!Array.isArray(paper.task_list)) invalid(pid, "task_list must be an array");
    const nFields = paper.fields.length;
    for (const task of paper.task_list) {
      if (!task || typeof task !== "object") invalid(pid, "malformed task");
      const where = `${pid}:${String(task.id)}`;
      assertTaskHead(task as unknown as Record<string, unknown>, where);
      if (!isNatural(task.question_count)) invalid(where, "question_count must be a count");
      if (!Array.isArray(task.members)) invalid(where, "members must be an array");
      for (const member of task.members) {
        if (
          !Array.isArray(member) ||
          member.length !== 2 ||
          !isNatural(member[0]) ||
          !isIndex(member[1], nFields)
        ) {
          invalid(where, `malformed member ${JSON.stringify(member)}`);
        }
      }
    }
  }
  return value as ReviewIndex;
}

export function validateReviewTasks(
  value: unknown,
  paperId: string
): ReviewTasksDocument {
  if (!value || typeof value !== "object") invalid(paperId, "must be an object");
  const doc = value as Record<string, unknown>;
  if (doc.paper_id !== paperId) {
    invalid(paperId, `paper_id ${JSON.stringify(doc.paper_id)} is not ${paperId}`);
  }
  const studyWide = doc.study_wide as Record<string, unknown> | undefined;
  if (
    !studyWide ||
    !Array.isArray(studyWide.context) ||
    !Array.isArray(studyWide.full)
  ) {
    invalid(paperId, "study_wide must hold context and full arrays");
  }
  if (!Array.isArray(doc.headers)) invalid(paperId, "headers must be an array");
  for (const header of doc.headers as ReviewTaskHeader[]) {
    if (!header || typeof header.text !== "string" || !HEADER_STATES.has(header.state)) {
      invalid(paperId, `malformed header ${JSON.stringify(header)}`);
    }
  }
  if (!doc.rows || typeof doc.rows !== "object" || Array.isArray(doc.rows)) {
    invalid(paperId, "rows must be an object");
  }
  const evidence = doc.evidence as Record<string, unknown> | undefined;
  if (
    !evidence ||
    !Array.isArray(evidence.sources) ||
    !Array.isArray(evidence.reasoning) ||
    !Array.isArray(evidence.derivation)
  ) {
    invalid(paperId, "evidence must hold sources, reasoning and derivation arrays");
  }
  const nHeaders = (doc.headers as unknown[]).length;
  const nSources = (evidence.sources as unknown[]).length;
  const nReasoning = (evidence.reasoning as unknown[]).length;
  const nDerivation = (evidence.derivation as unknown[]).length;
  if (!Array.isArray(doc.tasks)) invalid(paperId, "tasks must be an array");
  for (const task of doc.tasks as ReviewTaskDetail[]) {
    if (!task || typeof task !== "object") invalid(paperId, "malformed task");
    const where = `${paperId}:${String(task.id)}`;
    assertTaskHead(task as unknown as Record<string, unknown>, where);
    if (
      !Array.isArray(task.headers) ||
      !task.headers.every(
        (h) => Array.isArray(h) && isIndex(h[0], nHeaders) && isNatural(h[1])
      )
    ) {
      invalid(where, "headers must be [header index, rows] pairs");
    }
    if (!Array.isArray(task.questions)) invalid(where, "questions must be an array");
    for (const question of task.questions) {
      if (
        !question ||
        typeof question.field !== "string" ||
        typeof question.value_text !== "string" ||
        !Array.isArray(question.values) ||
        question.values.length === 0
      ) {
        invalid(where, "malformed question");
      }
      if (question.header != null && !isIndex(question.header, task.headers.length)) {
        invalid(where, `question header ${JSON.stringify(question.header)} out of range`);
      }
      if (
        question.spans != null &&
        (!Array.isArray(question.spans) ||
          !question.spans.every(
            (s) => Array.isArray(s) && isIndex(s[0], task.headers.length) && isNatural(s[1])
          ))
      ) {
        invalid(where, `question spans ${JSON.stringify(question.spans)} out of range`);
      }
      if (!question.values.every((v) => v?.field === question.field)) {
        invalid(where, `question ${question.field} holds a value of another field`);
      }
      for (const value of question.values) {
        if (
          !Array.isArray(value.rows) ||
          !value.rows.every(isNatural) ||
          !Array.isArray(value.sources) ||
          !value.sources.every((i) => isIndex(i, nSources)) ||
          (value.reasoning != null && !isIndex(value.reasoning, nReasoning)) ||
          (value.derivation != null && !isIndex(value.derivation, nDerivation))
        ) {
          invalid(where, `malformed value of ${value.field}`);
        }
      }
    }
    if (
      !Array.isArray(task.citations) ||
      !task.citations.every((c) => c && isIndex(c.source, nSources))
    ) {
      invalid(where, "malformed citations");
    }
  }
  return value as ReviewTasksDocument;
}

async function fetchJson(url: string, fetchFn: typeof fetch): Promise<unknown> {
  const response = await fetchFn(url);
  if (!response.ok) {
    throw new ReviewIndexNotFoundError(url, response.status, response.statusText);
  }
  return response.json();
}

export async function fetchReviewIndex(
  runId: string,
  fetchFn: typeof fetch = fetch
): Promise<ReviewIndex> {
  return validateReviewIndex(await fetchJson(reviewIndexUrl(runId), fetchFn), runId);
}

export async function fetchReviewTasks(
  runId: string,
  paperId: string,
  fetchFn: typeof fetch = fetch
): Promise<ReviewTasksDocument> {
  return validateReviewTasks(
    await fetchJson(reviewTasksUrl(runId, paperId), fetchFn),
    paperId
  );
}
