import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  subLabel?: string;
  onClick?: () => void;
}

const RadioInlineLabel = React.forwardRef<HTMLInputElement, InputProps>(
  (
    ref
  ) => {
    return (
      <div
        className={cn(
          className
        )}
        onClick={onClick ? onClick : () => {}}
      >
        <div className="flex flex-col">
        </div>
        <input
          type="radio"
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
RadioInlineLabel.displayName = "Radio";

export { RadioInlineLabel };
