"use client";
import PaperLifecycleDetails from "@/components/partials/topics/PaperLifecycleDetails";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { Paper } from "../../../../../../../types/Paper";

export default function TopicPaper({ params }: { params: { topicId: string; paperId: string } }) {
  const body = { topicId: params.topicId, paperId: params.paperId };
    [`topics-papers-${params.topicId}-${params.paperId}`], "POST", body);
  return (
  );
}
