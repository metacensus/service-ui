"use client";

import { useId, useState } from "react";
import type { WorkingSetControls } from "../../hooks/useWorkingSet";
import { summaryLists, summaryText, workingSetCounts, type SummaryItem } from "../../model/membership";
import { MembershipBubble } from "./MembershipBubble";

function SummaryList({ heading, items, empty }: { heading: string; items: SummaryItem[]; empty: string }) {
  return (
    <div className="max-h-56 overflow-y-auto px-3 py-2">
      {items.length === 0 ? (
      ) : (
        <ul className="mt-1">
          {items.map((item) => (
              <div className="flex flex-wrap items-center gap-2">
                <MembershipBubble paperId={item.paperId} title={item.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "N / T papers included · X excluded" with the complete lists on demand. */
export function WorkingSetSummary({
  workingSet,
  titleFor,
  status,
}: {
  workingSet: WorkingSetControls;
  titleFor: (paperId: string) => string;
  /** The last confirmed save, announced politely. */
  status: string | null;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const set = workingSet.workingSet;
  const lists = set && open ? summaryLists(set, titleFor) : null;

  return (
    <div className="mt-4" data-membership-scope="summary">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {set && (
          <>
              {summaryText(workingSetCounts(set))}
            </span>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? "Hide papers" : "Show papers"}
            </button>
          </>
        )}
          {status}
        </span>
      </div>
      {lists && (
          <SummaryList heading={`Included (${lists.included.length})`} items={lists.included} empty="No papers are included." />
          <SummaryList heading={`Excluded (${lists.excluded.length})`} items={lists.excluded} empty="No papers are excluded." />
        </div>
      )}
    </div>
  );
}
