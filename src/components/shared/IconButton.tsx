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
