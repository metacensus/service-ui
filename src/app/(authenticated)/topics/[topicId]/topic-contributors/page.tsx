"use client";

import UserAvatar from "@/components/partials/UserAvatar";
import TableSimple from "@/components/shared/TableSimple";
import { useMembers } from "@/hooks/useTopics";
import { useMemo } from "react";

interface Props {
  params: { topicId: string };
}

const TopicContributors = ({ params }: Props) => {
  const { topicId: topicIdEncoded } = params;
  const topicId = topicIdEncoded; // TanStack Router already decodes path params

  const { data: contributors } = useMembers(topicId);

  const columns = useMemo(
    () => [
      {
        content: <span>Name</span>,
        className: "text-lg",
        columnId: "name",
      },
      {
        content: <span>Role</span>,
        className: "text-lg",
        columnId: "role",
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      (contributors &&
        contributors.map((contributor) => [
          {
            content: <UserAvatar name={contributor.name} />,

            className: "text-wrap",
            columnId: "name",
          },
          // {
          //   content: (
          //     <TextBubble
          //       text={contributor.role}
          //       color="gray"
          //       className="w-fit"
          //     />
          //   ),
          //   className: "",
          //   columnId: "role",
          // },
        ])) ||
      [],
    [contributors]
  );

  return (
    <div className="w-full flex flex-col mt-6">
      <TableSimple columns={columns} rows={rows} tableTitle="" />
    </div>
  );
};

export default TopicContributors;
