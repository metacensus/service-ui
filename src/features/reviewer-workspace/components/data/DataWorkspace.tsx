// Data → Table page: schema-first selection with study trees inline; page state round-trips through the URL.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSchemaIndex } from "@/features/reviewer-workspace/data/schemaIndex";
import {
  reviewerWorkspaceQueryKeys,
  useRunSnapshot,
} from "@/features/reviewer-workspace/hooks/useRunSnapshot";
import { useWorkingSet } from "@/features/reviewer-workspace/hooks/useWorkingSet";
import { fetchNormalizationManifest } from "@/features/reviewer-workspace/model/schemaNormalization";
import type { PaperMeta } from "@/features/reviewer-workspace/types";
import {
  type TableState,
} from "@/features/reviewer-workspace/model/returnContext";
import {
  categoriesFor,
  rowMatcher,
  selectionOfTermKeys,
  termsOf,
  TERM_COLORS,
  type LayerGroup,
  type Term,
  type TermColor,
} from "@/features/reviewer-workspace/model/schemaSelect";
import PaperTree, { type PaperTreeState } from "./PaperTree";
import SchemaSelect, {
  INITIAL_SELECT_STATE,
  paperName,
  type SelectState,
} from "./SchemaSelect";

type DataWorkspaceProps = {
  topicId: string;
  initialTable?: TableState;
  onTableStateChange?: (state: TableState) => void;
};

export default function DataWorkspace({ topicId, initialTable: seed, onTableStateChange }: DataWorkspaceProps) {
  const {
    runId,
    manifestQuery,
    demoConfigQuery,
  } = useRunSnapshot(topicId);

  const indexQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.schemaIndex(runId ?? "unresolved"),
    queryFn: () => fetchSchemaIndex(runId!),
    enabled: Boolean(runId),
  });
  const labelsQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.normalizationManifest(runId ?? "unresolved"),
    queryFn: () => fetchNormalizationManifest(runId!),
    enabled: Boolean(runId),
  });
  // field:id → curated label; the stored labels show when the run has no manifest.
  const curated = useMemo(
    () => new Map((labelsQuery.data?.groups ?? []).map((group) => [`${group.field}:${group.id}`, group.label])),
    [labelsQuery.data]
  );
  const workingSet = useWorkingSet(topicId, runId);

  const index = indexQuery.data;

  const [state, setState] = useState<SelectState>(() => {
    if (!seed) return INITIAL_SELECT_STATE;
    return {
      ...INITIAL_SELECT_STATE,
      scope: seed.scope ? "one" : "all",
      scopePaper: seed.scope || INITIAL_SELECT_STATE.scopePaper,
      group: seed.group,
      combine: seed.combine,
      sort: seed.sort,
      expanded: seed.open,
      onlySelection: seed.view !== "whole",
    };
  });

  // Stable colors: a term keeps its color while it stays selected; freed colors are reused.
  const colors = useRef(new Map<string, number>());

  // Apply the seeded `terms` once the index (and its catalog) arrives.
  // Limitation: after a restore the slots are dense, so a gap left by a
  // removed term closes up.
  const termsSeeded = useRef(false);
  useEffect(() => {
    if (!index || !seed || termsSeeded.current) return;
    termsSeeded.current = true;
    colors.current = new Map(seed.terms.map((key, slot) => [key, slot]));
    const paperIds = index.papers.map((paper) => paper.paper_id);
    const knownPapers = new Set(paperIds);
    setState((current) => {
      const open = current.expanded.filter((id) => knownPapers.has(id));
      const scopePaper =
        current.scope === "one" && knownPapers.has(current.scopePaper)
          ? current.scopePaper
          : INITIAL_SELECT_STATE.scopePaper;
      return {
        ...current,
        scope: current.scope === "one" && knownPapers.has(current.scopePaper) ? "one" : "all",
        scopePaper,
        expanded: open,
        selection: selectionOfTermKeys(
          seed.terms,
          paperIds
        ),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps — one-shot seed application.
  }, [index]);

  const [focus, setFocus] = useState<PaperTreeState | null>(() =>
    seed?.paper
      ? { paper: seed.paper, q: seed.q, field: seed.field, status: seed.status, sel: seed.sel }
      : null
  );

  const customOrder = useMemo(
  );

  const terms: Term[] = useMemo(() => {
    if (!index) return [];
    const names = new Map(index.papers.map((paper) => [paper.paper_id, paperName(paper)]));
    return termsOf(
      state.selection,
      curated,
      (id) => names.get(id) ?? id
    );

  const colorOf = useMemo(() => {
    const live = new Set(terms.map((term) => term.key));
    for (const key of [...colors.current.keys()]) if (!live.has(key)) colors.current.delete(key);
    for (const term of terms) {
      if (colors.current.has(term.key)) continue;
      const used = new Set(colors.current.values());
      let slot = 0;
      while (used.has(slot)) slot += 1;
      colors.current.set(term.key, slot);
    }
    return (term: Term): TermColor => TERM_COLORS[(colors.current.get(term.key) ?? 0) % TERM_COLORS.length];
  }, [terms]);

  // One matcher per paper (a Paper term matches every finding of its paper); cached so trees keep their state.
  const matchers = useMemo(() => new Map<string, ReturnType<typeof rowMatcher>>(), [index, state.combine, terms]);
  const matcherFor = (paperId: string) => {
    if (!index || terms.length === 0) return undefined;
    if (!matchers.has(paperId)) matchers.set(paperId, rowMatcher(terms, index, state.combine, paperId));
    return matchers.get(paperId);
  };

  const paperById = useMemo(() => {
    const map = new Map<string, PaperMeta>();
    for (const paper of manifestQuery.data?.papers ?? []) map.set(paper.paper_id, paper);
    return map;
  }, [manifestQuery.data]);

  useEffect(() => {
    if (focus && !state.expanded.includes(focus.paper)) setFocus(null);
  }, [focus, state.expanded]);

  const lastMirrored = useRef("");
  useEffect(() => {
    if (!onTableStateChange || !index) return;
    const slotOf = (key: string) => colors.current.get(key) ?? Number.MAX_SAFE_INTEGER;
    const snapshot: TableState = {
      terms: [...terms]
        .sort((a, b) => slotOf(a.key) - slotOf(b.key))
        .map((term) => term.key),
      open: state.expanded,
      scope: state.scope === "one" ? state.scopePaper : "",
      group: state.group,
      combine: state.combine,
      sort: state.sort,
      view: state.onlySelection ? "selection" : "whole",
      paper: focus?.paper ?? "",
      q: focus?.q ?? "",
      field: focus?.field ?? "all",
      status: focus?.status ?? "all",
      sel: focus?.sel ?? "",
    };
    const key = JSON.stringify(snapshot);
    if (lastMirrored.current === key) return;
    lastMirrored.current = key;
    onTableStateChange(snapshot);
  }, [onTableStateChange, index, state, focus, terms]);

  const runDataError = manifestQuery.isError;

  return (
    <div>
      <h1 className="mt-6 font-bold text-2xl">Extracted data</h1>

      {runDataError && (
          No extracted data is available for this topic yet.
        </div>
      )}

      {!runDataError && (indexPending || manifestQuery.isLoading) && (
        <Skeleton className="mt-6 h-64 w-full" />
      )}

      {!runDataError && indexQuery.isError && (
          Could not load the paper index for this run.
        </div>
      )}

        <SchemaSelect
          index={index}
          curated={curated}
          state={state}
          setState={setState}
          terms={terms}
          colorOf={colorOf}
          customOrder={customOrder}
          workingSet={workingSet}
          renderPaper={(paperId) => {
            const paper = paperById.get(paperId);
            if (!paper) return null;
            return (
              <PaperTree
                topicId={topicId}
                paper={paper}
                rowFilter={state.onlySelection ? matcherFor(paperId) : undefined}
                initialState={focus?.paper === paperId ? focus : undefined}
                onStateChange={setFocus}
              />
            );
          }}
        />
      )}
    </div>
  );
}

