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
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-foreground"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          {open ? "▾" : "▸"}
        </span>
        Decided history ({entries.length.toLocaleString("en-US")})
      </button>
      {open && (
        <ul
          data-testid="decided-history-list"
          className="divide-y divide-border border-t px-4 py-2 text-xs text-foreground"
        >
          {entries.length === 0 && <li className="py-1">No tasks decided yet.</li>}
          {entries.map(({ row, action, seeded }) => (
            <li key={row.task.id} className="py-1 [overflow-wrap:anywhere]">
              <Link
                href={taskHref(row)}
                data-task-id={row.task.id}
                className="hover:underline"
              >
                {row.task.paperLabel} · {row.task.title} →{" "}
                <strong className="font-bold text-foreground">{action}</strong>
                {seeded && <span className="text-muted-foreground"> (simulated seed)</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewDecidedHistory;
