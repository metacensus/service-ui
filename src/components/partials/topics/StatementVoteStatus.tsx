import formatIsoDate from "@/functions/formatIsoDate";
import { useVotes } from "@/hooks/useProps";
import { useGetUserId } from "@/hooks/useGetUserId";
import { findVoteForUser } from "@/lib/entityId";
import { useMemo } from "react";
import PropVoteStatus from "../PropVoteStatus";
import { Prop } from "../../../../types/Prop";

type StatementVoteStatusProps = {
  propId: string;
  topicId: string;
  statement?: Prop;
};

const StatementVoteStatus = ({
  propId,
  statement,
  topicId,
}: StatementVoteStatusProps) => {
  const { data: votes, isLoading: votesLoading } = useVotes(topicId, propId);

  const { userId } = useGetUserId();

  const userVote = useMemo(
    () => findVoteForUser(votes, userId),
    [votes, userId]
  );

  return (
    <div className="flex flex-col gap-2">
      {
        <div>
          {userVote && !votesLoading && (
            <div className="text-xs text-muted-foreground">
              You voted &quot;{userVote.position}&quot; on this question on{" "}
              {userVote.recorded && formatIsoDate(userVote.recorded)}
            </div>
          )}
        </div>
      }
      {votes && !votesLoading && (
        <PropVoteStatus votes={votes} prop={statement} />
      )}
    </div>
  );
};

export default StatementVoteStatus;
