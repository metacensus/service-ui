import TextBubble from "@/components/shared/TextBubble";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { Topic } from "../../../../types/Topic";

type TopicDetailRowProps = {
  label: string;
  children: React.ReactNode;
};

const TopicDetailRow = ({ label, children }: TopicDetailRowProps) => {
  return (
    <>
      <div className="col-span-2 md:col-span-1 text-muted-foreground">{label}</div>
      <div className="col-span-4">{children}</div>
    </>
  );
};

type TopicDetailsCardProps = {
  topic: Topic;
};

const TopicDetailsCard = ({ topic }: TopicDetailsCardProps) => {
  return (
    <Card className="w-full my-6 p-6 md:p-12">
      <div>
        <h1 className={cn(styles.h4, "font-bold")}>Topic Details</h1>
      </div>
      <div className="grid grid-cols-5 mt-6 gap-6 text-sm">
        <TopicDetailRow label="Topic Name">{topic?.name}</TopicDetailRow>
        {topic?.created && (
          <TopicDetailRow label="Created">
            {new Date(topic?.created).toLocaleDateString()}
          </TopicDetailRow>
        )}

        <TopicDetailRow label="Topic Domain">
          {topic?.domain?.name}
        </TopicDetailRow>
        <TopicDetailRow label="Topic Categories">
          <div className="flex gap-2 flex-wrap">
            {topic?.topicCategories?.map((category: any) => (
              <TextBubble
                key={category.category.id}
                text={category?.category?.name}
                color="gray"
                className="w-fit"
              />
            ))}
          </div>
        </TopicDetailRow>
        <TopicDetailRow label="Meta Analysis Question">
          {topic?.question}
        </TopicDetailRow>
        <TopicDetailRow label="Topic Description">
          {topic?.description}
        </TopicDetailRow>
      </div>
    </Card>
  );
};

export default TopicDetailsCard;
