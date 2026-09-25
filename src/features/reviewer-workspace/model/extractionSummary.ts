import { REVIEW_TASK_KINDS, type ReviewTaskKind } from "../data/reviewIndex";
import type { Manifest, StoredReviewAction } from "../types";
import type { ReviewSeed } from "./rowStatus";
import { reviewTaskRows, type ReviewTask } from "./reviewTasks";
import { shortPaperId } from "./unitMeta";

export type Progress = { made: number; total: number };

export type ExtractionHeatmapPaper = {
  paperId: string;
  label: string;
  byKind: Record<ReviewTaskKind, Progress>;
  overall: Progress;
};

/** What the topic dashboard's extraction card shows: the size of what was
 *  extracted, and how far review of it has got. */
export type ExtractionSummary = {
  paperCount: number;
  /** Null when the snapshot manifest is not loaded. */
  rowCount: number | null;
  identityColumnCount: number | null;
  /** Every review task, confident ones included. */
  tasks: Progress;
  /** Ambiguous tasks only: the decisions analysis waits on. */
  ambiguousTasks: Progress;
  papersAdjudicated: number;
  heatmap: ExtractionHeatmapPaper[];
};

const emptyByKind = () =>
  Object.fromEntries(REVIEW_TASK_KINDS.map((k) => [k, { made: 0, total: 0 }])) as Record<
    ReviewTaskKind,
    Progress
  >;

export function buildExtractionSummary(input: {
  manifest: Manifest | null;
  tasks: readonly ReviewTask[];
  actions: StoredReviewAction[];
  seed?: ReviewSeed | null;
}): ExtractionSummary {
  const { manifest, tasks } = input;

  const paperIds: string[] = [];
  const seen = new Set<string>();
  const addPaper = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      paperIds.push(id);
    }
  };
  manifest?.papers.forEach((p) => addPaper(p.paper_id));
  tasks.forEach((t) => addPaper(t.paperId));

  const papers = new Map<string, ExtractionHeatmapPaper>(
    paperIds.map((paperId) => [
      paperId,
      {
        paperId,
        label: shortPaperId(paperId),
        byKind: emptyByKind(),
        overall: { made: 0, total: 0 },
      },
    ])
  );

  const all: Progress = { made: 0, total: 0 };
  const ambiguous: Progress = { made: 0, total: 0 };
  const rows = reviewTaskRows(
    tasks,
    { paperIds, emptyWorkingSet: false },
    input.actions,
    input.seed
  );
  for (const { task, progress } of rows) {
    const paper = papers.get(task.paperId)!;
    const made = progress.cleared ? 1 : 0;
    for (const p of [paper.byKind[task.kind], paper.overall, all]) {
      p.total += 1;
      p.made += made;
    }
    if (task.level === "ambiguous") {
      ambiguous.total += 1;
      ambiguous.made += made;
    }
  }

  const heatmap = [...papers.values()].sort(
    (a, b) => a.label.localeCompare(b.label) || (a.paperId < b.paperId ? -1 : 1)
  );

  return {
    paperCount: paperIds.length,
    rowCount: manifest ? manifest.papers.reduce((n, p) => n + (p.row_count ?? 0), 0) : null,
    identityColumnCount: manifest?.identity_dimensions?.length ?? null,
    tasks: all,
    ambiguousTasks: ambiguous,
    papersAdjudicated: heatmap.filter(
      (p) => p.overall.total > 0 && p.overall.made === p.overall.total
    ).length,
    heatmap,
  };
}

export type HeatCellTone = "none" | "open" | "started" | "most" | "done";

/** A cell's colour band from its share of decided tasks. */
export function heatCellTone(p: Progress): HeatCellTone {
  if (p.total === 0) return "none";
  if (p.made === p.total) return "done";
  if (p.made === 0) return "open";
  return p.made / p.total >= 0.5 ? "most" : "started";
}
