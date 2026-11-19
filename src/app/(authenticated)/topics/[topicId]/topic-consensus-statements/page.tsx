"use client";

import CreateConsensusStatement from "@/components/forms/CreateConsensusStatement/CreateConsensusStatement";
import TopicConsensusStatementTable from "@/components/partials/topics/TopicConsensusStatements";
import AsyncSection from "@/components/shared/AsyncSection";
import MyDrawer from "@/components/shared/Drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProps } from "@/hooks/useProps";
import { useTopics } from "@/hooks/useTopics";
import Link from "@/components/shared/Link";
import { Prop_Type } from "@metacensus/api";
import { useMemo, useState } from "react";
import { Vote } from "lucide-react";

interface Props {
  params: { topicId: string };
}

const TopicConsensusStatements = ({ params }: Props) => {
  const { topicId: topicIdEncoded } = params;
  const topicId = topicIdEncoded; // TanStack Router already decodes path params

  const [createStatementOpen, setCreateStatementOpen] = useState(false);

  const [page, setPage] = useState(1);

  const propsQuery = useProps(topicId);
  const props = propsQuery.data;

  const statements = useMemo(() => {
    if (props && props.length > 0) {
      return props.filter((item) => item.type === Prop_Type.Statement);
    }
    return null;
  }, [props]);

  const { data: topics } = useTopics();

  const topic = topics?.find((item) => item.id === topicId) || null;

  return (
    <div className="mt-6">
      <AsyncSection
        query={propsQuery}
        isEmpty={() => false}
        empty={null}
        loading={<div>Loading...</div>}
        error={
          <Card className="p-6 h-full">
            <div className="flex flex-col gap-2">
              <p>Error loading data: {propsQuery.error?.message}</p>
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
        }
      >
        {() => (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-end w-full">
              <div className="mt-4 md:mt-0 flex items-start">
                <Button
                  size="sm"
                  variant="primary"
                  className="gap-2 px-2 py-1"
                  onClick={() => setCreateStatementOpen(true)}
                >
                  <Vote className="size-[1em] text-lg" />
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
          </>
        )}
      </AsyncSection>
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
