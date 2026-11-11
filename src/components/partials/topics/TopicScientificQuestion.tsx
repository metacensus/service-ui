"use client";

import AsyncSection from "@/components/shared/AsyncSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import formatIsoDate from "@/functions/formatIsoDate";
import { isPropVoteClosed } from "@/lib/entityId";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Prop } from "../../../../types/Prop";
import type { Vote } from "../../../../types/vote";
import VoteBar from "../VoteBar";
import { tallyVotes } from "../voteTally";

type TopicScientificQuestionProps = {
  question: Prop | null;
  propsQuery: UseQueryResult<Prop[], Error>;
  votesQuery: UseQueryResult<Vote[], Error>;
  onCreate: () => void;
};

/** The question the whole topic answers. It is locked: the group settled it
 *  by vote before any of the work on this page began, so the dashboard shows
 *  the outcome and offers no voting. */
const TopicScientificQuestion = ({
  question,
  propsQuery,
  votesQuery,
  onCreate,
}: TopicScientificQuestionProps) => {
  const body = (question: Prop) => {
    const closed = isPropVoteClosed(question);
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold leading-snug underline decoration-mc-line-accent decoration-2 underline-offset-[6px] md:text-3xl md:leading-snug">
          {question.description}
        </h2>
        <div className="flex max-w-xl flex-col gap-2">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Group vote
          </div>
          <AsyncSection
            query={votesQuery}
            isEmpty={() => false}
            empty={null}
            loading={<Skeleton className="h-3 w-full rounded-full" />}
            error={
              <p className="text-xs text-mc-alert-ink">
                Could not load the votes on this question.
              </p>
            }
          >
            {(votes) => <VoteBar tally={tallyVotes(votes)} />}
          </AsyncSection>
          <p className="text-xs text-muted-foreground">
            {closed
              ? `Voting ${question.conclusion} on ${formatIsoDate(question.concluded)}. `
              : ""}
            The question is locked for this topic.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card id="topic-question" className="scroll-mt-24 p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm font-bold uppercase tracking-wide text-mc-tint-purple-ink">
          Scientific question
        </span>
        {question && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            Locked
          </span>
        )}
      </div>
      <CardContent className="p-0">
        <AsyncSection
          query={propsQuery}
          isEmpty={() => !question}
          empty={
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                No scientific question has been set for this topic.
              </p>
              <Button size="sm" variant="secondary" className="px-3 text-xs" onClick={onCreate}>
                Propose a scientific question
              </Button>
            </div>
          }
          loading={<Skeleton className="h-16 rounded-xl" />}
          error={
            <p className="text-sm text-mc-alert-ink">
              Could not load the scientific question for this topic.
            </p>
          }
        >
          {() => question && body(question)}
        </AsyncSection>
      </CardContent>
    </Card>
  );
};

export default TopicScientificQuestion;
