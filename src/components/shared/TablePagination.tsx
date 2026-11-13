import { cn } from "@/lib/utils";

type TablePaginationProps = {
  incrementPage: (incrementCount?: number) => void;
  decrementPage: (decrementCount?: number) => void;
  className?: string;
};

const TablePagination = ({
  incrementPage,
  decrementPage,
  className,
}: TablePaginationProps) => {
  return (
    <div className={cn("flex gap-3", className)}>
      <div
        className="border border-mc-line-input rounded-lg cursor-pointer"
        onClick={() => decrementPage(1)}
      >
      </div>
      <div
        className="border border-mc-line-input rounded-lg cursor-pointer"
        onClick={() => incrementPage(1)}
      >
      </div>
    </div>
  );
};

export default TablePagination;
