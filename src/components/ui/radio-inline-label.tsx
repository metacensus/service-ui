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
    { label, placeholder, className, type, subLabel, onClick, id, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div
        className={cn(
          "flex items-center h-fit w-full rounded-md border bg-background p-5 text-sm disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={onClick ? onClick : () => {}}
      >
        <div className="flex flex-col">
          {label && (
            <label className="mc-label" htmlFor={inputId}>
              {label}
            </label>
          )}
          {subLabel && (
            <label className="text-foreground" htmlFor={inputId}>
              {subLabel}
            </label>
          )}
        </div>
        <input
          id={inputId}
          className="ml-auto h-5 w-5"
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
