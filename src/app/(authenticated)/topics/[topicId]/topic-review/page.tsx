"use client";

import { useMemo, useState } from "react";
import Link from "@/components/shared/Link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewLandingFilters from "@/features/reviewer-workspace/components/ReviewLandingFilters";
import ReviewProgressHeader from "@/features/reviewer-workspace/components/ReviewProgressHeader";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import { useSearchParams } from "@/lib/next-navigation-compat";
  unitHrefWithOrigin,
} from "@/features/reviewer-workspace/model/returnContext";
import ReviewerIdentityControl from "@/features/reviewer-workspace/components/ReviewerIdentityControl";
import ReviewStorageNotice from "@/features/reviewer-workspace/components/ReviewStorageNotice";
import ReviewWorkspaceMenu from "@/features/reviewer-workspace/components/ReviewWorkspaceMenu";
import {
import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";

interface Props {
  params: { topicId: string };
}

const TopicReview = ({ params }: Props) => {
  const { topicId } = params;
  const base = `/topics/${topicId}/topic-review`;
  const {
    actions,
    actionHistory,
    comments,
    reviewerName,
    storageMode,
    setReviewerName,
    resetReviewState,
  } = useReviewState(topicId, runId);

    () =>
  );
  );
    () =>
  );

    <ReviewLandingFilters

  return (
    <div>
      <ReviewSubNav topicId={topicId} dataMode={origin?.mode ?? null} />
      <ReviewStorageNotice mode={storageMode} />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl">Extraction review</h1>
            High-leverage extraction decisions, ordered by their impact on the
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReviewerIdentityControl
            reviewerName={reviewerName}
            onSave={setReviewerName}
          />
          {runId && (
            <ReviewWorkspaceMenu
              runId={runId}
              reviewerName={reviewerName}
              actions={actions}
              actionHistory={actionHistory}
              comments={comments}
              onReset={resetReviewState}
            />
          )}
        </div>
      </div>

          No Comparanda extraction run is linked to this topic yet.
        </div>
      )}

        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

          No extraction run is available to review for this topic yet. Run an
          extraction first, then return here to review it.
        </div>
      )}

        <div className="mt-6 flex flex-col gap-4">
        </div>
      )}

        <div className="mt-6 flex flex-col gap-4">

        <div className="mt-6 flex flex-col gap-4">
          />

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="primary">
              </Button>
            </div>
          ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              </div>
          )}

            </div>
          )}

            />
        </div>
      )}
    </div>
  );
};

export default TopicReview;
