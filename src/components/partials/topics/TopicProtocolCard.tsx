import CreateProtocol from "@/components/forms/CreateProtocol/CreateProtocol";
import EditProtocol from "@/components/forms/EditProtocol/EditProtocol";
import MyDrawer from "@/components/shared/Drawer";
import IconButton from "@/components/shared/IconButton";
import TextBubble from "@/components/shared/TextBubble";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { useState } from "react";
import { Protocol } from "../../../../types/Protocol";
import TopicProtocolView from "./TopicProtocolView";
import { Eye, Plus, SquarePen } from "lucide-react";

type ProtocolRowProps = {
  label: string;
  children: React.ReactNode;
};

const ProtocolRow = ({ label, children }: ProtocolRowProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold">{label}</div>
      <div>{children}</div>
    </div>
  );
};

type TopicAdministratorsProps = {
  protocol: Protocol;
  topicName: string;
  topicId: string;
};

const TopicProtocolCard = ({
  protocol,
  topicName,
  topicId,
}: TopicAdministratorsProps) => {
  const [createProtocolOpen, setCreateProtocolOpen] = useState(false);
  const [viewProtocolOpen, setViewProtocolOpen] = useState(false);
  const [editProtocolOpen, setEditProtocolOpen] = useState(false);

  return (
    <Card className="w-full p-6 md:p-12">
      <div>
        <h1 className={cn(styles.h4, "font-bold")}>Protocol</h1>
      </div>
      <div className="flex flex-col mt-6 gap-6 text-sm">
        {protocol?.protocolSections?.map((section) => (
          <ProtocolRow key={section.id} label={section.title}>
            <div className="flex gap-2 flex-wrap">
              {section.protocolElements.map((item) => (
                <TextBubble
                  key={item.id}
                  text={item.name || item.label || ""}
                  color="gray"
                  className="w-fit"
                />
              ))}
            </div>
          </ProtocolRow>
        ))}

        <div className="flex gap-2 flex-wrap">
          {protocol ? (
            <>
              <IconButton
                icon={<Eye className="size-[1em]" />}
                text="View Protocol"
                onClick={() => {
                  setViewProtocolOpen(true);
                }}
                type="button"
              />
              <IconButton
                icon={<SquarePen className="size-[1em]" />}
                text="Edit Protocol"
                onClick={() => {
                  setEditProtocolOpen(true);
                }}
                type="button"
              />
            </>
          ) : (
            <IconButton
              icon={<Plus className="size-[1em]" />}
              text="Create Protocol"
              onClick={() => {
                setCreateProtocolOpen(true);
              }}
              type="button"
            />
          )}
        </div>
      </div>
      {createProtocolOpen && (
        <MyDrawer
          open={createProtocolOpen}
          setOpen={setCreateProtocolOpen}
          title="Create Protocol"
          secondaryTitle={`for ${topicName}`}
        >
          <CreateProtocol
            topicId={topicId}
            setDrawerOpen={setCreateProtocolOpen}
          />
        </MyDrawer>
      )}
      {viewProtocolOpen && (
        <MyDrawer
          open={viewProtocolOpen}
          setOpen={setViewProtocolOpen}
          title="View Protocol"
          secondaryTitle={`for ${topicName}`}
        >
          <TopicProtocolView topicId={topicId} />
        </MyDrawer>
      )}
      {editProtocolOpen && protocol && (
        <MyDrawer
          open={editProtocolOpen}
          setOpen={setEditProtocolOpen}
          title="Edit Protocol"
          secondaryTitle={`for ${topicName}`}
        >
          <EditProtocol
            topicId={topicId}
            protocol={protocol}
            setDrawerOpen={() => setEditProtocolOpen(false)}
          />
        </MyDrawer>
      )}
    </Card>
  );
};

export default TopicProtocolCard;
