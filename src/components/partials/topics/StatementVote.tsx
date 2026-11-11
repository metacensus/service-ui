import MyDrawer from "@/components/shared/Drawer";
import { Button } from "@/components/ui/button";
import { useFetchData } from "@/hooks/useFetchData";
import { useGetUserId } from "@/hooks/useGetUserId";
import { findVoteForUser, isPropVoteClosed } from "@/lib/entityId";
import { routes } from "@/lib/routes";
import { useMemo, useState } from "react";
import { Prop } from "../../../../types/Prop";
import PropVoteConclusion from "../PropVoteConclusion";
import PropVoting from "../PropVoting";

type StatementVoteProps = {
  topicId: string;
  prop: Prop;
};

const StatementVote = ({ topicId, prop }: StatementVoteProps) => {
  const [openDrawer, setOpenDrawer] = useState(false);

  const { userId } = useGetUserId();

  const { data: votes } = useFetchData<undefined, any[]>(
    `${routes.api.topic}/${topicId}/prop/${prop.id}/vote`,
    [`statement-${prop.id}-${topicId}-vote`],
    "GET"
  );

  const userVote = useMemo(
    () => findVoteForUser(votes, userId),
    [votes, userId]
  );

  const voteClosed = useMemo(() => isPropVoteClosed(prop), [prop]);

  if (voteClosed) {
    return <PropVoteConclusion prop={prop} />;
  }

  return (
    <div>
      <Button variant="secondary" onClick={() => setOpenDrawer(true)}>
        {userVote ? "Recast Vote" : "Vote"}
      </Button>

      {openDrawer && (
        <MyDrawer
          open={openDrawer}
          setOpen={setOpenDrawer}
          title="Vote on statement"
        >
          <PropVoting
            propId={prop.id}
            topicId={topicId}
            handleClose={() => setOpenDrawer(false)}
          />
        </MyDrawer>
      )}
    </div>
  );
};

export default StatementVote;
