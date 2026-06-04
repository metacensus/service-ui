"use client";

import { useFetchData } from "@/hooks/useFetchData";
import { get } from "@/lib/indexdb";
import { routes } from "@/lib/routes";
import { styles } from "@/styles";
import Link from "@/components/shared/Link";
import { useEffect, useMemo, useState } from "react";
import { Topic } from "../../../types/Topic";
import TableSimple from "../shared/TableSimple";
import TextBubble from "../shared/TextBubble";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

const RecentlyReviewedTopics = () => {

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
              </div>

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
            />
          ),
          className: "",
        },
        {
          className: "",
          columnId: "actions",
        },
      ]) || [],
    [recentlyViewedTopics]
  );
  return (
        <Card className="p-1 xl:p-12 mt-4">
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
            tableTitle="Recently Viewed Topics"
          />
        </Card>
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
              </p>
              <div className="mt-6 h-12">
                <Button variant="primary">
                  <Link href="/topics">Go to Topics</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
  );
};

export default RecentlyReviewedTopics;
