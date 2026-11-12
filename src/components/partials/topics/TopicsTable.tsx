"use client";

import AsyncSection from "@/components/shared/AsyncSection";
import TablePagination from "@/components/shared/TablePagination";
import TextBubble from "@/components/shared/TextBubble";
import { topicsQuery } from "@/hooks/useTopics";
import { useQuery } from "@tanstack/react-query";
import Link from "@/components/shared/Link";
import { useQueryState } from "@/lib/nuqs-compat";
import { useMemo, useState } from "react";
import TableSimple from "../../shared/TableSimple";
import { Ellipsis } from "lucide-react";

// TextBubble supplies the padding.
const PILL = "mr-2 bg-secondary w-fit rounded-lg";

const TopicsTable = () => {
  const [page, setPage] = useState(1);

  const query = useQuery({ ...topicsQuery, refetchInterval: 10_000 });

  const [searchTerm, _setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const topics = (query.data || []).filter((topic) => {
    return topic.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = useMemo(
    () => [
      {
        content: <span>Topic</span>,
        className: "text-lg",
        columnId: "topic",
      },
      {
        content: <span>Domain</span>,
        className: "text-lg",
        columnId: "domain",
      },
      {
        content: <span>Category</span>,
        className: "text-lg",
        columnId: "categories",
      },
      {
        content: <span>Admins</span>,
        className: "text-lg",
        columnId: "admins",
      },
      {
        content: <span>Contributors</span>,
        className: "text-lg",
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
                <span className="text-muted-foreground text-sm line-clamp-3">
                  {topic.description}
                </span>
              </span>
            ),
            className: "max-w-48 text-wrap",
            columnId: "paper",
          },
          {
            content: topic.domain?.name && (
              <TextBubble
                text={topic.domain.name}
                color="gray"
                className={PILL}
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
                    className={PILL}
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
                    className={PILL}
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
                    className={PILL}
                  />
                ))}
              </div>
            ),
            className: "",
            columnId: "contributors",
          },
          {
            content: <Ellipsis className="h-5 w-5 cursor-pointer" />,
            className: "",
            columnId: "actions",
          },
        ])) ||
      [],
    [topics]
  );
  return (
    <AsyncSection
      query={query}
      isEmpty={() => false}
      empty={null}
      loading={
        <TableSimple
          columns={columns}
          rows={[
            [
              {
                content: (
                  <span className="flex items-center space-x-2 text-muted-foreground text-xl">
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
      error={<div>Error loading data: {query.error?.message}</div>}
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
