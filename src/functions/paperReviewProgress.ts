import type { ReviewSeed } from "@/features/reviewer-workspace/model/rowStatus";
import {
  decidedTaskHistory,
  reviewTaskRows,
  type ReviewTask,
  type ReviewTaskRow,
} from "@/features/reviewer-workspace/model/reviewTasks";
import type { StoredReviewAction } from "@/features/reviewer-workspace/types";
import type { Paper } from "../../types/Paper";

export type TierProgress = {
  decided: number;
  total: number;
  ambiguousDecided: number;
  ambiguousTotal: number;
};

export const PAPER_REVIEW_TIERS = [
  { tier: "tier1", label: "Tier 1 (unique derived/inferred fields)", kinds: ["inferred", "derived"] },
  { tier: "tier2", label: "Tier 2 (unique verbatim fields)", kinds: ["verbatim"] },
] as const;

export type PaperReviewTier = (typeof PAPER_REVIEW_TIERS)[number]["tier"];

export type PaperReviewProgress = {
  /** The Review paper id, e.g. `Northfield_2018_11111111`. */
  paperId: string;
  /** Every Review task of the paper, both levels, in display order. */
  rows: ReviewTaskRow[];
  tiers: Record<PaperReviewTier, TierProgress>;
  decided: number;
  total: number;
  /** At least one task, and every task decided (approve or correct). */
  adjudicated: boolean;
};

const emptyTier = (): TierProgress => ({ decided: 0, total: 0, ambiguousDecided: 0, ambiguousTotal: 0 });

export const tierOf = (row: ReviewTaskRow): PaperReviewTier =>
  row.task.kind === "verbatim" ? "tier2" : "tier1";

/** Per Review paper, over every task in the index; the working set plays no part. */
export function computePaperReviewProgress(
  tasks: readonly ReviewTask[],
  actions: StoredReviewAction[],
  seed?: ReviewSeed | null
): Map<string, PaperReviewProgress> {
  const paperIds = [...new Set(tasks.map((task) => task.paperId))];
  const rows = reviewTaskRows(tasks, { paperIds, emptyWorkingSet: false }, actions, seed);
  const byPaper = new Map<string, PaperReviewProgress>();
  for (const row of rows) {
    const paperId = row.task.paperId;
    let paper = byPaper.get(paperId);
    if (!paper) {
      paper = {
        paperId,
        rows: [],
        tiers: { tier1: emptyTier(), tier2: emptyTier() },
        decided: 0,
        total: 0,
        adjudicated: false,
      };
      byPaper.set(paperId, paper);
    }
    const cleared = row.progress.cleared;
    const ambiguous = row.task.level === "ambiguous";
    const tier = paper.tiers[tierOf(row)];
    paper.rows.push(row);
    paper.total += 1;
    tier.total += 1;
    if (ambiguous) tier.ambiguousTotal += 1;
    if (cleared) {
      paper.decided += 1;
      tier.decided += 1;
      if (ambiguous) tier.ambiguousDecided += 1;
    }
  }
  for (const paper of byPaper.values()) {
    paper.adjudicated = paper.total > 0 && paper.decided === paper.total;
  }
  return byPaper;
}

/** Review paper ids end in `_<pmid>`; this maps a stored paper's pmid to its Review paper. */
export function reviewPaperIdsByPmid(paperIds: Iterable<string>): Map<string, string> {
  const byPmid = new Map<string, string>();
  for (const paperId of paperIds) {
    const pmid = paperId.slice(paperId.lastIndexOf("_") + 1);
    if (/^\d+$/.test(pmid)) byPmid.set(pmid, paperId);
  }
  return byPmid;
}

export function progressForPaper(
  paper: Pick<Paper, "pmid">,
  byPmid: ReadonlyMap<string, string>,
  progress: ReadonlyMap<string, PaperReviewProgress>
): PaperReviewProgress | null {
  const paperId = paper.pmid ? byPmid.get(String(paper.pmid).trim()) : undefined;
  return (paperId && progress.get(paperId)) || null;
}

/** Ids of the paper's tasks decided by the seed alone. */
export function seededTaskIds(
  rows: readonly ReviewTaskRow[],
  actions: readonly StoredReviewAction[],
  seed: ReviewSeed | null
): ReadonlySet<string> {
  if (!seed) return new Set();
  return new Set(
    decidedTaskHistory(rows, actions, seed)
      .filter((entry) => entry.seeded)
      .map((entry) => entry.row.task.id)
  );
}
