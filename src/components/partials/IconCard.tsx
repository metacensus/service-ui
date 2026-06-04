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
        className
      )}
    >
      {icon}
    </Card>
  );
};

export default IconCard;
