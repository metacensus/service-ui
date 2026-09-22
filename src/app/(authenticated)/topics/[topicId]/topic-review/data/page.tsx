"use client";

import DataModeShell from "@/features/reviewer-workspace/components/DataModeShell";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import { useSearchParams } from "@/lib/next-navigation-compat";
} from "@/features/reviewer-workspace/model/dataMode";

interface Props {
  params: { topicId: string };
}

const TopicReviewData = ({ params }: Props) => {
  const searchParams = useSearchParams();

  return (
    <div>
    </div>
  );
};

export default TopicReviewData;
