"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "@/components/shared/Link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "@/lib/next-navigation-compat";
import {
  parseReviewOrigin,
  reviewBackHref,
  reviewBackLabel,
} from "@/features/reviewer-workspace/model/returnContext";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import ReviewStorageNotice from "@/features/reviewer-workspace/components/ReviewStorageNotice";
import ReviewTaskView from "@/features/reviewer-workspace/components/ReviewTaskView";
import { fetchSchemaSummary } from "@/features/reviewer-workspace/data/snapshot";
import { resolveRunId } from "@/features/reviewer-workspace/data/runResolver";
import { resolveReviewScope, reviewTaskRows } from "@/features/reviewer-workspace/model/reviewTasks";
import {
  useReviewIndex,
  useReviewTasksDocument,
} from "@/features/reviewer-workspace/hooks/useReviewIndex";
import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";
import { useReviewSessionFlag } from "@/features/reviewer-workspace/hooks/useSessionValue";
import { reviewerWorkspaceQueryKeys } from "@/features/reviewer-workspace/hooks/useRunSnapshot";
import { useWorkingSet } from "@/features/reviewer-workspace/hooks/useWorkingSet";

interface Props {
  params: { topicId: string; unitId: string };
}

const TopicReviewUnit = ({ params }: Props) => {
  const { topicId, unitId: taskId } = params;
  const base = `/topics/${topicId}/topic-review`;
  const searchParams = useSearchParams();
  const origin = parseReviewOrigin(searchParams.get("from"), searchParams);
  const backHref = reviewBackHref(base, origin);
  const backLabel = reviewBackLabel(origin);

  const runId = resolveRunId(topicId);
  const { query: indexQuery, index, tasks } = useReviewIndex(runId);
  const workingSet = useWorkingSet(topicId, runId);
  const [workingSetOn] = useReviewSessionFlag("useWorkingSet");
  const [includeNonAmbiguous] = useReviewSessionFlag("includeNonAmbiguous");
  const {
    actions,
    actionHistory,
    comments,
    reviewerName,
    storageMode,
    reviewSeed,
    actionsQuery,
    setReviewerName,
    bulkUpsertActions,
    addComment,
  } = useReviewState(topicId, runId);

  const workingSetReady = !workingSetOn || workingSet.status === "ready";
  const scope = useMemo(
    () =>
      index && workingSetReady
        ? resolveReviewScope(index, workingSetOn, workingSetOn ? workingSet.active : null)
        : null,
    [index, workingSetReady, workingSetOn, workingSet.active]
  );
  const task = useMemo(() => tasks?.find((t) => t.id === taskId) ?? null, [tasks, taskId]);
  const inScope = task && scope?.paperIds.includes(task.paperId) ? task : null;
  const docQuery = useReviewTasksDocument(runId, inScope?.paperId ?? null);
  const detail = useMemo(
    () => docQuery.data?.tasks.find((t) => t.id === taskId) ?? null,
    [docQuery.data, taskId]
  );
  const queue = useMemo(
    () => (tasks && scope ? reviewTaskRows(tasks, scope, actions, reviewSeed) : []),
    [tasks, scope, actions, reviewSeed]
  );
  const schemaQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.schemaSummary(runId ?? "unresolved"),
    queryFn: () => fetchSchemaSummary(runId!),
    enabled: runId !== null,
  });
  const fieldTypes = useMemo(
    () => new Map((schemaQuery.data?.fields ?? []).map((field) => [field.name, field.type])),
    [schemaQuery.data]
  );

  const frame = (children: ReactNode) => (
    <div>
      <ReviewSubNav topicId={topicId} dataMode={origin?.mode ?? null} />
      <ReviewStorageNotice mode={storageMode} />
      <div className="mt-6">
        <Button asChild size="xs" variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
      {children}
    </div>
  );
  const message = (text: ReactNode, tone: "plain" | "error" = "plain") =>
    frame(
      <div
        role={tone === "error" ? "alert" : undefined}
        data-testid="task-page-message"
        className={
          tone === "error"
        }
      >
        {text}
      </div>
    );
  const loading = frame(
    <div className="mt-6 flex flex-col gap-4">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!runId) return message("No Comparanda extraction run is linked to this topic yet.");
  if (indexQuery.isPending) return loading;
  if (indexQuery.isError) {
    return message("The review index could not be loaded, so this task can't be shown.", "error");
  }
  if (tasks && !task) return message("This review task isn't in the review index.");
  if (workingSetOn && workingSet.status === "loading") return loading;
  if (workingSetOn && workingSet.status === "error") {
    return message(
      "The working set could not be loaded, so no tasks are shown. Try again later, or turn off “Use working set” to review all papers.",
      "error"
    );
  }
  if (scope && task && !inScope) {
    return message(
      `This task's paper (${task.paperLabel}) isn't in the working set, so the task isn't shown. Add the paper in Data → Table, or turn off “Use working set” on the Review page.`
    );
  }
  if (docQuery.isError) {
    return message("This paper's review tasks could not be loaded, so this task can't be shown.", "error");
  }
  if (!detail || !docQuery.data) {
    return message("This review task isn't in its paper's review file.", "error");
  }

  return frame(
    <ReviewTaskView
      key={detail.id}
      runId={runId}
      base={base}
      origin={origin}
      backHref={backHref}
      doc={docQuery.data}
      detail={detail}
      task={inScope}
      queue={queue}
      includeNonAmbiguous={includeNonAmbiguous}
      fieldTypes={fieldTypes}
      actions={actions}
      actionHistory={actionHistory}
      reviewSeed={reviewSeed}
      comments={comments}
      reviewerName={reviewerName}
      setReviewerName={setReviewerName}
      bulkUpsertActions={bulkUpsertActions}
      addComment={addComment}
    />
  );
};

export default TopicReviewUnit;
