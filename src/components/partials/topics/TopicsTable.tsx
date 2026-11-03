"use client";

import AsyncSection from "@/components/shared/AsyncSection";
import TablePagination from "@/components/shared/TablePagination";
import TextBubble from "@/components/shared/TextBubble";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import Link from "@/components/shared/Link";
import { useQueryState } from "@/lib/nuqs-compat";
import { useMemo, useState } from "react";
import { Topic } from "../../../../types/Topic";
import TableSimple from "../../shared/TableSimple";

const TopicsTable = () => {
  const [page, setPage] = useState(1);

  const topicsQuery = useFetchData<undefined, Topic[]>(
    routes.api.topic,
    ["topics"],
    "GET",
    undefined,
    {
      // refetch every 10 seconds
      refetchInterval: 10_000,
    }
  );

  const [searchTerm, _setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const topics = (topicsQuery.data || []).filter((topic) => {
    return topic.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = useMemo(
    () => [
      {
        content: <span>Topic</span>,
        columnId: "topic",
      },
      {
        content: <span>Domain</span>,
        columnId: "domain",
      },
      {
        content: <span>Category</span>,
        columnId: "categories",
      },
      {
        content: <span>Admins</span>,
        columnId: "admins",
      },
      {
        content: <span>Contributors</span>,
        columnId: "contributors",
      },
      { content: <span></span>, className: "", columnId: "actions" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      (topics &&
        topics.map((topic) => [
          {
            content: (
              <span className="flex flex-col py-4">
                <Link
                  href={`/topics/${topic.id}/topic-dashboard`}
                >
                  {topic.name}
                </Link>
                  {topic.description}
                </span>
              </span>
            ),
            className: "max-w-48 text-wrap",
            columnId: "paper",
          },
          {
              <TextBubble
                color="gray"
              />
            ),
            className: "",
            columnId: "domain",
          },
          {
            content: (
              <div className="flex flex-col gap-y-2">
                {topic?.topicCategories?.map((item, index) => (
                  <TextBubble
                    key={index}
                    text={item?.category?.name}
                    color="gray"
                  />
                ))}
              </div>
            ),
            className: "",
            columnId: "categories",
          },

          {
            content: (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 w-fit">
                {topic?.topicAdmins?.map((item, index) => (
                  <TextBubble
                    key={index}
                    text={item.admin.name}
                    color="gray"
                  />
                ))}
              </div>
            ),
            className: "",
            columnId: "reviewers",
          },
          {
            content: (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 w-fit">
                {topic?.topicContributors?.map((item, index) => (
                  <TextBubble
                    key={index}
                    text={item.contributor.name}
                    color="gray"
                  />
                ))}
              </div>
            ),
            className: "",
            columnId: "contributors",
          },
          {
            className: "",
            columnId: "actions",
          },
        ])) ||
      [],
    [topics]
  );
  return (
    <AsyncSection
      query={topicsQuery}
      isEmpty={() => false}
      empty={null}
      loading={
        <TableSimple
          columns={columns}
          rows={[
            [
              {
                content: (
                    Loading...
                  </span>
                ),
                className: "",
                columnId: "",
              },
            ],
          ]}
          tableTitle="Loading Topics..."
        />
      }
      error={<div>Error loading data: {topicsQuery.error?.message}</div>}
    >
      {() => (
        <div className="w-full flex flex-col gap-2">
          <TableSimple columns={columns} rows={rows} tableTitle="" />
          <TablePagination
            decrementPage={() => {
              if (page > 1) setPage(page - 1);
            }}
            incrementPage={() => {
              setPage(page + 1);
            }}
          />
        </div>
      )}
    </AsyncSection>
  );
};

export default TopicsTable;
