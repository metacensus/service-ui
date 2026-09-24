import { resolveRunId } from "@/features/reviewer-workspace/data/runResolver";
import { useReviewIndex } from "@/features/reviewer-workspace/hooks/useReviewIndex";
import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";
  const runId = resolveRunId(topicId);
  const { query: indexQuery, index, tasks } = useReviewIndex(runId);
