"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "@/components/shared/Link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import ReviewStorageNotice from "@/features/reviewer-workspace/components/ReviewStorageNotice";
import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";

interface Props {
  params: { topicId: string; unitId: string };
}

const TopicReviewUnit = ({ params }: Props) => {
  const base = `/topics/${topicId}/topic-review`;

  const {
    actions,
    actionHistory,
    comments,
    reviewerName,
    storageMode,
    setReviewerName,
    bulkUpsertActions,
    addComment,
  } = useReviewState(topicId, runId);

    () =>
  );
  );
  );
  });
  );

    <div>
      <ReviewStorageNotice mode={storageMode} />
    </div>
        }
      </div>
    );
    <div className="mt-6 flex flex-col gap-4">
      <Skeleton className="h-36 w-full" />
  );

    );
  }
    );
  }
  }

      actions={actions}
      actionHistory={actionHistory}
      reviewerName={reviewerName}
    />
  );
};

export default TopicReviewUnit;
