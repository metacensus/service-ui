import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { Paper, type PaperLifecycleStage } from "../../../../types/Paper";
import { getPaperLifecycleStage, showsWorkingSetMembership } from "@/functions/getPaperStatusCount";
import {
  PAPER_REVIEW_TIERS,
  seededTaskIds,
  tierOf,
  type PaperReviewProgress,
} from "@/functions/paperReviewProgress";
import type { PapersReview } from "@/hooks/usePaperReviewProgress";
import type { PapersMembership } from "@/hooks/usePapersMembership";
import { PAPER_MEMBERSHIP_LABELS, visibleMembership, type PaperMembershipStatus } from "@/functions/paperMembership";
import type { ReviewTaskRow } from "@/features/reviewer-workspace/model/reviewTasks";
import { REVIEW_TASK_KIND_HEADINGS } from "@/features/reviewer-workspace/model/unitMeta";

export const SEEDED_REVIEW_NOTE = "Includes simulated seeded review decisions.";

const MEMBERSHIP_COLOURS: Record<PaperMembershipStatus, string> = {
  in: "bg-emerald-100 text-emerald-900",
  out: "bg-amber-100 text-amber-900",
  loading: "bg-gray-100 text-gray-700",
  unavailable: "bg-gray-100 text-gray-700",
};

/** Renders nothing at a stage that hides membership, or while the stage is unknown (null). */
export function PaperMembership({ membership, stage }: { membership: PaperMembershipStatus; stage: PaperLifecycleStage | null }) {
  const shown = visibleMembership(membership, stage);
  if (!shown) return null;
  return <span data-membership={shown} className={`inline-block rounded px-2 py-1 text-xs ${MEMBERSHIP_COLOURS[shown]}`}>
    {PAPER_MEMBERSHIP_LABELS[shown]}
  </span>;
}

export default function PaperLifecycleDetails({ paper, review, membership }: {
  paper: Paper; review: PapersReview; membership: PapersMembership;
}) {
  const progress = review.status === "ready" ? review.progressFor(paper) : null;
  const adjudicated = progress?.adjudicated ?? false;
  const stage = getPaperLifecycleStage(paper, adjudicated);
  const seeded = useMemo(
    () => progress ? seededTaskIds(progress.rows, review.actions, review.seed) : new Set<string>(),
    [progress, review.actions, review.seed]
  );
  return <div className="space-y-6 min-w-0">
    <section aria-label="Lifecycle status" className="space-y-3">
      <h2 className="font-semibold">Lifecycle status</h2>
      <p className="font-medium">{stage}</p>
        {review.status === "loading" ? "Loading review progress…"
          : review.status === "unavailable" ? "Review progress is unavailable; the stage follows the stored status."
          : progress ? `${progress.decided} / ${progress.total} review tasks decided.`
          : "This paper has no review tasks."}
      </p>
      {showsWorkingSetMembership(stage) && <>
        <PaperMembership membership={membership.membershipFor(paper)} stage={stage} />
      </>}
    </section>
    {progress && <section className="space-y-3" aria-label="Required review tasks">
      <h2 className="font-semibold">Required review tasks</h2>
      {seeded.size > 0 && <p className="text-xs text-amber-800">{SEEDED_REVIEW_NOTE}</p>}
      {PAPER_REVIEW_TIERS.map(({ tier, label }) =>
        <TierDetails key={tier} label={label} tier={progress.tiers[tier]}
          rows={progress.rows.filter(row => tierOf(row) === tier)} seeded={seeded} />)}
    </section>}
    <section className="space-y-3 break-words" aria-label="Details">
      <h2 className="font-semibold">Details</h2>
      <p>{paper.title}</p>
      <p className="text-sm whitespace-pre-wrap">{paper.abstract || "No abstract available."}</p>
      {paper.doi && <p className="text-sm">DOI: {paper.doi}</p>}
      {paper.pmid && <p className="text-sm">PMID: {paper.pmid}</p>}
      {paper.url && /^https?:\/\//.test(paper.url) && <p className="text-sm">PubMed: {paper.url}</p>}
      {paper.fullTextUrl && <p className="text-sm">Full text: {paper.fullTextUrl}</p>}
    </section>
  </div>;
}

function TierDetails({ label, tier, rows, seeded }: {
  label: string; tier: PaperReviewProgress["tiers"]["tier1"]; rows: ReviewTaskRow[]; seeded: ReadonlySet<string>;
}) {
  const [open, setOpen] = useState(false);
  const [confidentOpen, setConfidentOpen] = useState(false);
  const ambiguous = rows.filter(row => row.task.level === "ambiguous");
  const clean = rows.filter(row => row.task.level === "clean");
  return <details className="rounded border p-3 min-w-0" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className={cn(styles.focusRing, "cursor-pointer rounded")}>
      <span className="flex flex-col gap-2 min-w-0">
        <span className="font-medium">{label}</span>
        <progress className="w-full h-2" value={tier.decided} max={tier.total || 1} aria-label={`${tier.decided} of ${tier.total} total items reviewed`} />
        <span className="text-sm whitespace-normal break-words">{tier.ambiguousDecided} / {tier.ambiguousTotal} ambiguous items reviewed ({tier.decided} / {tier.total} total items reviewed)</span>
      </span>
    </summary>
    {open && <div className="mt-3 space-y-3 text-sm">
      {ambiguous.map(row => <TaskEntry key={row.task.id} row={row} seeded={seeded.has(row.task.id)} />)}
        <summary className={cn(styles.focusRing, "cursor-pointer")}>Confident extractions ({clean.length})</summary>
        {confidentOpen && <div className="ml-3 mt-3 space-y-3 border-l-2 pl-3">
          {clean.map(row => <TaskEntry key={row.task.id} row={row} seeded={seeded.has(row.task.id)} />)}
        </div>}
      </details>
    </div>}
  </details>;
}

function TaskEntry({ row, seeded }: { row: ReviewTaskRow; seeded: boolean }) {
  const { task, progress } = row;
  return <div className="border-b pb-2 break-words">
    <p className="font-medium">{REVIEW_TASK_KIND_HEADINGS[task.kind]} · {task.title}</p>
    <p className="text-xs">
      {seeded && <span className="text-amber-800"> · seeded (simulated)</span>}
    </p>
  </div>;
}
