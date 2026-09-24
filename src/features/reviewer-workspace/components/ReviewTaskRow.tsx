"use client";

import Link from "@/components/shared/Link";
import { count } from "../model/display";
import type { ReviewTaskRow as ReviewTaskRowData } from "../model/reviewTasks";

type ReviewTaskRowProps = {
  row: ReviewTaskRowData;
  href: string;
};

const ReviewTaskRow = ({ row, href }: ReviewTaskRowProps) => {
  const { task, progress } = row;
  const { cleared, clearedMembers } = progress;

  return (
    <Link
      href={href}
      data-task-id={task.id}
        cleared ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span title={task.paperId}>{task.paperLabel}</span>
            <span>{count(task.fieldCount, "field", "fields")}</span>
          </div>

            {task.title}
          </div>
          {task.sourceLine && (
              {task.sourceLine}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs lg:justify-end">
          <span
            title="Questions in this task; a decision covers the ones you check"
          >
            {count(task.questionCount, "question", "questions")}
          </span>
          {cleared ? (
            <span className="rounded-md bg-green-100 px-2 py-0.5 font-bold text-green-800">
              decided
            </span>
          ) : clearedMembers > 0 ? (
            <span title="Partial progress">
              {clearedMembers}/{task.unit.member_count} done
            </span>
          ) : (
          )}
        </div>
      </div>
    </Link>
  );
};

export default ReviewTaskRow;
