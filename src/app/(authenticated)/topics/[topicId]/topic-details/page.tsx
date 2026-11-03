"use client";

import TopicAdministrators from "@/components/partials/topics/TopicAdministrators";
import TopicDetailsCard from "@/components/partials/topics/TopicDetailsCard";
import TopicProtocolCard from "@/components/partials/topics/TopicProtocolCard";
import AsyncSection from "@/components/shared/AsyncSection";
import { Card } from "@/components/ui/card";
import { useFetchData } from "@/hooks/useFetchData";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { useMemo } from "react";
import { Contributor } from "../../../../../../types/Contributor";
import { Protocol } from "../../../../../../types/Protocol";
import { Topic } from "../../../../../../types/Topic";
import { routes } from "@/lib/routes";

interface Props {
  params: { topicId: string };
}

const TopicDetails = ({ params }: Props) => {
  const { topicId: topicIdEncoded } = params;
  const topicId = topicIdEncoded; // TanStack Router already decodes path params

  const topicQuery = useFetchData<undefined, Topic>(
    `${routes.api.topic}/${topicId}`,
    [`topic-details-${topicId}`]
  );

  const topic = topicQuery.data || null;

  const administrators = useMemo(() => {
    if (topic && topic.topicAdmins) {
      return topic.topicAdmins?.map((admin) => admin.admin);
    }
    return [] as Contributor[];
  }, [topic]);

  const protocol = useMemo(() => {
    // if (topic) {
    //   return topic.protocol;
    // }
    return {} as Protocol;
  }, []);

  return (
    <div className="flex flex-col">
      <AsyncSection
        query={topicQuery}
        isEmpty={(topic) => !topic}
        empty={null}
        loading={<div>Loading...</div>}
        error={<div>Error: {topicQuery.error?.message}</div>}
      >
        {(topic) => <TopicDetailsCard topic={topic} />}
      </AsyncSection>
      <div className="flex flex-col xl:flex-row xl:gap-6">
        {topic && (
          <TopicProtocolCard
            protocol={protocol}
            topicName={topic?.name || ""}
            topicId={topic.id!}
          />
        )}

        <Card className="w-full mt-6 xl:mt-0 p-6 md:p-12">
          <div>
            <h1 className={cn(styles.h4, "font-bold")}>Administrators</h1>
          </div>
          <TopicAdministrators administrators={administrators} />
          {/* <div className="flex gap-2 flex-wrap pt-6">
            <IconButton
              icon={<MdOutlinePersonAddAlt1 />}
              text="Add Admin"
              onClick={() => {}}
              type="button"
            />
          </div> */}
        </Card>
      </div>
    </div>
  );
};

export default TopicDetails;
