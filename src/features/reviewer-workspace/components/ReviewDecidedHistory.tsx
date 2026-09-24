"use client";

import { useState } from "react";
import Link from "@/components/shared/Link";
import type { DecidedTaskEntry, ReviewTaskRow } from "../model/reviewTasks";

type ReviewDecidedHistoryProps = {
  entries: DecidedTaskEntry[];
  taskHref: (row: ReviewTaskRow) => string;
};

const ReviewDecidedHistory = ({ entries, taskHref }: ReviewDecidedHistoryProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="decided-history" className="rounded-lg border bg-white">
      <button
        type="button"
        data-testid="decided-history-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
          {open ? "▾" : "▸"}
        </span>
        Decided history ({entries.length.toLocaleString("en-US")})
      </button>
      {open && (
        <ul
          data-testid="decided-history-list"
        >
          {entries.length === 0 && <li className="py-1">No tasks decided yet.</li>}
            <li key={row.task.id} className="py-1 [overflow-wrap:anywhere]">
              <Link
                href={taskHref(row)}
                data-task-id={row.task.id}
                className="hover:underline"
              >
                {row.task.paperLabel} · {row.task.title} →{" "}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewDecidedHistory;
