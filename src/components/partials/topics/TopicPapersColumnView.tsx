import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { Paper } from "../../../../types/Paper";
import TopicPaperCard from "./TopicPaperCard";
import PaperLifecycleDetails, { SEEDED_REVIEW_NOTE } from "./PaperLifecycleDetails";
import { getPaperLifecycleStage, getPaperStatusCount, PAPER_LIFECYCLE_STAGES } from "@/functions/getPaperStatusCount";
import { fetchData } from "@/hooks/useFetchData";
import type { PapersReview } from "@/hooks/usePaperReviewProgress";
import type { PapersMembership } from "@/hooks/usePapersMembership";
import { routes } from "@/lib/routes";

export default function TopicPapersColumnView({ papers, review, membership }: {
  papers: Paper[]; review: PapersReview; membership: PapersMembership;
}) {
  const openingCard = useRef<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const uniquePapers = [...new Map(papers.map(paper => [paper.id, paper])).values()];
  const selected = uniquePapers.find(paper => paper.id === selectedId);
  const stageOf = (paper: Paper) => getPaperLifecycleStage(paper, review.isAdjudicated(paper));
  async function accept(paper: Paper) {
    if (accepting !== null) return;
    setAccepting(paper.id); setError(null);
    try {
      await fetchData(routes.api.paperAccept(String(paper.id)), "POST", {});
      await queryClient.invalidateQueries({ predicate: query => String(query.queryKey[0]).startsWith("topics-papers-") });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Acceptance failed. Please try again."); }
    finally { setAccepting(null); }
  }
  return <>
    <p className="mt-4 text-xs text-muted-foreground">Counts describe the {uniquePapers.length} papers shown.
      {review.status === "ready" && review.seed && ` ${SEEDED_REVIEW_NOTE}`}</p>
    {review.status === "unavailable" && <p role="status" className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
      Review progress is unavailable, so papers are placed by their stored status only.</p>}
    {error && <p role="alert" className="mt-3 text-mc-alert-ink">{error}</p>}
    {review.status === "loading" ? <p role="status" className="mt-6 rounded border border-dashed p-4 text-sm text-muted-foreground">Loading review progress…</p> :
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 mt-6 w-full gap-4">
      {PAPER_LIFECYCLE_STAGES.map(stage => <section className="min-w-0" key={stage} aria-label={stage}>
        <h2 className="text-base font-semibold mb-1">{stage}</h2>
        <p className="text-sm text-muted-foreground mb-3">{getPaperStatusCount(uniquePapers, stage, review.isAdjudicated)} papers</p>
        <div className="flex flex-col gap-3">
          {uniquePapers.filter(paper => stageOf(paper) === stage).map(paper =>
            <TopicPaperCard key={paper.id} paper={paper} stage={stage} membership={membership.membershipFor(paper)} onOpen={card => { openingCard.current = card; setSelectedId(paper.id); }} onAccept={() => accept(paper)} accepting={accepting} />)}
          {!getPaperStatusCount(uniquePapers, stage, review.isAdjudicated) && <p className="rounded border border-dashed p-4 text-sm text-muted-foreground">No papers at this stage.</p>}
        </div>
      </section>)}
    </div>}
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open) setSelectedId(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); openingCard.current?.focus(); }} aria-describedby={undefined} className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-3xl max-h-[90dvh] overflow-y-auto rounded-lg bg-card p-4 sm:p-6 shadow-xl">
          <div className="flex justify-between items-center gap-4 mb-5">
            <Dialog.Title className="text-xl font-semibold">Paper details</Dialog.Title>
            <Dialog.Close className={cn(styles.focusRing, "rounded border px-3 py-1")}>Close</Dialog.Close>
          </div>
          {error && <p role="alert" className="mb-3 text-mc-alert-ink">{error}</p>}
          {selected && <>
            <PaperLifecycleDetails paper={selected} review={review} membership={membership} />
            {stageOf(selected) === "Abstracts Gathered" &&
              <button type="button" disabled={accepting !== null} onClick={() => accept(selected)}
                className={cn(styles.focusRing, "mt-5 rounded border border-mc-ink-accent px-3 py-2 text-sm text-mc-ink-accent disabled:opacity-50")}>
                {accepting === selected.id ? "Accepting…" : "Accept for full-text review"}
              </button>}
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
