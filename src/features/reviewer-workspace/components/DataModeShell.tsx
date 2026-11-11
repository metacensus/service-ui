"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import DataWorkspace from "@/features/reviewer-workspace/components/data/DataWorkspace";
import ExploreWorkspace from "@/features/reviewer-workspace/components/explore/ExploreWorkspace";
import { cn } from "@/lib/utils";
import {
  DATA_MODE_LABEL,
  writeLastDataMode,
  type DataMode,
} from "@/features/reviewer-workspace/model/dataMode";
import {
  TABLE_STATE_PARAMS,
  hasTableState,
  parseTableState,
  tableStateParams,
  type TableState,
} from "@/features/reviewer-workspace/model/returnContext";
import { useSearchParams } from "@/lib/next-navigation-compat";

/** Merged Data destination: one Chat/Table toggle over the two existing workspaces. */
const DataModeShell = ({
  topicId,
  mode,
}: {
  topicId: string;
  mode: DataMode;
}) => {
  const navigate = useNavigate();
  const searchParams = useSearchParams();

  const [tableMounted, setTableMounted] = useState(mode === "table");
  useEffect(() => {
    if (mode === "table") setTableMounted(true);
  }, [mode]);

  const [seed] = useState<TableState | null>(() => {
    if (mode !== "table") return null;
    const snapshot = parseTableState(searchParams);
    return hasTableState(snapshot) ? snapshot : null;
  });
  const [seedPending, setSeedPending] = useState(seed !== null);
  useEffect(() => {
    if (!seedPending) return;
    setSeedPending(false);
    // Replace the table params away: the seeded workspace now owns the state
    // (and keeps mirroring it below), so the URL stays shareable without
    // re-applying a stale snapshot on the next remount.
    void navigate({
      to: ".",
      search: { mode: "table" },
      replace: true,
      // Search-param-only update: keep the reader's scroll position.
      resetScroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps — one-shot seed consumption.
  }, [seedPending]);

  const setMode = (next: DataMode) => {
    if (next === "table") setTableMounted(true);
    writeLastDataMode(localStorage, next);
    // Replace: toggle flips are not history.
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, mode: next }),
      replace: true,
      // Search-param-only update: keep the reader's scroll position.
      resetScroll: false,
    });
  };

  const [tableState, setTableState] = useState<TableState | null>(null);
  const tableSearch = tableState
    ? new URLSearchParams(tableStateParams(tableState)).toString()
    : null;
  useEffect(() => {
    if (mode !== "table" || !tableMounted || seedPending || tableSearch === null)
      return;
    const params = Object.fromEntries(new URLSearchParams(tableSearch));
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...prev, mode: "table" };
        for (const key of TABLE_STATE_PARAMS) delete next[key];
        return { ...next, ...params };
      },
      replace: true,
      // Search-param-only update: keep the reader's scroll position.
      resetScroll: false,
    });
  }, [mode, tableMounted, seedPending, tableSearch, navigate]);

  return (
    <div>
      <div
        role="group"
        aria-label="Data view"
        className="mt-6 flex w-full flex-col gap-1 rounded-md bg-secondary p-1 sm:flex-row"
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
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-mc-ink-accent"
              )}
            >
              {DATA_MODE_LABEL[candidate]}
            </button>
          );
        })}
      </div>

      {/* `hidden`, not unmounted: each workspace keeps its own useState. */}
      <div hidden={mode !== "chat"}>
        <ExploreWorkspace topicId={topicId} />
      </div>
      {tableMounted && (
        <div hidden={mode !== "table"}>
          <DataWorkspace
            topicId={topicId}
            initialTable={seed ?? undefined}
            onTableStateChange={setTableState}
          />
        </div>
      )}
    </div>
  );
};

export default DataModeShell;
