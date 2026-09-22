"use client";

import { useNavigate } from "@tanstack/react-router";
import DataWorkspace from "@/features/reviewer-workspace/components/data/DataWorkspace";
import ExploreWorkspace from "@/features/reviewer-workspace/components/explore/ExploreWorkspace";
import { cn } from "@/lib/utils";
import {
  writeLastDataMode,
  type DataMode,
} from "@/features/reviewer-workspace/model/dataMode";
} from "@/features/reviewer-workspace/model/returnContext";
import { useSearchParams } from "@/lib/next-navigation-compat";

const DataModeShell = ({
  topicId,
}: {
  topicId: string;
}) => {
  const navigate = useNavigate();
  const [tableMounted, setTableMounted] = useState(mode === "table");

  const setMode = (next: DataMode) => {
    if (next === "table") setTableMounted(true);
    void navigate({
      to: ".",
      replace: true,
    });
  };

  return (
    <div>
      <div
        role="group"
        aria-label="Data view"
      >
        {(["chat", "table"] as const).map((candidate) => {
          const isActive = mode === candidate;
          return (
            <button
              key={candidate}
              type="button"
              aria-pressed={isActive}
              onClick={() => setMode(candidate)}
              className={cn(
                "flex min-h-12 flex-1 items-center justify-center rounded-sm px-3 py-2 text-center text-xs font-bold transition-colors",
                isActive
              )}
            >
            </button>
          );
        })}
      </div>

      <div hidden={mode !== "chat"}>
        <ExploreWorkspace topicId={topicId} />
      </div>
      {tableMounted && (
        <div hidden={mode !== "table"}>
        </div>
      )}
    </div>
  );
};

export default DataModeShell;
