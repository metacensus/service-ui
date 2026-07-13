"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  reviewerWorkspaceQueryKeys,
  useRunSnapshot,
} from "@/features/reviewer-workspace/hooks/useRunSnapshot";
type DataWorkspaceProps = {
  topicId: string;
};

  const {
    runId,
    manifestQuery,
    demoConfigQuery,
  } = useRunSnapshot(topicId);
  });
  });



  return (
    <div>

      {runDataError && (
          No extracted data is available for this topic yet.
        </div>
      )}


            return (
              />
            );
        />
      )}
    </div>
  );
}
