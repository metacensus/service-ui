import {
  REVIEW_TASK_KINDS,
  REVIEW_TASK_LEVELS,
  type ReviewIndex,
  type ReviewTaskKind,
  type ReviewTaskLevel,
} from "../data/reviewIndex";
import {
  clearedMembersFor,
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
};

const KIND_RANK = new Map(REVIEW_TASK_KINDS.map((kind, i) => [kind, i]));
const LEVEL_RANK = new Map(REVIEW_TASK_LEVELS.map((level, i) => [level, i]));

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
        questionCount: t.question_count,
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
): ReviewScope {
  const all = index.papers.map((paper) => paper.paper_id);
  if (!useWorkingSet) {
  }
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
): ReviewTaskRow[] {
  const inScope = new Set(scope.paperIds);
  return tasks
    .filter((task) => inScope.has(task.paperId))
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
      total: counted.length,
      ambiguous,
      confident,
    };
  });
}

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
};

export function decidedTaskHistory(
  rows: readonly ReviewTaskRow[],
): DecidedTaskEntry[] {
      for (const m of row.task.unit.members) {
        if (a && (!last || a.id > last.id)) last = a;
      }
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
}): ReviewLanding {
    label: shortPaperId(paperId),
  }));
  return {
    scope: input.scope,
    rows,
    sections: reviewKindSections(
      filterReviewTaskRows(rows, input.filters),
      input.includeNonAmbiguous
    ),
    next: nextUndecidedTask(rows, input.includeNonAmbiguous),
  };
}
