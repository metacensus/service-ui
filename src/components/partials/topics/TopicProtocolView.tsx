"use client";

import ProtocolForm from "@/components/forms/DataExtraction/ProtocolForm";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { Protocol } from "../../../../types/Protocol";

type TopicProtocolViewProps = {
  topicId: string;
};

const TopicProtocolView = ({ topicId }: TopicProtocolViewProps) => {
  const { data: protocol } = useFetchData<undefined, Protocol | null>(
    routes.api.topicProtocol(topicId),
    [`topic-protocol-${topicId}`]
  );

  return (
    <div className="w-full">
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="w-full">
          {protocol && (
            <ProtocolForm
              protocol={protocol}
              handleSubmit={() => {}}
              selection={null}
              resetSelection={() => {}}
              topicId={topicId}
              paperId={0}
              viewOnly={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicProtocolView;
