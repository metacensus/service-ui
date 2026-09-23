"use client";

import DataModeShell from "@/features/reviewer-workspace/components/DataModeShell";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import { useSearchParams } from "@/lib/next-navigation-compat";
import {
  parseDataMode,
  resolveDataMode,
  readLastDataMode,
} from "@/features/reviewer-workspace/model/dataMode";

interface Props {
  params: { topicId: string };
}

const TopicReviewData = ({ params }: Props) => {
  const searchParams = useSearchParams();
  const mode = resolveDataMode(
    parseDataMode(searchParams.get("mode")),
    readLastDataMode(localStorage)
  );

  return (
    <div>
      <ReviewSubNav topicId={params.topicId} dataMode={mode} />
      <DataModeShell topicId={params.topicId} mode={mode} />
    </div>
  );
};

export default TopicReviewData;
