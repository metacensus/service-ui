"use client";

import { useId, useState } from "react";
import type { WorkingSetControls } from "../../hooks/useWorkingSet";
import { summaryLists, summaryText, workingSetCounts, type SummaryItem } from "../../model/membership";
import { MembershipBubble } from "./MembershipBubble";

function SummaryList({ heading, items, empty }: { heading: string; items: SummaryItem[]; empty: string }) {
  return (
    <div className="max-h-56 overflow-y-auto px-3 py-2">
      <h3 className="text-xs font-extrabold text-mc-ink-accent">{heading}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-1">
          {items.map((item) => (
            <li key={item.paperId} className="border-b py-1.5 text-xs last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground">{item.title}</span>
                <MembershipBubble paperId={item.paperId} title={item.title} />
              </div>
              {item.reason && <span className="mt-0.5 block text-[11px] text-foreground">Reason: “{item.reason}”</span>}
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
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Working set</span>
        {workingSet.status === "loading" && <span className="text-muted-foreground">Checking the working set…</span>}
        {workingSet.status === "error" && <span className="text-mc-alert-ink">Working set unavailable</span>}
        {set && (
          <>
            <span data-working-set-summary className="font-semibold text-foreground">
              {summaryText(workingSetCounts(set))}
            </span>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen((current) => !current)}
              className="text-xs font-bold text-mc-ink-accent underline decoration-mc-line-accent underline-offset-2 hover:decoration-mc-ink-accent focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {open ? "Hide papers" : "Show papers"}
            </button>
          </>
        )}
        <span role="status" aria-live="polite" className="text-xs text-mc-ink-accent">
          {status}
        </span>
      </div>
      {lists && (
        <div id={listId} className="mt-2 grid grid-cols-1 rounded-md border border-mc-line-accent bg-white sm:grid-cols-2 sm:divide-x sm:divide-border">
          <SummaryList heading={`Included (${lists.included.length})`} items={lists.included} empty="No papers are included." />
          <SummaryList heading={`Excluded (${lists.excluded.length})`} items={lists.excluded} empty="No papers are excluded." />
        </div>
      )}
    </div>
  );
}
