import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";
import {
  reviewerWorkspaceQueryKeys,
  useRunSnapshot,
} from "@/features/reviewer-workspace/hooks/useRunSnapshot";
import {
  buildDataWorkspaceFieldOptionGroups,
  type DataWorkspaceStatusFilter,
} from "@/features/reviewer-workspace/model/dataWorkspace";
import { reviewStateFor } from "@/features/reviewer-workspace/model/rowStatus";
    schemaSummaryQuery,
    demoConfigQuery,
  } = useRunSnapshot(topicId);

  const fieldGroups = useMemo(
    () =>
      buildDataWorkspaceFieldOptionGroups(
        schemaSummaryQuery.data?.fields ?? [],
        fieldGroups={fieldGroups}
        fieldFilter={fieldFilter}
        statusFilter={statusFilter}
        onFieldFilterChange={setFieldFilter}
        onStatusFilterChange={setStatusFilter}
  fieldGroups: DataWorkspaceFieldOptionGroup[];
  fieldFilter: string;
  statusFilter: DataWorkspaceStatusFilter;
  onFieldFilterChange: (field: string) => void;
  onStatusFilterChange: (status: DataWorkspaceStatusFilter) => void;
        More filters
        {(fieldFilter !== "all" || statusFilter !== "all") && (
            Filters applied
          </span>
        )}
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <label className="flex flex-col gap-1">
            value={fieldFilter}
            onChange={(event) => onFieldFilterChange(event.target.value)}
          >
            <option value="all">All populated fields</option>
            {fieldGroups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as DataWorkspaceStatusFilter)
            }
          >
              <option key={status} value={status}>
                {status === "all"
                  ? "All statuses"
                  : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
