//icon is a JSX element, so we can use it directly in the component

import { cn } from "@/lib/utils";
import { Card } from "../ui/card";

// count is a number, so we need to convert it to a string before using it in the component
type CardIndicatorsProps = {
  icon: JSX.Element;
  count: number;
  className?: string;
  name?: string;
  textSize?: string;
};

const CardIndicators = ({
  icon,
  count,
  className,
  name,
  textSize = "text-xs",
}: CardIndicatorsProps) => {
  return (
    <Card
      className={cn(
        className,
        count === 0 && name !== "reviewers" && "opacity-50"
      )}
    >
      {icon}
      <span className={cn(textSize)}>{count}</span>
    </Card>
  );
};

export default CardIndicators;
