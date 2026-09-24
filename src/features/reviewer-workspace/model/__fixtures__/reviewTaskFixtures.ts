// Small review-index and review-tasks fixtures for the landing and decision
// tests. Three papers: P1 has every kind and both levels, P2 one ambiguous and
// one clean task, P3 only a clean task (no ambiguous task).

import type {
  ReviewIndex,
  ReviewIndexTask,
  ReviewTaskDetail,
  ReviewTasksDocument,
} from "../../data/reviewIndex";
import type { ReviewAction, StoredReviewAction } from "../../types";
import type { WorkingSet } from "../../data/workingSet";

export const RUN = "run-fixture";
export const TOPIC = "topc:fixture";

const id = (paper: string, kind: string, n: number) =>
  `src:${paper}:${kind}:tables/table_1.md:${String(n).padStart(10, "0")}`;

function task(
  paper: string,
  kind: ReviewIndexTask["kind"],
  certainty: ReviewIndexTask["certainty"],
  n: number,
  question_count: number,
  members: [number, number][]
): ReviewIndexTask {
  return {
    id: id(paper, kind, n),
    kind,
    certainty,
    title: `${paper} ${kind} ${certainty} ${n}`,
    source_line: "Table 1 · page 3",
    question_count,
    members,
  };
}


/** Display order across papers. */
export const DISPLAY_ORDER = [T1, T2, T3, U1, U2, T4, V1].map((t) => t.id);

export function fixtureIndex(): ReviewIndex {
  const p1 = [T1, T2, T3, T4];
  const p2 = [U1, U2];
  const p3 = [V1];
  return JSON.parse(
    JSON.stringify({
      run_id: RUN,
      papers: [
      ],
    })
  ) as ReviewIndex;
}

/** P1's review-tasks file. T1's question "a" holds two values whose rows
 *  ([1], [0]) merge to [0, 1]; row 4 has no recorded identity. */
export function fixtureP1Tasks(): ReviewTasksDocument {
  const value = (field: string, rows: number[]) => ({
    field,
    value: 1,
    extraction_certainty: "ambiguous",
    sources: [0],
    reasoning: 0,
    rows,
  });
  const detail = (
    t: ReviewIndexTask,
  ): ReviewTaskDetail => ({
    id: t.id,
    kind: t.kind,
    certainty: t.certainty,
    title: t.title,
    source_line: t.source_line,
    headers: [[0, 1]],
    questions,
    citations: [
      {
        location: "tables/table_1.md",
        label: "Table 1",
        quote: "q",
        pages: [3],
        resolutions: { exact: 1 },
        source: 0,
      },
    ],
  });
  return {
    paper_id: "P1",
    study_wide: { context: [], full: [] },
    headers: [{ text: "Row context", detail: "", full: "", state: "row" }],
    rows: {
      "0": { key: "row-0" },
      "1": { key: "row-1" },
      "2": { key: "row-2" },
      "3": { key: "row-3" },
      "4": null,
    },
    evidence: {
      sources: [{ quote: "q", location: "tables/table_1.md", page: 3 }],
      reasoning: ["r"],
      derivation: [],
    },
    tasks: [
    ],
  };
}

export function workingSetOf(active: string[], all = ["P1", "P2", "P3"]): WorkingSet {
  return {
    topic_id: TOPIC,
    run_id: RUN,
    revision: 0,
    members: all.map((paper_id) => ({
      paper_id,
      membership: active.includes(paper_id) ? "active" : "excluded",
      decision_origin: active.includes(paper_id) ? "default" : "manual",
      reason: active.includes(paper_id) ? null : "Out of scope",
      actor: null,
      changed_at: null,
    })),
    history: [],
  };
}

/** A stub fetch answering every GET with `body`; records the URLs. */
export function stubFetch(body: unknown, status = 200) {
  const urls: string[] = [];
  const fetchFn = (async (input: RequestInfo | URL) => {
    urls.push(String(input));
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      json: async () => body,
    } as Response;
  }) as typeof fetch;
  return { urls, fetchFn };
}

let nextActionId = 1;

/** Stored actions as `bulkUpsertActions` keeps them: the latest per member. */
export function stored(actions: ReviewAction[], prior: StoredReviewAction[] = []): StoredReviewAction[] {
  const key = (a: ReviewAction) => `${a.paper_id}::${a.row_index}::${a.field}`;
  const incoming = new Set(actions.map(key));
  return [
    ...prior.filter((a) => !incoming.has(key(a))),
    ...actions.map((a) => ({ ...a, id: nextActionId++, created_at: a.reviewed_at })),
  ];
}
