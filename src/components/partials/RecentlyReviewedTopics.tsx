"use client";

import { useFetchData } from "@/hooks/useFetchData";
import { get } from "@/lib/indexdb";
import { routes } from "@/lib/routes";
import { styles } from "@/styles";
import Link from "@/components/shared/Link";
import { useEffect, useMemo, useState } from "react";
import { Topic } from "../../../types/Topic";
import AsyncSection from "../shared/AsyncSection";
import TableSimple from "../shared/TableSimple";
import TextBubble from "../shared/TextBubble";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Ellipsis, FileText } from "lucide-react";

const RecentlyReviewedTopics = () => {
  const topicsQuery = useFetchData<undefined, Topic[]>(routes.api.topic, [
    "topics",
  ]);
  const topics = topicsQuery.data;

  const [recentlyViewedTopics, setRecentlyViewedTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const getRecentTopics = async () => {
      const recentTopicIds = await get<string[]>("recentlyViewedTopics");

      if (!topics || !recentTopicIds) {
        setRecentlyViewedTopics([]);
        return;
      }

      setRecentlyViewedTopics(
        recentTopicIds
          .reverse()
          .map((topicId) => {
            const topic = topics.find((topic) => topic.id === topicId);
            return topic;
          })
          .filter((topic): topic is Topic => topic !== undefined)
      );
    };
    getRecentTopics();
  }, [topics]);

  const columns = useMemo(
    () => [
      { content: <span>Topic</span>, className: "", columnId: "topic" },
      { content: <span>Category</span>, className: "", columnId: "categories" },
      { content: <span>Reviewers</span>, className: "", columnId: "reviewers" },
      { content: <span>Status</span>, className: "", columnId: "status" },
      { content: <span></span>, className: "", columnId: "actions" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      recentlyViewedTopics.map((topic) => [
        {
          content: (
            <Link
              href={`/topics/${topic.id}/topic-dashboard`}
              className="flex items-center gap-2"
            >
              <div>
                <FileText className="h-6 w-6" />
              </div>

              <span className="text-muted-foreground">{topic.name}</span>
            </Link>
          ),
          className: "max-w-48 text-wrap",
          columnId: "paper",
        },
        {
          content: (
            <div className="flex flex-col gap-y-2">
              {topic?.topicCategories?.map((category, index) => (
                <TextBubble
                  key={index}
                  text={category.category.name}
                  color="gray"
                  className="mr-2 w-fit"
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
              {topic?.topicReviewers?.map((reviewer, index) => (
                <TextBubble
                  key={index}
                  text={reviewer.reviewer.name}
                  color="gray"
                  className="mr-2 w-fit text-md"
                />
              ))}
            </div>
          ),
          className: "",
          columnId: "reviewers",
        },
        {
          content: (
            <TextBubble
              text={topic.status}
              color="gray"
              className="mr-2 w-fit text-md"
            />
          ),
          className: "",
        },
        {
          content: <Ellipsis className="h-5 w-5" />,
          className: "",
          columnId: "actions",
        },
      ]) || [],
    [recentlyViewedTopics]
  );
  return (
    <AsyncSection
      query={topicsQuery}
      isEmpty={() => false}
      empty={null}
      loading={
        <Card className="p-1 xl:p-12 mt-4">
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
            tableTitle="Recently Viewed Topics"
          />
        </Card>
      }
      error={<div>Error loading data: {topicsQuery.error?.message}</div>}
    >
      {() => (
        <div className="mt-8">
          {recentlyViewedTopics.length > 0 ? (
            <Card className="p-2 xl:p-12 mt-4">
              <TableSimple
                columns={columns}
                rows={rows}
                tableTitle="Recently Viewed Topics"
              />
            </Card>
          ) : (
            <Card
              className="flex-grow flex flex-col items-start justify-center p-4 xl:p-20"
              title="View Topics"
            >
              <h1 className={styles.h4}>View Topics</h1>
              <p className="mt-4">
                Now that you&apos;ve created an account, you can open a topic to
                explore and review the results of peer-reviewed papers.
              </p>
              <div className="mt-6 h-12">
                <Button variant="primary">
                  <Link href="/topics">Go to Topics</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </AsyncSection>
  );
};

export default RecentlyReviewedTopics;
