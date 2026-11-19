"use client";

import Link from "@/components/shared/Link";
import AsyncSection from "@/components/shared/AsyncSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVotes } from "@/hooks/useProps";
import { Prop_Type } from "@metacensus/api";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Prop } from "../../../../types/Prop";
import VoteBar from "../VoteBar";
import { tallyVotes } from "../voteTally";

/** How many statements the dashboard previews. */
export const DASHBOARD_STATEMENT_LIMIT = 3;

/** The topic's statements the dashboard previews, oldest first so the order
 *  matches the seeded order. */
export function dashboardStatements(props: readonly Prop[], limit = DASHBOARD_STATEMENT_LIMIT) {
  return props
    .filter((p) => p.type === Prop_Type.Statement)
    .sort((a, b) => new Date(a.recorded ?? 0).getTime() - new Date(b.recorded ?? 0).getTime())
    .slice(0, limit);
}

const StatementRow = ({ topicId, statement }: { topicId: string; statement: Prop }) => {
  const votesQuery = useVotes(topicId, statement.id);
  const tally = useMemo(() => tallyVotes(votesQuery.data), [votesQuery.data]);

  return (
    <li className="flex flex-col gap-2">
      <p className="text-sm leading-snug">{statement.description}</p>
      {votesQuery.isPending ? (
        <Skeleton className="h-3 w-full rounded-full" />
      ) : votesQuery.isError ? (
        <p className="text-xs text-mc-alert-ink">Could not load the votes.</p>
      ) : (
        <VoteBar tally={tally} />
      )}
    </li>
  );
};

type TopicStatementsCardProps = {
  topicId: string;
  propsQuery: UseQueryResult<Prop[], Error>;
};

const TopicStatementsCard = ({ topicId, propsQuery }: TopicStatementsCardProps) => (
  <Card className="flex h-full flex-col p-6">
    <CardTitle className="text-xl">Consensus statements</CardTitle>
    <CardContent className="mt-4 flex-1 p-0">
      <AsyncSection
        query={propsQuery}
        isEmpty={(rows) => dashboardStatements(rows).length === 0}
        empty={
          <p className="text-sm text-muted-foreground">
            No consensus statements have been made for this topic yet.
          </p>
        }
        error={
          <p className="text-sm text-mc-alert-ink">
            Could not load the consensus statements for this topic.
          </p>
        }
      >
        {(rows) => (
          <ul className="flex flex-col gap-5">
            {dashboardStatements(rows).map((statement) => (
              <StatementRow key={statement.id} topicId={topicId} statement={statement} />
            ))}
          </ul>
        )}
      </AsyncSection>
    </CardContent>
    <div className="mt-5">
      <Link href={`/topics/${topicId}/topic-consensus-statements`}>
        <Button size="sm" type="button" variant="secondary" className="px-3 text-xs">
          Go to consensus statements
        </Button>
      </Link>
    </div>
  </Card>
);

export default TopicStatementsCard;
