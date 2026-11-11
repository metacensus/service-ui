"use client";

import UserAvatar from "@/components/partials/UserAvatar";
import TableSimple from "@/components/shared/TableSimple";
import { useFetchData } from "@/hooks/useFetchData";
import { useMemo } from "react";
import { Contributor } from "../../../../../../types/Contributor";
import { Topic } from "../../../../../../types/Topic";
import { routes } from "@/lib/routes";

interface Props {
  params: { topicId: string };
}

const TopicContributors = ({ params }: Props) => {
  const { topicId: topicIdEncoded } = params;
  const topicId = topicIdEncoded; // TanStack Router already decodes path params

  const { data } = useFetchData<undefined, Topic>(
    `${routes.api.topic}/${topicId}`,
    [`topic-details-${topicId}`]
  );

  const contributors = useMemo<Contributor[]>(() => {
    if (data) {
      return data?.topicContributors.map((item: any) => ({
        ...item.contributor,
      })) as Contributor[];
    }
    return [];
  }, [data]);

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
