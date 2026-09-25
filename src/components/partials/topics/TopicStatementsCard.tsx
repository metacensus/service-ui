"use client";

import Link from "@/components/shared/Link";
import AsyncSection from "@/components/shared/AsyncSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Prop } from "../../../../types/Prop";
import type { Vote } from "../../../../types/vote";
import VoteBar from "../VoteBar";
import { tallyVotes } from "../voteTally";

/** How many statements the dashboard previews. */
export const DASHBOARD_STATEMENT_LIMIT = 3;

/** The topic's statements the dashboard previews, oldest first so the order
 *  matches the seeded order. */
export function dashboardStatements(props: readonly Prop[], limit = DASHBOARD_STATEMENT_LIMIT) {
  return props
    .filter((p) => p.type === "Statement")
    .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
    .slice(0, limit);
}

const StatementRow = ({ topicId, statement }: { topicId: string; statement: Prop }) => {
  // Same key as StatementVoteStatus, so the statements page reuses this fetch.
  const votesQuery = useFetchData<undefined, Vote[]>(
    `${routes.api.topic}/${topicId}/prop/${statement.id}/vote`,
    [`statement-${statement.id}-${topicId}`],
    "GET"
  );
  const tally = useMemo(() => tallyVotes(votesQuery.data), [votesQuery.data]);

  return (
    <li className="flex flex-col gap-2">
      {votesQuery.isPending ? (
        <Skeleton className="h-3 w-full rounded-full" />
      ) : votesQuery.isError ? (
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
            No consensus statements have been made for this topic yet.
          </p>
        }
        error={
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
          Go to consensus statements
        </Button>
      </Link>
    </div>
  </Card>
);

export default TopicStatementsCard;
