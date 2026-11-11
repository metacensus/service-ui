"use client";

import Link from "@/components/shared/Link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { REVIEW_TASK_KINDS } from "@/features/reviewer-workspace/data/reviewIndex";
import { useExtractionSummary } from "@/features/reviewer-workspace/hooks/useExtractionSummary";
import {
  heatCellTone,
  type ExtractionSummary,
  type HeatCellTone,
  type Progress,
} from "@/features/reviewer-workspace/model/extractionSummary";
import { REVIEW_TASK_KIND_HEADINGS } from "@/features/reviewer-workspace/model/unitMeta";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<HeatCellTone, string> = {
  none: "bg-white",
  open: "bg-gray-200",
  started: "bg-emerald-200",
  most: "bg-emerald-400",
  done: "bg-emerald-600",
};

const TONE_LEGEND: [HeatCellTone, string][] = [
  ["open", "Not started"],
  ["started", "Under way"],
  ["most", "Mostly done"],
  ["done", "Adjudicated"],
];

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const cellTitle = (label: string, kind: string, p: Progress) =>
  p.total === 0
    ? `${label} · ${kind}: nothing to review`
    : `${label} · ${kind}: ${p.made} of ${p.total} review tasks decided`;

const Figure = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col">
    <span className="text-2xl font-bold tabular-nums">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

export const ExtractionHeatmap = ({ summary }: { summary: ExtractionSummary }) => (
  <div className="flex flex-col gap-2">
    <div
      role="img"
      aria-label={`Adjudication progress: ${summary.papersAdjudicated} of ${summary.paperCount} papers fully adjudicated`}
      className="grid gap-y-1"
      style={{ gridTemplateColumns: "4.5rem 1fr" }}
    >
      {REVIEW_TASK_KINDS.map((kind) => (
        <div key={kind} className="contents">
          <span className="self-center text-[11px] font-semibold text-muted-foreground">
            {REVIEW_TASK_KIND_HEADINGS[kind]}
          </span>
          <div
            className="grid gap-px rounded-sm bg-gray-100 p-px"
            style={{
              gridTemplateColumns: `repeat(${Math.max(summary.heatmap.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {summary.heatmap.map((paper) => (
              <div
                key={paper.paperId}
                title={cellTitle(paper.label, REVIEW_TASK_KIND_HEADINGS[kind], paper.byKind[kind])}
                className={cn("h-4", TONE_CLASSES[heatCellTone(paper.byKind[kind])])}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span>Each column is one paper.</span>
      {TONE_LEGEND.map(([tone, label]) => (
        <span key={tone} className="inline-flex items-center gap-1">
          <span className={cn("h-2.5 w-2.5 rounded-sm", TONE_CLASSES[tone])} />
          {label}
        </span>
      ))}
    </div>
  </div>
);

type TopicExtractionCardViewProps = {
  topicId: string;
  runId: string | null;
  summary: ExtractionSummary | null;
  isPending: boolean;
  isError: boolean;
};

export const TopicExtractionCardView = ({
  topicId,
  runId,
  summary,
  isPending,
  isError,
}: TopicExtractionCardViewProps) => {
  const base = `/topics/${topicId}/topic-review`;

  const body = () => {
    if (!runId) {
      return (
        <p className="text-sm text-muted-foreground">
          No Comparanda extraction run is linked to this topic yet.
        </p>
      );
    }
    if (isPending) return <Skeleton className="h-40 rounded-xl" />;
    if (isError || !summary) {
      return (
        <p className="text-sm text-mc-alert-ink">
          Could not load the extraction for this topic.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3">
          <Figure value={fmt(summary.paperCount)} label="Papers extracted" />
          <Figure value={fmt(summary.rowCount)} label="Data rows" />
          <Figure value={fmt(summary.identityColumnCount)} label="Identity columns" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold">
              Adjudication progress
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {summary.papersAdjudicated} of {summary.paperCount} papers ·{" "}
              {fmt(summary.tasks.made)} of {fmt(summary.tasks.total)} tasks
            </span>
          </div>
          <ExtractionHeatmap summary={summary} />
        </div>
      </div>
    );
  };

  return (
    <Card className="flex h-full flex-col p-6">
      <CardTitle className="text-xl">Paper extraction</CardTitle>
      <CardContent className="mt-4 flex-1 p-0">{body()}</CardContent>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={base}>
          <Button size="sm" variant="secondary" className="px-3 text-xs" type="button">
            Review
          </Button>
        </Link>
        <Link href={`${base}/data`}>
          <Button size="sm" variant="outline" className="px-3 text-xs" type="button">
            Explore
          </Button>
        </Link>
      </div>
    </Card>
  );
};

const TopicExtractionCard = ({ topicId }: { topicId: string }) => {
  const extraction = useExtractionSummary(topicId);
  return <TopicExtractionCardView topicId={topicId} {...extraction} />;
};

export default TopicExtractionCard;
