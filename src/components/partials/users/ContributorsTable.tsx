"use client";

import AsyncSection from "@/components/shared/AsyncSection";
import TableSimple from "@/components/shared/TableSimple";
import TopicFilterOption from "@/components/shared/TopicFilterOption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { useMemo } from "react";
import { Contributor } from "../../../../types/Contributor";
import UserAvatar from "../UserAvatar";

const ContributorsTable = () => {
  const contributorsQuery = useFetchData<undefined, Contributor[]>(
    ["users"]
  );
  const data = contributorsQuery.data;

  const contributors = useMemo(() => {
    if (data) {
      return data?.map((item: any) => ({
        ...item,
        topics: item?.topicContributors?.map((el: any) => el?.topic?.name),
      }));
    }
    return [];
  }, [data]);

  const columns = useMemo(
    () => [
      {
        content: <span>Name</span>,
        className: "text-foreground text-lg",
        columnId: "name",
      },
      {
        content: <span>Topics</span>,
        className: "text-foreground text-lg",
        columnId: "topics",
      },
      { content: <span></span>, className: "w-fit", columnId: "actions" },
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
          //     <div className="flex gap-2 flex-wrap w-full max-w-3xl">
          //       {contributor?.topics?.map((topic) => (
          //         <TextBubble key={topic} text={topic} color="gray" />
          //       ))}
          //     </div>
          //   ),
          //   className: "",
          //   columnId: "role",
          // },

          // {
          //   content: (
          //     <div className="w-full flex justify-end">
          //       <BsThreeDots className="h-5 w-5 cursor-pointer" />
          //     </div>
          //   ),
          //   className: "",
          //   columnId: "actions",
          // },
        ])) ||
      [],
    [contributors]
  );

  const table = <TableSimple columns={columns} rows={rows} tableTitle="" />;

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full mt-6">
        <div className="w-full">
          <h1 className="text-2xl font-semibold mb-8">Contributors</h1>
          <div className="flex flex-col gap-2 xl:items-center md:flex-row">
            <Input placeholder="Search" className="h-9 w-full max-w-sm" />

            <div className="flex flex-col md:flex-row gap-2 mr-2">
              <TopicFilterOption title="Topics" />
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-start">
          <Button
            size="sm"
            variant="primary"
            className="gap-2 px-2 py-1 my-0 items-center"
          >
            <span className="text-xs">Invite Contributor</span>
          </Button>
        </div>
      </div>
      <AsyncSection
        query={contributorsQuery}
        isEmpty={() => false}
        empty={null}
        loading={
          <TableSimple
            columns={columns}
            rows={[
              [
                {
                  content: (
                    <div className=" max-w-fit flex gap-2 items-center text-2xl">
                      Loading...
                    </div>
                  ),
                  className: "text-wrap",
                  columnId: "name",
                },
              ],
            ]}
            tableTitle=""
          />
        }
        error={table}
      >
        {() => table}
      </AsyncSection>
      {/* <TablePagination
        decrementIds={decrementIds}
        incrementIds={incrementIds}
        className="mt-6"
      /> */}
    </div>
  );
};

export default ContributorsTable;
