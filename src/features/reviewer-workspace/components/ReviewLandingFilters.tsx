"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReviewLandingOption<T extends string = string> = {
  value: T;
  label: string;
};

type ReviewLandingFiltersProps = {
  paperOptions: ReviewLandingOption[];
  visibleCount: number;
  totalCount: number;
};

const STATUS_OPTIONS: ReviewLandingOption<ReviewLandingStatusFilter>[] = [
  { value: REVIEW_LANDING_ALL, label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "decided", label: "Decided" },
];

const ReviewLandingFilters = ({
  filters,
  paperOptions,
  visibleCount,
  totalCount,
  onChange,
}: ReviewLandingFiltersProps) => {
    onChange({ ...filters, ...patch });

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Select
              value={filters.paperId}
              onValueChange={(paperId) => update({ paperId })}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="All papers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={REVIEW_LANDING_ALL}>All papers</SelectItem>
                {paperOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.status}
              onValueChange={(status) =>
                update({ status: status as ReviewLandingStatusFilter })
              }
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default ReviewLandingFilters;
