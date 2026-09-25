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
    const closed = isPropVoteClosed(question);
    return (
      <div className="flex flex-col gap-6">
          {question.description}
        </h2>
        <div className="flex max-w-xl flex-col gap-2">
            Group vote
          </div>
                Could not load the votes on this question.
              </p>
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
          Scientific question
        </span>
        {question && (
            Locked
          </span>
        )}
      </div>
            <div className="flex flex-col items-start gap-3">
                No scientific question has been set for this topic.
              </p>
                Propose a scientific question
              </Button>
            </div>
              Could not load the scientific question for this topic.
            </p>
    </Card>
  );
};

export default TopicScientificQuestion;
