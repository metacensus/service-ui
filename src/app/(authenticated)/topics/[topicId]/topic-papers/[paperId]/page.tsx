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
    [`topics-papers-${params.topicId}-${params.paperId}`], "POST", body);
  const review = usePaperReviewProgress(params.topicId);
  const membership = usePapersMembership(params.topicId);
  return (
    <AsyncSection
      query={papersQuery}
      isEmpty={(papers) => !papers?.[0]}
    >
    </AsyncSection>
  );
}
