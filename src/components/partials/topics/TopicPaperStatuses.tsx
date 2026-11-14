import CreatePaper from "@/components/forms/CreatePaper/CreatePaper";
import { BulkImportPapers } from "@/components/forms/CreateProtocol/BulkImportPapers";
import MyDrawer from "@/components/shared/Drawer";
import IconButton from "@/components/shared/IconButton";
import TextBubble from "@/components/shared/TextBubble";
import { getPaperStatusCount } from "@/functions/getPaperStatusCount";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { useMemo, useState } from "react";
import { Paper } from "../../../../types/Paper";
import { Topic } from "../../../../types/Topic";
import { FilePlus, Layers } from "lucide-react";

type TopicPaperStatusesProps = {
  topicId: string;
};

const TopicPaperStatuses = ({ topicId }: TopicPaperStatusesProps) => {
  const [isBulkImportPaperDrawerOpen, setIsBulkImportPaperDrawerOpen] =
    useState(false);

  const [isSubmitSinglePaperDrawerOpen, setIsSubmitSinglePaperDrawerOpen] =
    useState(false);

  const page = 1;
  const limit = 30;
  const queryBody = { topicId, page, limit };
  const { data } = useFetchData<typeof queryBody, Paper[]>(
    routes.api.paper,
    [`topics-papers-status-${topicId}`],
    "POST",
    { topicId, page, limit }
  );

  const { data: topic } = useFetchData<undefined, Topic>(
    routes.api.topicById(topicId),
    [`topic-details-${topicId}`]
  );

  const papers = useMemo(() => {
    if (data) {
      return data as Paper[];
    }
    return [] as Paper[];
  }, [data]);

  return (
    <div className="flex flex-col">
      <div className="text-xs font-bold my-4">Paper Statuses</div>
      <div className="flex gap-2 flex-wrap">
        <TextBubble
          text={`${getPaperStatusCount(
            papers,
            "Pending Review"
          )} pending papers`}
          color="orange"
        />

        <TextBubble
          text={`${getPaperStatusCount(
            papers,
            "Being Reviewed"
          )} papers in review`}
          color="sky"
        />
        <TextBubble
          text={`${getPaperStatusCount(
            papers,
            "Pending Approval"
          )} papers pending approval`}
          color="indigo"
        />
        <TextBubble
          text={`${getPaperStatusCount(papers, "Accepted")} finished papers`}
          color="emerald"
        />
        <TextBubble
          text={`${getPaperStatusCount(papers, "Rejected")} rejected papers`}
          color="red"
        />
      </div>
      <div className="flex gap-2 flex-wrap mt-4">
        <IconButton
          icon={<Layers className="size-[1em]" />}
          text="Bulk Import"
          onClick={() => {
            setIsBulkImportPaperDrawerOpen(true);
          }}
          type="button"
        />
        <IconButton
          icon={<FilePlus className="size-[1em]" />}
          text="Single Submission"
          onClick={() => {
            setIsSubmitSinglePaperDrawerOpen(true);
          }}
          type="button"
        />
      </div>

      {isBulkImportPaperDrawerOpen && (
        <MyDrawer
          open={isBulkImportPaperDrawerOpen}
          setOpen={setIsBulkImportPaperDrawerOpen}
          title="Bulk Paper Submit"
        >
          <BulkImportPapers
            topicId={topicId}
            onSuccess={() => setIsBulkImportPaperDrawerOpen(false)}
          />
        </MyDrawer>
      )}
      {isSubmitSinglePaperDrawerOpen && (
        <MyDrawer
          open={isSubmitSinglePaperDrawerOpen}
          setOpen={setIsSubmitSinglePaperDrawerOpen}
          title={`Submit Paper to ${topic?.name}`}
        >
          <CreatePaper
            topicId={topicId}
            setDrawerOpen={setIsSubmitSinglePaperDrawerOpen}
          />
        </MyDrawer>
      )}
    </div>
  );
};

export default TopicPaperStatuses;
