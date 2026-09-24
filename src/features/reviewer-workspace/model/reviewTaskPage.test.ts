import { describe, expect, it } from "vitest";
import type { ReviewTaskDetail, ReviewTasksDocument } from "../data/reviewIndex";
import type { ProvSource } from "../types";
import { fixtureP1Tasks, RUN, stored, T3 } from "./__fixtures__/reviewTaskFixtures";
import { buildTaskDecisionActions } from "./reviewTaskDecisions";
import {
  questionDetail,
  questionEvidence,
  questionLabel,
  questionRowCount,
  questionRowHeaders,
  taskDecisionHistory,
  taskFirstQuote,
  taskQuestionSections,
  taskQuestionStates,
} from "./reviewTaskPage";

const source = (quote: string, page: number, location = "sections/a.md"): ProvSource => ({
  quote,
  location,
  page,
  resolution: "exact",
  highlight: [{ page, rects: [{ x: 1, y: 2, w: 3, h: 4 }] }],
});

/** A task with a study-wide question, a question in several rows and two row
 *  headers; `task.headers` lists the paper headers out of order on purpose. */
function sectionedDoc(): { doc: ReviewTasksDocument; task: ReviewTaskDetail } {
  const task: ReviewTaskDetail = {
    id: "src:P9:derived:sections/a.md:0000000001",
    kind: "derived",
    certainty: "ambiguous",
    title: "t",
    source_line: "Section · A · page 2",
    headers: [
      [2, 3],
      [0, 1],
      [1, 2],
      [3, 0],
    ],
    questions: [
      {
        field: "design",
        value_text: "cohort",
        header: 0,
        values: [{ field: "design", value: "cohort", sources: [0], rows: [0, 1, 2] }],
      },
      {
        field: "n_events",
        value_text: "2",
        spans: [[1, 1], [2, 2]],
        values: [
          { field: "n_events", value: 2, sources: [3, 4], reasoning: 0, derivation: 0, rows: [0] },
          { field: "n_events", value: 2, sources: [3], reasoning: 1, rows: [1, 2] },
        ],
      },
      {
        field: "n_total",
        value_text: "111",
        header: 1,
        values: [{ field: "n_total", value: 111, sources: [1], rows: [0] }],
      },
      {
        field: "outcome",
        value_text: "grade 3",
        header: 1,
        values: [{ field: "outcome", value: "grade 3", sources: [1], rows: [0] }],
      },
      {
        field: "n_total",
        value_text: "40",
        header: 2,
        values: [{ field: "n_total", value: 40, sources: [], rows: [1, 2] }],
      },
    ],
    citations: [
      { location: "sections/a.md", label: "A", quote: "first quote", pages: [2], resolutions: { exact: 1 }, source: 1 },
      { location: "sections/b.md", label: "B", quote: "second", pages: [5], resolutions: { page_only: 1 }, source: 2 },
    ],
  };
  const doc: ReviewTasksDocument = {
    paper_id: "P9",
    study_wide: { context: ["Design: cohort"], full: ["Design: cohort"] },
    headers: [
      { text: "Whole cohort · 111 patients", detail: "", full: "", state: "row" },
      { text: "DPYD*2A · carriers", detail: "Measure: OR", full: "Variant: DPYD*2A", state: "row" },
      { text: "Study-wide", detail: "", full: "", state: "study_wide" },
      { text: "In several rows", detail: "", full: "", state: "several" },
    ],
    rows: { "0": { key: "r0" }, "1": { key: "r1" }, "2": { key: "r2" } },
    evidence: {
      sources: [
        source("design quote", 1),
        source("first quote", 2),
        source("second", 5, "sections/b.md"),
        source("first  quote", 3),
        source("other quote", 4),
      ],
      reasoning: ["The count is read from the text.", "Other reasoning."],
      derivation: ["2 of 111"],
    },
    tasks: [],
  };
  doc.tasks.push(task);
  return { doc, task };
}

describe("questions under their row headers", () => {
  it("each question sits under its row's header, or under 'In several rows', in file order", () => {
    const { doc, task } = sectionedDoc();
    const sections = taskQuestionSections(doc, task);
    expect(sections.map((s) => [s.header?.text, s.header?.rows, s.questionIndexes])).toEqual([
      ["Study-wide", 3, [0]],
      ["In several rows", 0, [1]],
      ["Whole cohort · 111 patients", 1, [2, 3]],
      ["DPYD*2A · carriers", 2, [4]],
    ]);
  });

  it("a question in several rows lists each row's header with its rows", () => {
    const { doc, task } = sectionedDoc();
    expect(questionRowHeaders(doc, task, task.questions[1])?.map((h) => [h.header?.text, h.rows])).toEqual([
      ["Whole cohort · 111 patients", 1],
      ["DPYD*2A · carriers", 2],
    ]);
    expect(questionRowHeaders(doc, task, task.questions[2])).toBeNull();
    expect(questionRowCount(task, 1)).toBe(3);
    expect(questionRowCount(task, 4)).toBe(2);
  });

  it("each row in the list reads 'field = value', the field's underscores as spaces", () => {
    const { task } = sectionedDoc();
    const labels = task.questions.map(questionLabel);
    expect(labels[1]).toBe("n events = 2");
    expect(labels.some((l) => l.includes("_"))).toBe(false);
    expect(labels.some((l) => l.startsWith("Should "))).toBe(false);
    expect(questionLabel({ field: "n_total", value_text: "shortened…", values: [] })).toBe("n total = shortened…");
  });

  it("a task without headers keeps its questions in one unheaded section", () => {
    const doc = fixtureP1Tasks();
    const t3 = doc.tasks.find((t) => t.id === T3.id)!;
    const bare = { ...t3, headers: [] as [number, number][], questions: t3.questions.map((q) => ({ ...q, header: undefined })) };
    expect(taskQuestionSections(doc, bare)).toEqual([{ header: null, questionIndexes: [0] }]);
  });
});

describe("a question's detail and evidence", () => {
  it("the detail is the first value's whole sources, derivation and reasoning", () => {
    const { doc, task } = sectionedDoc();
    const detail = questionDetail(doc, task, 1)!;
    expect(detail.value).toBe(2);
    expect(detail.sources).toEqual([doc.evidence.sources[3], doc.evidence.sources[4]]);
    expect(detail.derivation).toBe("2 of 111");
    expect(detail.reasoning).toBe("The count is read from the text.");
    expect(questionDetail(doc, task, 0)).toMatchObject({ derivation: "", reasoning: "" });
    expect(questionDetail(doc, task, 9)).toBeNull();
  });

  it("the pane opens on the task's first quote; a chosen question shows its own citation of it", () => {
    const { doc, task } = sectionedDoc();
    expect(taskFirstQuote(doc, task)).toBe(doc.evidence.sources[1]);
    // Question 1 cites the first quote on page 3 (whitespace differs): that source, highlight kept.
    expect(questionEvidence(doc, task, 1)).toBe(doc.evidence.sources[3]);
    // Question 0 does not cite the first quote: its own first source.
    expect(questionEvidence(doc, task, 0)).toBe(doc.evidence.sources[0]);
    // Question 4 has no source: the task's first quote.
    expect(questionEvidence(doc, task, 4)).toBe(doc.evidence.sources[1]);
  });
});

describe("the task's decision history", () => {
  it("one line per recorded decision, newest first, with the row entries it wrote", () => {
    const doc = fixtureP1Tasks();
    const t1 = doc.tasks[0];
    const flag = buildTaskDecisionActions(doc, t1, [0], { action: "flag", reason: "check" }, RUN, "Ann").map((a) => ({
      ...a,
      reviewed_at: "2026-09-23T10:00:00.000Z",
    }));
    const approve = buildTaskDecisionActions(doc, t1, "all", { action: "approve" }, RUN, "Bo").map((a) => ({
      ...a,
      reviewed_at: "2026-09-23T11:00:00.000Z",
    }));
    const first = stored(flag);
    const current = stored(approve, first);
    const history = first; // the flags the approvals replaced
    const other = stored(
      buildTaskDecisionActions(doc, doc.tasks[2], "all", { action: "approve" }, RUN, "Bo"),
      current
    );
    expect(taskDecisionHistory(other, history, t1.id)).toEqual([
      { action: "approve", reviewedBy: "Bo", reviewedAt: "2026-09-23T11:00:00.000Z", rowEntries: 3 },
      { action: "flag", reviewedBy: "Ann", reviewedAt: "2026-09-23T10:00:00.000Z", rowEntries: 2 },
    ]);
    expect(taskDecisionHistory([], [], t1.id)).toEqual([]);
  });
});

describe("question states", () => {
  it("decided questions read approved or corrected; a flag reads flagged and stays open", () => {
    const doc = fixtureP1Tasks();
    const t1 = doc.tasks[0];
    expect(taskQuestionStates("P1", t1, [])).toEqual(["open", "open"]);
    const flagged = stored(buildTaskDecisionActions(doc, t1, [0], { action: "flag" }, RUN, "Ann"));
    expect(taskQuestionStates("P1", t1, flagged)).toEqual(["flagged", "open"]);
    const corrected = stored(
      buildTaskDecisionActions(doc, t1, [1], { action: "correct", corrected: { value: 2 } }, RUN, "Ann"),
      flagged
    );
    expect(taskQuestionStates("P1", t1, corrected)).toEqual(["flagged", "corrected"]);
    const approved = stored(buildTaskDecisionActions(doc, t1, [0], { action: "approve" }, RUN, "Ann"), corrected);
    expect(taskQuestionStates("P1", t1, approved)).toEqual(["approved", "corrected"]);
    // Another paper's actions on the same rows and fields don't count.
    expect(taskQuestionStates("P2", t1, approved)).toEqual(["open", "open"]);
  });
});
