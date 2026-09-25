"use client";

import CreateMetaAnalysisQuestion from "@/components/forms/CreateMetaAnalysisQuestion/CreateMetaAnalysisQuestion";
import CreatePaper from "@/components/forms/CreatePaper/CreatePaper";
import CreateProtocol from "@/components/forms/CreateProtocol/CreateProtocol";
import EditProtocol from "@/components/forms/EditProtocol/EditProtocol";
import { TopicAnalysisReadinessCard } from "@/components/partials/topics/TopicAnalysisReadinessCard";
import TopicActionItems from "@/components/partials/topics/TopicActionItems";
import { TopicExtractionCardView } from "@/components/partials/topics/TopicExtractionCard";
import TopicGroupMembers from "@/components/partials/topics/TopicGroupMembers";
import TopicPaperStatuses from "@/components/partials/topics/TopicPaperStatuses";
import TopicProtocolView from "@/components/partials/topics/TopicProtocolView";
import TopicScientificQuestion from "@/components/partials/topics/TopicScientificQuestion";
import TopicStatementsCard from "@/components/partials/topics/TopicStatementsCard";
import AsyncSection from "@/components/shared/AsyncSection";
import MyDrawer from "@/components/shared/Drawer";
import IconButton from "@/components/shared/IconButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExtractionSummary } from "@/features/reviewer-workspace/hooks/useExtractionSummary";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { useMemo, useState } from "react";
import { Prop } from "../../../../../../types/Prop";
import { Protocol } from "../../../../../../types/Protocol";
import { Topic } from "../../../../../../types/Topic";
import { Vote } from "../../../../../../types/vote";

interface Props {
  params: { topicId: string };
}

const INVESTIGATIONAL_APPROACHES = [
  "Systematic review",
  "Meta-analysis",
  "Targeted guideline revision",
];

const TopicsDashboard = ({ params }: Props) => {
  const { topicId } = params; // TanStack Router already decodes path params

  const topicsQuery = useFetchData<undefined, Topic[]>(routes.api.topic, [
    "topics",
  ]);

  const propsQuery = useFetchData<undefined, Prop[]>(
    `${routes.api.topic}/${topicId}/prop`,
    [`props-${topicId}`],
    "GET"
  );

  const question = useMemo(
    () => propsQuery.data?.find((item) => item.type === "TopicQuestion") ?? null,
    [propsQuery.data]
  );

  // Keyed and gated on the question's id: keyed on the topic alone, the
  // request made before props arrived (`/prop/undefined/vote`) was cached
  // under the same key and never replaced.
  const votesQuery = useFetchData<undefined, Vote[]>(
    `${routes.api.topic}/${topicId}/prop/${question?.id}/vote`,
    [`meta-vote-${topicId}-${question?.id}`],
    "GET",
    undefined,
    { enabled: !!question?.id }
  );

  const protocolQuery = useFetchData<undefined, Protocol | null>(
    routes.api.topicProtocol(topicId),
    [`topic-protocol-${topicId}`]
  );
  const { data: protocol } = protocolQuery;

  const extraction = useExtractionSummary(topicId);

  const [createProtocolOpen, setCreateProtocolOpen] = useState(false);
  const [createPaperOpen, setCreatePaperOpen] = useState(false);
  const [viewProtocolOpen, setViewProtocolOpen] = useState(false);
  const [editProtocolOpen, setEditProtocolOpen] = useState(false);
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);

    <div className="flex flex-col w-full gap-4 mt-8">
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );

    <div className="flex flex-col w-full">
      <div className="mt-2 w-full flex justify-end items-center gap-2">
        <TopicActionItems topicId={topicId} />
        {!!protocol && (
          <Button
            size="sm"
            variant="primary"
            className="gap-2 px-2 py-1"
            onClick={() => setCreatePaperOpen(true)}
          >
            <span className="text-xs">Submit Paper</span>
          </Button>
        )}
      </div>

      <div className="mt-6">
        <TopicScientificQuestion
          question={question}
          propsQuery={propsQuery}
          votesQuery={votesQuery}
          onCreate={() => setCreateQuestionOpen(true)}
        />
      </div>

      <div
        className={`grid grid-cols-1 gap-4 mt-4 ${protocol ? "lg:grid-cols-2" : ""}`}
      >
        <Card className="p-6 h-full">
          <CardTitle className="text-xl">Investigational approach</CardTitle>
          <CardContent className="p-0 mt-4 flex flex-col gap-4">
            <ul className="flex flex-wrap gap-2">
              {INVESTIGATIONAL_APPROACHES.map((approach) => (
                <li
                  key={approach}
                >
                  {approach}
                </li>
              ))}
            </ul>
            <AsyncSection
              query={protocolQuery}
              isEmpty={(value) => !value}
              empty={
                <IconButton
                  text="Create Protocol"
                  onClick={() => setCreateProtocolOpen(true)}
                  type="button"
                />
              }
              loading={<Skeleton className="h-10 w-48 rounded-lg" />}
              error={
                  Could not load the protocol for this topic.
                </p>
              }
            >
              {() => (
                <div className="flex gap-2 flex-wrap">
                  <IconButton
                    text="View Protocol"
                    onClick={() => setViewProtocolOpen(true)}
                    type="button"
                  />
                  <IconButton
                    text="Edit Protocol"
                    onClick={() => setEditProtocolOpen(true)}
                    type="button"
                  />
                </div>
              )}
            </AsyncSection>
          </CardContent>
        </Card>
        {!!protocol && (
          <Card className="p-6 h-full">
            <CardTitle className="text-xl">Papers</CardTitle>
            <CardContent className="p-0">
              <TopicPaperStatuses topicId={topicId} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        <TopicExtractionCardView topicId={topicId} {...extraction} />
        <TopicAnalysisReadinessCard
          topicId={topicId}
          ambiguous={extraction.summary?.ambiguousTasks ?? null}
        />
        <TopicStatementsCard topicId={topicId} propsQuery={propsQuery} />
      </div>

      <TopicGroupMembers topic={topic} />

      {createProtocolOpen && (
        <MyDrawer
          open={createProtocolOpen}
          setOpen={setCreateProtocolOpen}
          title="Create Protocol"
          secondaryTitle={`for ${topic?.name}`}
        >
          <CreateProtocol
            topicId={topicId}
            setDrawerOpen={setCreateProtocolOpen}
          />
        </MyDrawer>
      )}
      {createPaperOpen && (
        <MyDrawer
          open={createPaperOpen}
          setOpen={setCreatePaperOpen}
          title={`Submit Paper to ${topic?.name}`}
        >
          <CreatePaper topicId={topicId} setDrawerOpen={setCreatePaperOpen} />
        </MyDrawer>
      )}
      {viewProtocolOpen && (
        <MyDrawer
          open={viewProtocolOpen}
          setOpen={setViewProtocolOpen}
          title="View Protocol"
          secondaryTitle={`for ${topic?.name}`}
        >
          <TopicProtocolView topicId={topicId} />
        </MyDrawer>
      )}
      {editProtocolOpen && protocol && (
        <MyDrawer
          open={editProtocolOpen}
          setOpen={setEditProtocolOpen}
          title="Edit Protocol"
          secondaryTitle={`for ${topic?.name}`}
        >
          <EditProtocol
            topicId={topicId}
            protocol={protocol}
            setDrawerOpen={() => setEditProtocolOpen(false)}
          />
        </MyDrawer>
      )}
      {createQuestionOpen && (
        <MyDrawer
          open={createQuestionOpen}
          setOpen={setCreateQuestionOpen}
          title="Propose a scientific question"
          secondaryTitle={`for ${topic?.name}`}
        >
          <CreateMetaAnalysisQuestion
            topicId={topicId}
            setDrawerOpen={setCreateQuestionOpen}
          />
        </MyDrawer>
      )}
    </div>
  );
            Could not load this topic
          </p>
            The request failed. Reload the page to try again.
          </p>
        </div>
};

export default TopicsDashboard;
