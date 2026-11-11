"use client";
import PaperLifecycleDetails from "@/components/partials/topics/PaperLifecycleDetails";
import AsyncSection from "@/components/shared/AsyncSection";
import { useFetchData } from "@/hooks/useFetchData";
import { usePaperReviewProgress } from "@/hooks/usePaperReviewProgress";
import { usePapersMembership } from "@/hooks/usePapersMembership";
import { routes } from "@/lib/routes";
import { Paper } from "../../../../../../../types/Paper";

export default function TopicPaper({ params }: { params: { topicId: string; paperId: string } }) {
  const body = { topicId: params.topicId, paperId: params.paperId };
  const papersQuery = useFetchData<typeof body, Paper[]>(routes.api.paper,
    [`topics-papers-${params.topicId}-${params.paperId}`], "POST", body);
  const review = usePaperReviewProgress(params.topicId);
  const membership = usePapersMembership(params.topicId);
  return (
    <AsyncSection
      query={papersQuery}
      isEmpty={(papers) => !papers?.[0]}
      empty={<p>Paper not found.</p>}
      loading={<p>Loading…</p>}
      error={<p role="alert">{papersQuery.error?.message}</p>}
    >
      {([paper]) => <div className="my-6 rounded border bg-card p-4 sm:p-8"><PaperLifecycleDetails paper={paper} review={review} membership={membership} /></div>}
    </AsyncSection>
  );
}
