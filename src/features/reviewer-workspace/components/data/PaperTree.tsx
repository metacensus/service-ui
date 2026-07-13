import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";
import {
  reviewerWorkspaceQueryKeys,
  useRunSnapshot,
} from "@/features/reviewer-workspace/hooks/useRunSnapshot";
import {
  type DataWorkspaceStatusFilter,
} from "@/features/reviewer-workspace/model/dataWorkspace";
    schemaSummaryQuery,
    demoConfigQuery,
  } = useRunSnapshot(topicId);

    () =>
        fieldFilter={fieldFilter}
        statusFilter={statusFilter}
        onFieldFilterChange={setFieldFilter}
        onStatusFilterChange={setStatusFilter}
  fieldFilter: string;
  statusFilter: DataWorkspaceStatusFilter;
  onFieldFilterChange: (field: string) => void;
  onStatusFilterChange: (status: DataWorkspaceStatusFilter) => void;
        <label className="flex flex-col gap-1">
            value={fieldFilter}
            onChange={(event) => onFieldFilterChange(event.target.value)}
          >
            <option value="all">All populated fields</option>
                  </option>
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
