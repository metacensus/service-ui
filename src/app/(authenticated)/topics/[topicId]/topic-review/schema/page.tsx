"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewSubNav from "@/features/reviewer-workspace/components/ReviewSubNav";
import { SchemaDiagram } from "@/features/reviewer-workspace/components/schema/SchemaDiagram";
import { useRunSnapshot } from "@/features/reviewer-workspace/hooks/useRunSnapshot";
import { buildSchemaExplorerModel } from "@/features/reviewer-workspace/model/schemaView";

interface Props {
  params: { topicId: string };
}

const TopicReviewSchema = ({ params }: Props) => {
  const { topicId } = params;
  const { runId, manifestQuery, schemaSummaryQuery, demoConfigQuery } =
    useRunSnapshot(topicId);

  const manifest = manifestQuery.data;
  const summary = schemaSummaryQuery.data;
  const schemaPresentation = demoConfigQuery.data?.schema_presentation;

  const model = useMemo(() => {
    if (!manifest || !summary) return null;
    return buildSchemaExplorerModel(summary, manifest, schemaPresentation);
  }, [manifest, schemaPresentation, summary]);

  const isLoading = manifestQuery.isLoading || schemaSummaryQuery.isLoading;
  const hasError = manifestQuery.isError || schemaSummaryQuery.isError;

  return (
    <div>
      <ReviewSubNav topicId={topicId} />
      {isLoading && <Skeleton className="mt-6 h-64 w-full" />}

      {hasError && (
          No extraction schema is available for this topic yet.
        </div>
      )}

      {manifest && model && (
        <SchemaDiagram model={model} runId={runId} />
      )}
    </div>
  );
};

export default TopicReviewSchema;
