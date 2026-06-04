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
        onClick={() => decrementPage(1)}
      >
      </div>
      <div
        onClick={() => incrementPage(1)}
      >
      </div>
    </div>
  );
};

export default TablePagination;
