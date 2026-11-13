// One paper's study tree (By variant / By outcome), shown inline under its row.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPaperRows } from "@/features/reviewer-workspace/data/snapshot";
import { useReviewState } from "@/features/reviewer-workspace/hooks/useReviewState";
import {
  reviewerWorkspaceQueryKeys,
  useRunSnapshot,
} from "@/features/reviewer-workspace/hooks/useRunSnapshot";
import {
  DATA_WORKSPACE_STATUS_FILTERS,
  buildDataWorkspaceFieldOptionGroups,
  type DataWorkspaceFieldOptionGroup,
  type DataWorkspaceStatusFilter,
} from "@/features/reviewer-workspace/model/dataWorkspace";
import type { TreeOrder } from "@/features/reviewer-workspace/model/drilldown/fieldMap";
import {
  buildPaperTree,
  matchedRowIndexes,
  type TreeNode,
} from "@/features/reviewer-workspace/model/drilldown/groupedFindings";
import { orderByHighlight } from "@/features/reviewer-workspace/model/drilldown/highlightOrder";
import {
  hiddenResultFields,
  hideUnhighlightedValues,
} from "@/features/reviewer-workspace/model/drilldown/textHighlight";
import { reviewStateFor } from "@/features/reviewer-workspace/model/rowStatus";
import type {
  PaperMeta,
  ProvSource,
  Row,
  RunLabels,
} from "@/features/reviewer-workspace/types";
import {
  parseSelectionParam,
  selectionParam,
  type TableState,
} from "@/features/reviewer-workspace/model/returnContext";
import CleanEvidence from "./drilldown/CleanEvidence";
import { CleanControls, CleanTree, PaperLine } from "./drilldown/CleanTree";
import RowDetail from "./drilldown/RowDetail";
import { selectionKey, type Selection } from "./drilldown/selection";
import useNarrow from "./drilldown/useNarrow";

export type PaperTreeState = Pick<TableState, "paper" | "q" | "field" | "status" | "sel">;

type PaperTreeProps = {
  topicId: string;
  paper: PaperMeta;
  labels: RunLabels;
  /** Show only findings in the schema selection; acts like a search (opens matching branches). */
  rowFilter?: (row: Row) => boolean;
  /** Seed/mirror for the URL restore: only the focused paper's tree state is carried. */
  initialState?: PaperTreeState;
  onStateChange?: (state: PaperTreeState) => void;
};

const NO_ACTIONS: Parameters<typeof reviewStateFor>[0] = [];

export default function PaperTree({ topicId, paper, labels, rowFilter, initialState: seed, onStateChange }: PaperTreeProps) {
  const paperId = paper.paper_id;
  const {
    runId,
    schemaSummaryQuery,
    demoConfigQuery,
  } = useRunSnapshot(topicId);
  const { actions: reviewActions } = useReviewState(topicId, runId);
  // useReviewState returns a fresh `[]` while the local store is loading;
  // pinning the empty case keeps memo identities (and expansion state) stable.
  const actions = reviewActions.length > 0 ? reviewActions : NO_ACTIONS;

  const focusedSeed = seed?.paper === paperId ? seed : undefined;
  const seededStatus = focusedSeed?.status ?? "all";
  const [query, setQuery] = useState(focusedSeed?.q ?? "");
  const [fieldFilter, setFieldFilter] = useState(focusedSeed?.field ?? "all");
  const [statusFilter, setStatusFilter] =
    useState<DataWorkspaceStatusFilter>(seededStatus);
  const [treeOrder, setTreeOrder] = useState<TreeOrder>("variant_first");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Selection | null>(() => {
    if (!focusedSeed) return null;
    const parsed = parseSelectionParam(focusedSeed.paper, focusedSeed.sel);
    return parsed
      ? { kind: "row", paperId: parsed.paperId, rowIndex: parsed.rowIndex, field: parsed.field }
      : null;
  });
  const [activeSource, setActiveSource] = useState<ProvSource | null>(null);

  const presentation = demoConfigQuery.data?.schema_presentation;

  const rowsQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.paperRows(runId ?? "unresolved", paperId),
    queryFn: () => fetchPaperRows(runId!, paperId),
    enabled: Boolean(runId),
  });
  // Only the findings and result values with a text highlight; the fetched rows stay untouched.
  const rows = useMemo(() => hideUnhighlightedValues(rowsQuery.data ?? []), [rowsQuery.data]);
  const rowsByIndex = useMemo(
    () => new Map(rows.map((row) => [row.row_index, row])),
    [rows]
  );
  const fetchedByIndex = useMemo(
    () => new Map((rowsQuery.data ?? []).map((row) => [row.row_index, row])),
    [rowsQuery.data]
  );
  const hiddenFieldsOf = (rowIndex: number) => {
    const fetched = fetchedByIndex.get(rowIndex);
    return fetched ? hiddenResultFields(fetched) : [];
  };
  // Once the rows are in, a selection of a finding or value the rule hides opens nothing.
  const selectionHidden =
    selection?.kind === "row" &&
    rowsQuery.data !== undefined &&
    (!rowsByIndex.has(selection.rowIndex) || hiddenFieldsOf(selection.rowIndex).includes(selection.field));
  const shownSelection = selectionHidden ? null : selection;
  useEffect(() => {
    if (selectionHidden) setSelection(null);
  }, [selectionHidden]);

  const fieldGroups = useMemo(
    () =>
      buildDataWorkspaceFieldOptionGroups(
        schemaSummaryQuery.data?.fields ?? [],
        presentation
      ),
    [presentation, schemaSummaryQuery.data?.fields]
  );

  // Built from every shown row of the paper; filters only hide nodes (see CleanTree).
  const tree = useMemo(
    () =>
      rows.length > 0
        ? orderByHighlight(buildPaperTree(labels, rows, presentation, treeOrder))
        : null,
    [labels, presentation, rows, treeOrder]
  );

  const matchedIndexes = useMemo(
    () =>
      matchedRowIndexes(labels, rowFilter ? rows.filter(rowFilter) : rows, { query, fieldFilter, statusFilter }, presentation, (rowIndex, field) =>
        reviewStateFor(actions, paperId, rowIndex, field)
      ),
    [actions, fieldFilter, labels, paperId, presentation, query, rowFilter, rows, statusFilter]
  );

  const filtersActive =
    query.trim().length > 0 || fieldFilter !== "all" || statusFilter !== "all" || Boolean(rowFilter);

  // Auto-expansion only reacts to a changed scope (order / filters),
  // never to a re-render, so manual expand/collapse is not fought over.
  // Switching By variant / By outcome is not a new scope unless a search is
  // active: the open levels carry over instead.
  const rowFilterKey = rowFilter ? "sel" : "";
  const autoKey = `${paperId}|study|${query.trim()}|${fieldFilter}|${statusFilter}|${rowFilterKey}|${filtersActive ? treeOrder : ""}`;
  const lastAutoKey = useRef<string>("");

  // Carry open levels across an order switch. Node keys are paths from the root
  // ("tree:<order>|field=value|…"); a level with the same path in the other order
  // (the cohort / regimen levels, which come first in both) stays open.
  const lastOrder = useRef<TreeOrder>(treeOrder);
  useEffect(() => {
    if (lastOrder.current === treeOrder) return;
    const from = `tree:${lastOrder.current}`;
    const to = `tree:${treeOrder}`;
    lastOrder.current = treeOrder;
    setExpandedRows(new Set());
    setSelection(null);
    setActiveSource(null);
    if (filtersActive) return;
    setExpandedGroups(
      (current) => new Set([...current].map((key) => (key.startsWith(from) ? to + key.slice(from.length) : key)))
    );
  }, [treeOrder, filtersActive]);
  useEffect(() => {
    if (lastAutoKey.current === autoKey) return;
    if (!tree) return;
    lastAutoKey.current = autoKey;
    const open = new Set<string>();
    const hasMatch = (node: TreeNode) => node.rows.some((row) => matchedIndexes.has(row.row_index));
    if (!query.trim()) {
      for (const child of tree.children) if (!filtersActive || hasMatch(child)) open.add(child.key);
    } else if (filtersActive && matchedIndexes.size <= 150) {
      // Open every branch that holds a match, down to its findings table.
      const walk = (node: TreeNode) => {
        for (const child of node.children) {
          if (!hasMatch(child)) continue;
          open.add(child.key);
          walk(child);
        }
      };
      walk(tree);
    } else if (filtersActive) {
      // Too many matches to open them all: open the path to the first matching findings table.
      let node: TreeNode | undefined = tree;
      while (node && node.children.length > 0) {
        node = node.children.find(hasMatch);
        if (node) open.add(node.key);
      }
    }
    setExpandedGroups(open);
  }, [autoKey, filtersActive, matchedIndexes, tree, query]);

  useEffect(() => {
    setActiveSource(null);
  }, [selectionKey(selection)]);

  const snapshotOf = () => ({
    paper: paperId,
    q: query,
    field: fieldFilter,
    status: statusFilter,
    sel:
      selection?.kind === "row" && selection.paperId === paperId
        ? selectionParam(selection)
        : "",
  });
  const lastEmitted = useRef<string>(JSON.stringify(snapshotOf()));
  useEffect(() => {
    if (!onStateChange) return;
    const snapshot = snapshotOf();
    const key = JSON.stringify(snapshot);
    if (lastEmitted.current === key) return;
    lastEmitted.current = key;
    onStateChange(snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps — mirror on user edits only; lastEmitted is a ref.
  }, [query, fieldFilter, statusFilter, selection, paperId, onStateChange]);

  const selectedKeyText = selectionKey(shownSelection);

  const toggleNode = (key: string) =>
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const toggleRow = (rowIndex: number) =>
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });

  const narrow = useNarrow();
  // Below 1400px the evidence card covers the tree, which stays mounted.
  const takeover = useNarrow("(max-width: 1399px)");
  const overlay = takeover && Boolean(shownSelection);
  const sideBySide = Boolean(shownSelection) && !takeover;
  useEffect(() => {
    if (!selection) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      setSelection(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection]);
  useEffect(() => {
    if (!overlay) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlay]);

  const queryActive = query.trim().length > 0;
  const filterOnly = fieldFilter !== "all" || statusFilter !== "all";

  return (
    <div className="px-3 pb-4 md:px-4">
      <div className="pt-3">
        <CleanControls
          query={query}
          onQueryChange={setQuery}
          order={treeOrder}
          onOrderChange={setTreeOrder}
        />
      </div>
      {rowsQuery.isLoading && <Skeleton className="mt-6 h-64 w-full" />}
      <PaperTreeMoreFilters
        fieldGroups={fieldGroups}
        fieldFilter={fieldFilter}
        statusFilter={statusFilter}
        onFieldFilterChange={setFieldFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <div
        className={`grid items-start gap-6 ${
          sideBySide
            ? "grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]"
            : ""
        }`}
      >
        <div className="min-w-0">
          <PaperLine
            paper={paper}
            rows={rows}
            presentation={presentation}
            labels={labels}
            query={query}
            selectedKey={selectedKeyText}
            onSelect={setSelection}
          />
          {rowsQuery.isError && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Could not load rows for the selected paper.
            </div>
          )}
          {tree && (
            <CleanTree
              paper={paper}
              tree={tree}
              order={treeOrder}
              expanded={expandedGroups}
              onToggle={toggleNode}
              matched={matchedIndexes}
              filtering={filtersActive}
              query={query}
              selectedKey={selectedKeyText}
              onSelect={setSelection}
              expandedRows={expandedRows}
              onToggleRow={toggleRow}
              presentation={presentation}
              labels={labels}
              narrow={narrow || sideBySide}
              renderDetail={(row: Row, node: TreeNode) => (
                <RowDetail
                  paper={paper}
                  row={row}
                  query={query}
                  selectedKey={selectedKeyText}
                  onSelect={setSelection}
                  groupVaryingCount={node.projection?.varyingCount ?? 0}
                  presentation={presentation}
                  labels={labels}
                  compact={narrow || sideBySide}
                  hiddenFields={hiddenFieldsOf(row.row_index)}
                />
              )}
            />
          )}
          {filtersActive && rowsQuery.isSuccess && matchedIndexes.size === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              {queryActive && filterOnly
                ? `No findings match “${query.trim()}” under the current filters.`
                : queryActive
                  ? `No findings match “${query.trim()}”.`
                  : filterOnly
                    ? `No findings match the current filters.`
                    : `No findings in this paper match the selection.`}
            </p>
          )}
        </div>
        {shownSelection && runId && (
          <aside
            className={
              overlay
                ? "fixed inset-0 z-40 overflow-y-auto bg-background px-4 pb-10 pt-2 md:px-6"
                : "sticky top-4 mt-3 min-w-0"
            }
          >
            <CleanEvidence
              runId={runId}
              paper={paper}
              selection={shownSelection}
              rowsByIndex={rowsByIndex}
              presentation={presentation}
              labels={labels}
              activeSource={activeSource}
              onSourceSelect={setActiveSource}
              onClose={() => setSelection(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

function PaperTreeMoreFilters({
  fieldGroups,
  fieldFilter,
  statusFilter,
  onFieldFilterChange,
  onStatusFilterChange,
}: {
  fieldGroups: DataWorkspaceFieldOptionGroup[];
  fieldFilter: string;
  statusFilter: DataWorkspaceStatusFilter;
  onFieldFilterChange: (field: string) => void;
  onStatusFilterChange: (status: DataWorkspaceStatusFilter) => void;
}) {
  return (
    <details className="mt-3 border-t pt-3">
      <summary className="cursor-pointer text-sm font-bold text-foreground">
        More filters
        {(fieldFilter !== "all" || statusFilter !== "all") && (
          <span className="ml-2 text-xs font-normal text-mc-ink-accent">
            Filters applied
          </span>
        )}
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">
            Field
          </span>
          <select
            className="h-10 rounded-md border border-mc-line-input bg-white px-3 text-sm"
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
          <span className="text-xs font-bold uppercase text-muted-foreground">
            Review status
          </span>
          <select
            className="h-10 rounded-md border border-mc-line-input bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as DataWorkspaceStatusFilter)
            }
          >
            {DATA_WORKSPACE_STATUS_FILTERS.map((status) => (
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
  );
}
