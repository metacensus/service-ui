import formatIsoDate from "@/functions/formatIsoDate";
import { useMemo } from "react";
import { Prop } from "../../../types/Prop";
import TextBubble from "../shared/TextBubble";

type PropVoteConclusionProps = {
  prop: Prop;
};

const PropVoteConclusion = ({ prop }: PropVoteConclusionProps) => {
  const getPropStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "emerald";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  const voteConcluded = useMemo(() => {
    return (
      <div className="w-fit">
        <TextBubble
          text={`Vote ${prop.conclusion} on ${formatIsoDate(prop.concluded)}`}
          color={getPropStatusColor(prop.conclusion)}
          key="vote-concluded"
        />
      </div>
    );
  }, [prop]);
  return <div>{voteConcluded}</div>;
};

export default PropVoteConclusion;
