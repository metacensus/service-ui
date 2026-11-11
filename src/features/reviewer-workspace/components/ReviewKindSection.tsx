"use client";

import type {
  ReviewKindSection as ReviewKindSectionData,
  ReviewTaskRow as ReviewTaskRowData,
} from "../model/reviewTasks";
import { KIND_ACCENTS } from "../model/unitMeta";
import ReviewTaskRow from "./ReviewTaskRow";

type ReviewKindSectionProps = {
  section: ReviewKindSectionData;
  taskHref: (row: ReviewTaskRowData) => string;
  open: boolean;
  onOpen: (open: boolean) => void;
  confidentOpen: boolean;
  onConfidentOpen: (open: boolean) => void;
};

const ReviewKindSection = ({
  section,
  taskHref,
  open,
  onOpen,
  confidentOpen,
  onConfidentOpen,
}: ReviewKindSectionProps) => {
  const { kind, heading, ambiguous, confident } = section;
  if (ambiguous.length + confident.length === 0) return null;
  const accent = KIND_ACCENTS[kind];
  const row = (r: ReviewTaskRowData) => (
    <ReviewTaskRow key={r.task.id} row={r} href={taskHref(r)} />
  );

  return (
    <section
      aria-label={heading}
      className={`rounded-lg border border-l-4 ${accent.border} bg-white shadow-sm`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpen(!open)}
        className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xs text-muted-foreground">
            {open ? "▾" : "▸"}
          </span>
          <h2 className={`text-sm font-bold ${accent.text}`}>{heading}</h2>
        </span>
        <span className="text-xs text-muted-foreground">
          {section.decided.toLocaleString("en-US")}/
          {section.total.toLocaleString("en-US")} tasks decided
        </span>
      </button>
      {open && (
        <>
          {ambiguous.length > 0 && (
            <div className="divide-y border-t">{ambiguous.map(row)}</div>
          )}
          {confident.length > 0 && (
            <button
              type="button"
              aria-expanded={confidentOpen}
              onClick={() => onConfidentOpen(!confidentOpen)}
              className="flex w-full flex-wrap items-center justify-between gap-2 border-t bg-secondary/50 px-5 py-3 text-left transition-colors hover:bg-secondary"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span aria-hidden="true" className="text-xs text-muted-foreground">
                  {confidentOpen ? "▾" : "▸"}
                </span>
                Confident extractions ({confident.length.toLocaleString("en-US")})
              </span>
            </button>
          )}
          {confidentOpen && confident.length > 0 && (
            <div className="border-t bg-secondary/50">
              <div className="ml-6 divide-y border-l-2 border-border">
                {confident.map(row)}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ReviewKindSection;
