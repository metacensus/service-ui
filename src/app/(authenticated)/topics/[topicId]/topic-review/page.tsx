"use client";

import { useMemo, useState } from "react";
import Link from "@/components/shared/Link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewDecidedHistory from "@/features/reviewer-workspace/components/ReviewDecidedHistory";
import ReviewKindSection from "@/features/reviewer-workspace/components/ReviewKindSection";
import ReviewLandingFilters from "@/features/reviewer-workspace/components/ReviewLandingFilters";
import ReviewProgressHeader from "@/features/reviewer-workspace/components/ReviewProgressHeader";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import { useSearchParams } from "@/lib/next-navigation-compat";
import {
  parseReviewOrigin,
  unitHrefWithOrigin,
} from "@/features/reviewer-workspace/model/returnContext";
import ReviewerIdentityControl from "@/features/reviewer-workspace/components/ReviewerIdentityControl";
import ReviewStorageNotice from "@/features/reviewer-workspace/components/ReviewStorageNotice";
import ReviewWorkspaceMenu from "@/features/reviewer-workspace/components/ReviewWorkspaceMenu";
import {
  readReviewExpansion,
  writeReviewExpansion,
  type ReviewExpansion,
} from "@/features/reviewer-workspace/model/reviewSession";
import {
  buildReviewLanding,
  decidedTaskHistory,
  resolveReviewScope,
  REVIEW_TASK_DEFAULT_FILTERS,
  type ReviewTaskRow,
} from "@/features/reviewer-workspace/model/reviewTasks";
import type { ReviewTaskKind } from "@/features/reviewer-workspace/data/reviewIndex";
import { resolveRunId } from "@/features/reviewer-workspace/data/runResolver";
import { useReviewIndex } from "@/features/reviewer-workspace/hooks/useReviewIndex";
import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";
import { useWorkingSet } from "@/features/reviewer-workspace/hooks/useWorkingSet";

interface Props {
  params: { topicId: string };
}

const TopicReview = ({ params }: Props) => {
  const { topicId } = params;
  const base = `/topics/${topicId}/topic-review`;
  const searchParams = useSearchParams();
  const origin = parseReviewOrigin(searchParams.get("from"), searchParams);
  const [filters, setFilters] = useState(REVIEW_TASK_DEFAULT_FILTERS);
  const [workingSetOn, setWorkingSetOn] = useReviewSessionFlag("useWorkingSet");
  const [includeNonAmbiguous, setIncludeNonAmbiguous] =
    useReviewSessionFlag("includeNonAmbiguous");
  );
  const setExpansion = (
    part: keyof ReviewExpansion,
    kind: ReviewTaskKind,
    open: boolean

  const runId = resolveRunId(topicId);
  const { query: indexQuery, index, tasks } = useReviewIndex(runId);
  const workingSet = useWorkingSet(topicId, runId);
  const {
    actions,
    actionHistory,
    comments,
    reviewerName,
    storageMode,
    setReviewerName,
    resetReviewState,
  } = useReviewState(topicId, runId);

  const workingSetReady = !workingSetOn || workingSet.status === "ready";
  const scope = useMemo(
    () =>
      index && workingSetReady
        ? resolveReviewScope(index, workingSetOn, workingSetOn ? workingSet.active : null)
        : null,
    [index, workingSetReady, workingSetOn, workingSet.active]
  );
  // A chosen paper that leaves the scope (the working set toggled) reads as
  // all papers until it is back in scope.
  const shownFilters = useMemo(
    () =>
      scope &&
      filters.paperId !== REVIEW_LANDING_ALL &&
      !scope.paperIds.includes(filters.paperId)
        ? { ...filters, paperId: REVIEW_LANDING_ALL }
        : filters,
    [scope, filters]
  );
  const landing = useMemo(
    () =>
        ? buildReviewLanding({
            tasks,
            scope,
            actions,
            filters: shownFilters,
            includeNonAmbiguous,
          })
        : null,
  );

  const loading =
    runId !== null &&
  const workingSetFailed =
    !indexQuery.isError && workingSetOn && workingSet.status === "error";
  const emptyWorkingSet = landing?.scope.emptyWorkingSet ?? false;
  const listedCount =
    landing?.sections.reduce((n, s) => n + s.ambiguous.length + s.confident.length, 0) ?? 0;
  const taskHref = (row: ReviewTaskRow) => unitHrefWithOrigin(base, row.task.id, origin);
  const decided = useMemo(
  );

  const filterBar = (
    <ReviewLandingFilters
      filters={shownFilters}
      paperOptions={landing?.paperOptions ?? []}
      visibleCount={listedCount}
      totalCount={landing?.rows.length ?? 0}
      onChange={setFilters}
      useWorkingSet={workingSetOn}
      onUseWorkingSet={setWorkingSetOn}
    />
  );

  return (
    <div>
      <ReviewSubNav topicId={topicId} dataMode={origin?.mode ?? null} />
      <ReviewStorageNotice mode={storageMode} />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl">Extraction review</h1>
            High-leverage extraction decisions, ordered by their impact on the
            evidence base.
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

      {!runId && (
          No Comparanda extraction run is linked to this topic yet.
        </div>
      )}

      {loading && (
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {indexQuery.isError && (
          No extraction run is available to review for this topic yet. Run an
          extraction first, then return here to review it.
        </div>
      )}

      {workingSetFailed && (
        <div className="mt-6 flex flex-col gap-4">
          {filterBar}
          <div
            role="alert"
          >
            The working set could not be loaded, so no tasks are shown. Try
            again later, or turn off “Use working set” to review all papers.
          </div>
        </div>
      )}

      {landing && emptyWorkingSet && (
        <div className="mt-6 flex flex-col gap-4">
          {filterBar}
            The working set is empty. Add papers in{" "}
            <Link
              href={`${base}/data?mode=table`}
              className="whitespace-nowrap font-bold underline"
            >
              Data → Table
            </Link>
            .
          </div>
        </div>
      )}

      {landing && !emptyWorkingSet && (
        <div className="mt-6 flex flex-col gap-4">
          <ReviewProgressHeader
            panel={landing.panel}
            onIncludeNonAmbiguous={setIncludeNonAmbiguous}
          />

          {filterBar}

          {landing.next ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="primary">
                <Link href={taskHref(landing.next)}>Start next task</Link>
              </Button>
            </div>
          ) : (
            landing.panel.allDecided && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                {includeNonAmbiguous
                  ? "All review tasks decided."
                  : "All ambiguous review tasks decided."}
              </div>
            )
          )}

          {listedCount === 0 && (
              No tasks match these filters.
            </div>
          )}

          {landing.sections.map((section) => (
            <ReviewKindSection
              key={section.kind}
              section={section}
              taskHref={taskHref}
              open={expansion.sections[section.kind] ?? false}
              onOpen={(open) => setExpansion("sections", section.kind, open)}
              confidentOpen={expansion.confident[section.kind] ?? false}
              onConfidentOpen={(open) => setExpansion("confident", section.kind, open)}
            />
          ))}

            Select a task above to open it. When every question of a task is
            decided, the view advances to the next undecided task.
          </p>

          <ReviewDecidedHistory entries={decided} taskHref={taskHref} />
        </div>
      )}
    </div>
  );
};

export default TopicReview;
