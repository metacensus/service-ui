"use client";

import { Button } from "@/components/ui/button";
import { RadioInlineLabel } from "@/components/ui/radio-inline-label";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { useMemo, useState } from "react";
import { Protocol } from "../../../../types/Protocol";
import CreateCustomProtocol from "./CreateCustomProtocol";

type CreateProtocolProps = {
  setDrawerOpen: (open: boolean) => void;
  topicId: string;
};

const CreateProtocolFromTemplate = ({
  setDrawerOpen,
  topicId,
}: CreateProtocolProps) => {
  const { data: protocolData } = useFetchData(
    routes.api.protocolTemplate,
    [`protocol-templates`],
    "POST",
    { ids: [] }
  );

  const protocols = useMemo(() => {
    if (protocolData) {
      return protocolData as Protocol[];
    }
    return null;
  }, [protocolData]);

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(
    null
  );

  const [openProtocol, setOpenProtocol] = useState(false);

  if (!openProtocol) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-bold">Select a Protocol Template</h1>
        {protocols?.map((protocol) => (
          <RadioInlineLabel
            key={protocol.id}
            type="radio"
            name={protocol.title}
            label={protocol.title}
            subLabel="Select this protocol template to start creating a new protocol"
            value={protocol.id}
            checked={selectedProtocol?.id === protocol.id}
            onChange={() => setSelectedProtocol(protocol)}
            onClick={() => setSelectedProtocol(protocol)}
            className="cursor-pointer"
          />
        ))}
        {selectedProtocol && (
          <Button
            variant="primary"
            className="w-fit"
            onClick={() => {
              setOpenProtocol(true);
            }}
          >
            Start Protocol Creation
          </Button>
        )}
      </div>
    );
  } else {
    return (
      <>
        {selectedProtocol && (
          <CreateCustomProtocol
            setDrawerOpen={setDrawerOpen}
            selectedProtocol={selectedProtocol}
            topicId={topicId}
          />
        )}
      </>
    );
  }
};

export default CreateProtocolFromTemplate;
