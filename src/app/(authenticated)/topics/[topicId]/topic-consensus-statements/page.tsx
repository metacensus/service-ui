"use client";

import CreateConsensusStatement from "@/components/forms/CreateConsensusStatement/CreateConsensusStatement";
import TopicConsensusStatementTable from "@/components/partials/topics/TopicConsensusStatements";
import MyDrawer from "@/components/shared/Drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import Link from "@/components/shared/Link";
import { useMemo, useState } from "react";
import { Prop } from "../../../../../../types/Prop";
import { Topic } from "../../../../../../types/Topic";

interface Props {
  params: { topicId: string };
}

const TopicConsensusStatements = ({ params }: Props) => {
  const { topicId: topicIdEncoded } = params;
  const topicId = topicIdEncoded; // TanStack Router already decodes path params

  const [createStatementOpen, setCreateStatementOpen] = useState(false);

  const [page, setPage] = useState(1);

    `${routes.api.topic}/${topicId}/prop`,
    [`statements-${topicId}`],
    "GET"
  );

  const statements = useMemo(() => {
    if (props && props.length > 0) {
      return props.filter((item) => item.type === "Statement");
    }
    return null;
  }, [props]);

  const { data: topics } = useFetchData<undefined, Topic[]>(routes.api.topic, [
    "topics",
  ]);

  const topic = topics?.find((item) => item.id === topicId) || null;

  return (
    <div className="mt-6">
          <Card className="p-6 h-full">
            <div className="flex flex-col gap-2">
              <p>
                Could not load the statements for this topic. Please try again
                later.
              </p>
              <Link href={`/topics/${topicId}/topic-dashboard`}>
                <Button size="sm" variant="primary" type="button">
                  Go back to topic dashboard
                </Button>
              </Link>
            </div>
          </Card>
            <div className="flex flex-col md:flex-row md:items-center justify-end w-full">
              <div className="mt-4 md:mt-0 flex items-start">
                <Button
                  size="sm"
                  variant="primary"
                  className="gap-2 px-2 py-1"
                  onClick={() => setCreateStatementOpen(true)}
                >
                  <span className="text-xs">Create Consensus Statement</span>
                </Button>
              </div>
            </div>

            {statements && topicId && (
              <TopicConsensusStatementTable
                statements={statements}
                page={page}
                setPage={setPage}
                topicId={topicId}
              />
            )}
      {createStatementOpen && (
        <MyDrawer
          open={createStatementOpen}
          setOpen={setCreateStatementOpen}
          title={`Create Consensus Statement for `}
          secondaryTitle={`${topic?.name}`}
        >
          <CreateConsensusStatement
            topicId={topicId}
            setDrawerOpen={setCreateStatementOpen}
          />
        </MyDrawer>
      )}
    </div>
  );
};

export default TopicConsensusStatements;
