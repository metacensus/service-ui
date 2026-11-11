import { cn } from "@/lib/utils";
import { Card } from "../ui/card";

type IconCardProps = {
  icon: JSX.Element;
  active: boolean;
  onClick?: () => void;
  className?: string;
};

const IconCard = ({ icon, active, onClick, className }: IconCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "w-9 h-9 p-1.5 flex items-center justify-center cursor-pointer hover:bg-secondary",
        active && "bg-mc-fill-emphasis",
        className
      )}
    >
      {icon}
    </Card>
  );
};

export default IconCard;
