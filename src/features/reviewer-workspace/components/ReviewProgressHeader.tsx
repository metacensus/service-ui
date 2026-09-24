"use client";

import { Card, CardContent } from "@/components/ui/card";
import { REVIEW_TASK_KINDS } from "../data/reviewIndex";

type ReviewProgressHeaderProps = {
  panel: ReviewPanelStats;
  onIncludeNonAmbiguous: (include: boolean) => void;
};

const ReviewProgressHeader = ({
  panel,
  onIncludeNonAmbiguous,
}: ReviewProgressHeaderProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
              {fmt(panel.made)}/{fmt(panel.total)}
            </span>{" "}
            review tasks decided
          </div>
          <div className="text-sm">
            {panel.allDecided ? (
              <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                {panel.includeNonAmbiguous
                  ? "All review tasks decided"
                  : "All ambiguous review tasks decided"}
              </span>
            ) : (
                {fmt(panel.remaining)}{" "}
                {panel.remaining === 1 ? "task" : "tasks"} remaining
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {REVIEW_TASK_KINDS.map((kind) => {
            const progress = panel.byKind[kind];
            const pct = progress.total
              ? Math.round((progress.made / progress.total) * 100)
              : 0;
            return (
              <div key={kind}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className={`font-bold ${accent.text}`}>
                    {REVIEW_TASK_KIND_HEADINGS[kind]}
                  </span>
                    {fmt(progress.made)}/{fmt(progress.total)}
                  </span>
                </div>
                  <div
                    className={`h-1.5 rounded-full ${accent.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

          <input
            type="checkbox"
            checked={panel.includeNonAmbiguous}
            onChange={(event) => onIncludeNonAmbiguous(event.target.checked)}
          />
          Include non-ambiguous extractions
        </label>
      </CardContent>
    </Card>
  );
};

export default ReviewProgressHeader;
