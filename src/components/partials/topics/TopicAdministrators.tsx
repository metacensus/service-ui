import TableSimple from "@/components/shared/TableSimple";
import { useMemo } from "react";
import { Contributor } from "../../../../types/Contributor";
import UserAvatar from "../UserAvatar";

type TopicAdministratorsProps = {
  administrators: Pick<NonNullable<Contributor>, "name">[];
};

const TopicAdministrators = ({ administrators }: TopicAdministratorsProps) => {
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
      (administrators &&
        administrators.map((administrator) => [
          {
            content: <UserAvatar name={administrator.name} />,

            className: "text-wrap",
            columnId: "name",
          },
          // {
          //   content: (
          //     <TextBubble
          //       text={administrator.role}
          //       color="gray"
          //       className="w-fit"
          //     />
          //   ),
          //   className: "",
          //   columnId: "role",
          // },
        ])) ||
      [],
    [administrators]
  );
  return (
    <div>
      <TableSimple columns={columns} rows={rows} tableTitle="" />
    </div>
  );
};

export default TopicAdministrators;
