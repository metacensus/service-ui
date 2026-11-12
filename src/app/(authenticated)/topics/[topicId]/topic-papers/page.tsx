"use client";

import CreatePaper from "@/components/forms/CreatePaper/CreatePaper";
import IconCard from "@/components/partials/IconCard";
import TopicPapersColumnView from "@/components/partials/topics/TopicPapersColumnView";
import TopicPapersTableView from "@/components/partials/topics/TopicPapersTableView";
import MyDrawer from "@/components/shared/Drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAllTopicPapers } from "@/functions/fetchAllTopicPapers";
import { useFetchData } from "@/hooks/useFetchData";
import { useTopics } from "@/hooks/useTopics";
import { usePaperReviewProgress } from "@/hooks/usePaperReviewProgress";
import { usePapersMembership } from "@/hooks/usePapersMembership";
import { routes } from "@/lib/routes";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Paper } from "../../../../../../types/Paper";
import { Columns3, FilePlus, Table } from "lucide-react";

interface Props {
  params: { topicId: string };
}

const TopicPapers = ({ params }: Props) => {
  const { topicId: topicIdEncoded } = params;
  const topicId = topicIdEncoded; // TanStack Router already decodes path params

  const [activeView, setActiveView] = useState<"grid" | "table">("grid");
  const [createPaperOpen, setCreatePaperOpen] = useState(false);

  const [page, setPage] = useState(1);

  // The table pages; the grid shows every paper in the topic.
  const queryBody = { topicId, page, limit: 10 };
  const { data } = useFetchData<typeof queryBody, Paper[]>(
    routes.api.paper,
    [`topics-papers-${topicId}`],
    "POST",
    queryBody,
    { enabled: activeView === "table" }
  );
  const { data: allPapers } = useQuery({
    queryKey: [`topics-papers-${topicId}`, "all"],
    queryFn: () => fetchAllTopicPapers(topicId),
    enabled: activeView === "grid",
  });
  const review = usePaperReviewProgress(topicId);
  const membership = usePapersMembership(topicId);

  const papers = useMemo(() => {
    if (data) {
      return data as Paper[];
    }
    return null;
  }, [data]);

  const { data: topics } = useTopics();

  const topic = topics?.find((item) => item.id === topicId) || null;

  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
        <div className="w-full">
          <div className="flex flex-col gap-2 xl:items-center md:flex-row">
            <Input placeholder="Search" className="h-9 w-full max-w-sm" />
            <div className="flex gap-2 mb-2 md:mb-0">
              <IconCard
                active={activeView === "grid"}
                onClick={() => setActiveView("grid")}
                icon={<Columns3 className="h-full w-full" />}
              />
              <IconCard
                active={activeView === "table"}
                onClick={() => setActiveView("table")}
                icon={<Table className="h-full w-full" />}
              />
            </div>
            {/* {activeView === "table" && (
              <div className="flex flex-col md:flex-row gap-2 mr-2">
                <TopicFilterOption title="Category" />
                <TopicFilterOption title="Reviewers" />
                <TopicFilterOption title="Status" />
              </div>
            )} */}
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-start">
          <Button
            size="sm"
            variant="primary"
            className="gap-2 px-2 py-1"
            onClick={() => setCreatePaperOpen(true)}
          >
            <FilePlus className="size-[1em] text-lg" />
            <span className="text-xs">Submit Paper</span>
          </Button>
        </div>
      </div>
      {activeView === "grid" && allPapers && (
        <TopicPapersColumnView papers={allPapers} review={review} membership={membership} />
      )}
      {activeView === "table" && papers && (
        <TopicPapersTableView papers={papers} page={page} setPage={setPage} review={review} membership={membership} />
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
    </div>
  );
};

export default TopicPapers;
