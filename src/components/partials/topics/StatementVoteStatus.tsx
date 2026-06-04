import formatIsoDate from "@/functions/formatIsoDate";
import { useFetchData } from "@/hooks/useFetchData";
import { useGetUserId } from "@/hooks/useGetUserId";
import { routes } from "@/lib/routes";
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
  const { data: votes, isLoading: votesLoading } = useFetchData<
    undefined,
    any[]
  >(
    `${routes.api.topic}/${topicId}/prop/${propId}/vote`,
    [`statement-${propId}-${topicId}`],
    "GET"
  );

  const { userId } = useGetUserId();


  return (
    <div className="flex flex-col gap-2">
      {
        <div>
          {userVote && !votesLoading && (
              You voted &quot;{userVote.position}&quot; on this question on{" "}
              {formatIsoDate(userVote.lastCast)}
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
