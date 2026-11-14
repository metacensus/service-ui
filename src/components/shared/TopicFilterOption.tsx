import { CirclePlus } from "lucide-react";

type TopicFilterOptionProps = {
  title: string;
};

const TopicFilterOption = ({ title }: TopicFilterOptionProps) => {
  return (
    <div className="py-1 h-full max-h-9 flex px-4 rounded-lg border border-mc-line-input bg-card text-card-foreground shadow-sm justify-center items-center gap-2 cursor-pointer max-w-sm">
      <CirclePlus className="size-[1em] text-lg" />
      <span>{title}</span>
    </div>
  );
};

export default TopicFilterOption;
