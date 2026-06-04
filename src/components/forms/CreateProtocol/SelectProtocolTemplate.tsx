import { Button } from "../../ui/button";
import { RadioInlineLabel } from "../../ui/radio-inline-label";

type SelectProtocolTemplateProps = {
  protocolOption: string;
  setProtocolOption: (protocolOption: string) => void;
  setSelectProtocolOpen: (open: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
};

const SelectProtocolTemplate = ({
  protocolOption,
  setProtocolOption,
  setSelectProtocolOpen,
  setDrawerOpen,
}: SelectProtocolTemplateProps) => {
  return (
    <div className="flex flex-col gap-6">
      <RadioInlineLabel
        type="radio"
        name="protocol template"
        label="Protocol Template"
        subLabel="Start with the basic protocol template which can be edited and updated"
        value="template"
        checked={protocolOption === "template"}
        onChange={(e) => setProtocolOption(e.target.value)}
        onClick={() => setProtocolOption("template")}
        className="cursor-pointer"
      />
      <RadioInlineLabel
        type="radio"
        name="custom protocol"
        label="Custom Protocol"
        subLabel="Start from scratch and build a custom protocol template"
        value="custom"
        checked={protocolOption === "custom"}
        onChange={(e) => setProtocolOption(e.target.value)}
        onClick={() => setProtocolOption("custom")}
        className="cursor-pointer"
      />
      <div className="flex gap-4">
        <Button
          variant="primary"
          onClick={() => setSelectProtocolOpen(false)}
          disabled={!protocolOption}
        >
          Start Protocol Creation
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setProtocolOption("");
            setDrawerOpen(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SelectProtocolTemplate;
