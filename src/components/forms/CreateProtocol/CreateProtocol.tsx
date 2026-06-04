import { useState } from "react";
import CreateCustomProtocol from "./CreateCustomProtocol";
import CreateProtocolFromTemplate from "./CreateProtocolFromTemplate";
import SelectProtocolTemplate from "./SelectProtocolTemplate";

type CreateProtocolProps = {
  setDrawerOpen: (open: boolean) => void;
  topicId: string;
};

const CreateProtocol = ({ setDrawerOpen, topicId }: CreateProtocolProps) => {
  const [protocolOption, setProtocolOption] = useState("");
  const [selectProtocolOpen, setSelectProtocolOpen] = useState(true);

  if (selectProtocolOpen) {
    return (
      <SelectProtocolTemplate
        protocolOption={protocolOption}
        setProtocolOption={setProtocolOption}
        setSelectProtocolOpen={setSelectProtocolOpen}
        setDrawerOpen={setDrawerOpen}
      />
    );
  }

  if (protocolOption === "template") {
    return (
      <CreateProtocolFromTemplate
        setDrawerOpen={setDrawerOpen}
        topicId={topicId}
      />
    );
  }

  if (protocolOption === "custom") {
    return (
      <CreateCustomProtocol topicId={topicId} setDrawerOpen={setDrawerOpen} />
    );
  }

  return <div></div>;
};

export default CreateProtocol;
