import type { StoredReviewAction, UnitMember } from "../types";
import {
  REVIEW_TASK_KINDS,
  REVIEW_TASK_LEVELS,
  type ReviewIndex,
  type ReviewTaskKind,
  type ReviewTaskLevel,
} from "../data/reviewIndex";
import { resolveReview, type ReviewSeed } from "./rowStatus";
import { REVIEW_TASK_KIND_HEADINGS, shortPaperId } from "./unitMeta";
import {
  clearedMembersFor,
  computeUnitProgress,
  type DecisionUnit,
  type UnitProgress,
} from "./unitProgress";

export type ReviewTask = {
  id: string;
  paperId: string;
  paperLabel: string;
  kind: ReviewTaskKind;
  level: ReviewTaskLevel;
  title: string;
  sourceLine: string;
  fieldCount: number;
  questionCount: number;
  unit: DecisionUnit;
};

const KIND_RANK = new Map(REVIEW_TASK_KINDS.map((kind, i) => [kind, i]));
const LEVEL_RANK = new Map(REVIEW_TASK_LEVELS.map((level, i) => [level, i]));

/** The builder orders each paper this way; this orders across papers. */
function compareReviewTasks(a: ReviewTask, b: ReviewTask): number {
  return (
    KIND_RANK.get(a.kind)! - KIND_RANK.get(b.kind)! ||
    LEVEL_RANK.get(a.level)! - LEVEL_RANK.get(b.level)! ||
    b.questionCount - a.questionCount ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export function reviewTasksFromIndex(index: ReviewIndex): ReviewTask[] {
  const tasks: ReviewTask[] = [];
  for (const paper of index.papers) {
    const paperLabel = shortPaperId(paper.paper_id);
    for (const t of paper.task_list) {
      const members: UnitMember[] = t.members.map(([row_index, fi]) => ({
        row_index,
        field: paper.fields[fi],
      }));
      tasks.push({
        id: t.id,
        paperId: paper.paper_id,
        paperLabel,
        kind: t.kind,
        level: t.certainty,
        title: t.title,
        sourceLine: t.source_line,
        fieldCount: new Set(t.members.map(([, fi]) => fi)).size,
        questionCount: t.question_count,
        unit: { id: t.id, paper_id: paper.paper_id, members, member_count: members.length },
      });
    }
  }
  return tasks.sort(compareReviewTasks);
}

// ---- scope -----------------------------------------------------------------

export type ReviewScope = {
  paperIds: string[];
  emptyWorkingSet: boolean;
};

export function resolveReviewScope(
  index: ReviewIndex,
  useWorkingSet: boolean,
  active: ReadonlySet<string> | null
): ReviewScope {
  const all = index.papers.map((paper) => paper.paper_id);
  if (!useWorkingSet) {
    return { paperIds: all, emptyWorkingSet: false };
  }
  if (!active) {
    throw new Error(
      "Review scope needs the working set: it is not loaded, and Review never falls back to all papers."
    );
  }
  return {
    paperIds: all.filter((paperId) => active.has(paperId)),
    emptyWorkingSet: active.size === 0,
  };
}

// ---- progress, filters, sections, queue ------------------------------------

export type ReviewTaskRow = {
  task: ReviewTask;
  progress: UnitProgress;
};

export function reviewTaskRows(
  tasks: readonly ReviewTask[],
  scope: ReviewScope,
  actions: StoredReviewAction[],
  seed?: ReviewSeed | null
): ReviewTaskRow[] {
  const inScope = new Set(scope.paperIds);
  const cleared = clearedMembersFor(actions, seed);
  return tasks
    .filter((task) => inScope.has(task.paperId))
    .map((task) => ({ task, progress: computeUnitProgress(task.unit, cleared) }));
}

export type ReviewLandingStatusFilter = "all" | "open" | "decided";

export const REVIEW_LANDING_ALL = "all";

export type ReviewTaskFilters = {
  /** A paper id, or "all". */
  paperId: string;
  status: ReviewLandingStatusFilter;
};

export const REVIEW_TASK_DEFAULT_FILTERS: ReviewTaskFilters = {
  paperId: REVIEW_LANDING_ALL,
  status: REVIEW_LANDING_ALL,
};

export function filterReviewTaskRows(
  rows: readonly ReviewTaskRow[],
  filters: ReviewTaskFilters
): ReviewTaskRow[] {
  return rows.filter(
    (row) =>
      (filters.paperId === REVIEW_LANDING_ALL || row.task.paperId === filters.paperId) &&
      !(filters.status === "open" && row.progress.cleared) &&
      !(filters.status === "decided" && !row.progress.cleared)
  );
}

export type ReviewKindSection = {
  kind: ReviewTaskKind;
  heading: string;
  decided: number;
  total: number;
  ambiguous: ReviewTaskRow[];
  confident: ReviewTaskRow[];
};

export function reviewKindSections(
  rows: readonly ReviewTaskRow[],
  includeNonAmbiguous: boolean
): ReviewKindSection[] {
  return REVIEW_TASK_KINDS.map((kind) => {
    const ofKind = rows.filter((row) => row.task.kind === kind);
    const ambiguous = ofKind.filter((row) => row.task.level === "ambiguous");
    const confident = ofKind.filter((row) => row.task.level === "clean");
    const counted = includeNonAmbiguous ? ofKind : ambiguous;
    return {
      kind,
      heading: REVIEW_TASK_KIND_HEADINGS[kind],
      decided: counted.filter((row) => row.progress.cleared).length,
      total: counted.length,
      ambiguous,
      confident,
    };
  });
}

/** No wrap-around; with `afterTaskId`, the walk starts after it even when it is not queued. */
export function nextUndecidedTask(
  rows: readonly ReviewTaskRow[],
  includeNonAmbiguous: boolean,
  afterTaskId?: string | null
): ReviewTaskRow | null {
  const start =
    afterTaskId == null
      ? 0
      : rows.findIndex((row) => row.task.id === afterTaskId) + 1;
  return (
    rows
      .slice(start)
      .find(
        (row) =>
          !row.progress.cleared && (includeNonAmbiguous || row.task.level === "ambiguous")
      ) ?? null
  );
}

// ---- the progress panel ----------------------------------------------------

export type ReviewPanelStats = {
  includeNonAmbiguous: boolean;
  made: number;
  total: number;
  remaining: number;
  allDecided: boolean;
  byKind: Record<ReviewTaskKind, { made: number; total: number }>;
};

export function computeReviewPanelStats(
  rows: readonly ReviewTaskRow[],
  scope: ReviewScope,
  includeNonAmbiguous: boolean
): ReviewPanelStats {
  const byKind = Object.fromEntries(
    REVIEW_TASK_KINDS.map((kind) => [kind, { made: 0, total: 0 }])
  ) as Record<ReviewTaskKind, { made: number; total: number }>;
  let made = 0;
  let total = 0;
  for (const row of rows) {
    const { task } = row;
    if (!includeNonAmbiguous && task.level !== "ambiguous") continue;
    total += 1;
    byKind[task.kind].total += 1;
    if (row.progress.cleared) {
      made += 1;
      byKind[task.kind].made += 1;
    }
  }
  return {
    includeNonAmbiguous,
    made,
    total,
    remaining: total - made,
    allDecided: scope.paperIds.length > 0 && made === total,
    byKind,
  };
}

// ---- decided history -------------------------------------------------------

export type DecidedTaskEntry = {
  row: ReviewTaskRow;
  action: StoredReviewAction["action"];
  /** Decided by the simulated seed alone, with no real action. */
  seeded?: true;
};

export function decidedTaskHistory(
  rows: readonly ReviewTaskRow[],
  actions: readonly StoredReviewAction[],
  seed?: ReviewSeed | null
): DecidedTaskEntry[] {
  return rows
    .filter((row) => row.progress.cleared)
    .map((row) => {
      let last: StoredReviewAction | null = null;
      for (const m of row.task.unit.members) {
        const a = resolveReview(actions, row.task.paperId, m.row_index, m.field, seed).action;
        if (a && (!last || a.id > last.id)) last = a;
      }
      return last
        ? { row, action: last.action }
        : { row, action: seed?.action ?? "approve", seeded: true as const };
    });
}

// ---- the landing, assembled ------------------------------------------------

export type ReviewLanding = {
  scope: ReviewScope;
  rows: ReviewTaskRow[];
  sections: ReviewKindSection[];
  panel: ReviewPanelStats;
  next: ReviewTaskRow | null;
  paperOptions: { value: string; label: string }[];
};

export function buildReviewLanding(input: {
  tasks: readonly ReviewTask[];
  scope: ReviewScope;
  actions: StoredReviewAction[];
  filters: ReviewTaskFilters;
  includeNonAmbiguous: boolean;
  /** The seed baseline; none by default. */
  seed?: ReviewSeed | null;
}): ReviewLanding {
  const rows = reviewTaskRows(input.tasks, input.scope, input.actions, input.seed);
  const paperOptions = input.scope.paperIds.map((paperId) => ({
    value: paperId,
    label: shortPaperId(paperId),
  }));
  paperOptions.sort((a, b) => a.label.localeCompare(b.label) || (a.value < b.value ? -1 : 1));
  return {
    scope: input.scope,
    rows,
    sections: reviewKindSections(
      filterReviewTaskRows(rows, input.filters),
      input.includeNonAmbiguous
    ),
    panel: computeReviewPanelStats(rows, input.scope, input.includeNonAmbiguous),
    next: nextUndecidedTask(rows, input.includeNonAmbiguous),
    paperOptions,
  };
}
