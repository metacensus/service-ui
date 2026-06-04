import { cn } from "@/lib/utils";
import React from "react";

type TextBubbleProps = {
  text: string;
  color: string;
  className?: string;
  iconEnd?: React.ReactNode;
  iconStart?: React.ReactNode;
};

const TextBubble = ({
  text,
  color,
  className,
  iconEnd,
  iconStart,
}: TextBubbleProps) => {
  return (
      className={cn(
        "px-2 py-1 rounded-md text-xs flex justify-center items-center",
        className
      )}
    >
      <span className="flex items-center justify-center gap-2 capitalize">
        {iconStart} {text} {iconEnd}
      </span>
  );
};

export default TextBubble;
