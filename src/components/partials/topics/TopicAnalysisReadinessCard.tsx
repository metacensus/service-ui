"use client";

import Link from "@/components/shared/Link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Progress } from "@/features/reviewer-workspace/model/extractionSummary";

interface TopicAnalysisReadinessCardProps {
  topicId: string;
  /** Ambiguous review tasks, decided of total; null while unknown. */
  ambiguous: Progress | null;
}

/** Shows no analysis: it sends the user to adjudicate the data first. */
export const TopicAnalysisReadinessCard = ({
  topicId,
  ambiguous,
}: TopicAnalysisReadinessCardProps) => {
  const remaining = ambiguous ? ambiguous.total - ambiguous.made : null;

  return (
    <Card className="flex h-full flex-col p-6">
      <CardTitle className="text-xl">Analysis &amp; results</CardTitle>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 px-0 py-6 text-center">
        <p className="text-lg font-semibold">
          Further adjudication needed before analysis
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {remaining !== null && remaining > 0
            ? `${remaining.toLocaleString("en-US")} low-confidence extraction ${
                remaining === 1 ? "decision is" : "decisions are"
              } still open. Adjudicate more of the data, then return here to run analyses.`
            : "Not enough of the extracted data has been adjudicated yet. Adjudicate more of it, then return here to run analyses."}
        </p>
      </CardContent>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href={`/topics/${topicId}/topic-review`}>
          <Button size="sm" variant="secondary" className="px-3 text-xs" type="button">
            Adjudicate now
          </Button>
        </Link>
      </div>
    </Card>
  );
};
