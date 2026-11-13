import { cn } from "@/lib/utils";

type IconButtonProps = {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  type: "button" | "submit" | "reset";
  className?: string;
};

const IconButton = ({
  icon,
  text,
  onClick,
  type,
  className,
}: IconButtonProps) => {
  return (
    <button
      className={cn(
        "py-2 h-full flex px-4 rounded-lg border border-mc-line-input bg-card text-card-foreground shadow-sm justify-center items-center gap-2 cursor-pointer w-fit text-sm hover:bg-secondary",
        className
      )}
      onClick={onClick}
      type={type}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};

export default IconButton;
