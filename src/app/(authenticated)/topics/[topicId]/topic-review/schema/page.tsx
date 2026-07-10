"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import { useRunSnapshot } from "@/features/reviewer-workspace/hooks/useRunSnapshot";

interface Props {
  params: { topicId: string };
}

const TopicReviewSchema = ({ params }: Props) => {
  const { topicId } = params;

  const manifest = manifestQuery.data;
  const summary = schemaSummaryQuery.data;

    if (!manifest || !summary) return null;

  const isLoading = manifestQuery.isLoading || schemaSummaryQuery.isLoading;

  return (
    <div>
      <ReviewSubNav topicId={topicId} />
      {isLoading && <Skeleton className="mt-6 h-64 w-full" />}

          No extraction schema is available for this topic yet.
        </div>
      )}

      )}
    </div>
  );
};

export default TopicReviewSchema;
