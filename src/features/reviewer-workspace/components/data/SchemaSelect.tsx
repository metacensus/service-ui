// Data → Table selection: scope, group, category and item pickers over papers as rows; each row opens its study tree.

import { useId, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight, Info, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MembershipEditor, type MembershipEditorOutcome } from "@/features/reviewer-workspace/components/MembershipEditor";
import type { WorkingSetControls } from "@/features/reviewer-workspace/hooks/useWorkingSet";
import { demoLabel, orderFeatured } from "@/features/reviewer-workspace/model/drilldown/demoLabels";
import {
  batchSaveMessage,
  canSelectAll,
  canUnselectAll,
  clearWorkingSetCurrentLine,
  clearWorkingSetRequest,
  selectionConfirmLabel,
  selectionCurrentLine,
  selectionSubject,
  tickedListed,
  viewFilter,
  workingSetButton,
  workingSetViewLabel,
  type TableView,
} from "@/features/reviewer-workspace/model/workingSetControls";
import type { RunLabels } from "@/features/reviewer-workspace/types";
import {
  GROUPS,
  categoriesFor,
  hasItemLayer,
  itemLabel,
  termCount,
  type CategoryDef,
  type Combine,
  type Group,
  type LayerGroup,
  type PaperIndex,
  type SchemaIndex,
  type SelectionState,
  type SortMode,
  type Term,
  type TermColor,
} from "@/features/reviewer-workspace/model/schemaSelect";

export type SelectState = {
  scope: "all" | "one";
  scopePaper: string;
  group: Group;
  selection: SelectionState;
  combine: Combine;
  sort: SortMode;
  /** Papers whose study tree is open inline. */
  expanded: string[];
  /** Open trees show only findings in the selection, or the whole paper. */
  onlySelection: boolean;
};

export const INITIAL_SELECT_STATE: SelectState = {
  scope: "all",
  scopePaper: "",
  group: "Variants",
  selection: {},
  combine: "any",
  sort: "custom",
  expanded: [],
  onlySelection: true,
};

const ITEM_PREVIEW = 12;
const TEXT_BUTTON_CLASS =
  "text-sm font-medium text-muted-foreground underline-offset-2 enabled:hover:text-foreground enabled:hover:underline disabled:cursor-default disabled:text-mc-ink-secondary";

/* --------------------------------------------------------------- helpers */

export const paperName = (paper: PaperIndex) => {
  const m = /^(.*?)\s*\[\d+\]$/.exec(paper.title);
  return m ? m[1] : paper.title;
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  badge,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
  badge?: (value: T) => number;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-md bg-secondary p-1 text-sm">
      {options.map((option) => {
        const count = badge?.(option.value) ?? 0;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded px-3 font-medium transition-colors ${
              value === option.value ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
            {count > 0 && (
              <span className="rounded-full bg-mc-fill-solid px-1.5 text-[11px] font-semibold leading-4 text-mc-ink-on-fill">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A light "i" beside a control; hover or keyboard focus shows one sentence on what it does. Escape hides it. */
function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-1 w-64 -translate-x-1/2 rounded-md border bg-white px-3 py-2 text-xs leading-5 text-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

const INFO = {
  view: "Show every paper, or only the papers currently in your working set.",
  combine: "With two or more terms picked, Any shows papers matching at least one; All shows only papers matching every term.",
  findings: "When you expand a paper, show only the findings that match your selected terms, or all of that paper's findings.",
};

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-[11px] text-foreground">{n}</span>
      {children}
    </div>
  );
}

/** A selectable pill. Colored when it is itself a term (bubble color); dark outline when chosen but split into items. */
function Chip({
  label,
  count,
  chosen,
  color,
  onClick,
  title,
}: {
  label: string;
  count?: number;
  chosen: boolean;
  color?: TermColor;
  onClick: () => void;
  title?: string;
}) {
  const style = chosen && color ? { backgroundColor: color.soft, borderColor: color.dot, color: color.text } : undefined;
  return (
    <button
      type="button"
      aria-pressed={chosen}
      title={title}
      onClick={onClick}
      style={style}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        chosen
          ? color
            ? ""
            : "border-foreground bg-white text-foreground"
          : "bg-white text-foreground hover:border-mc-ink-secondary hover:bg-secondary/50"
      }`}
    >
      {chosen && color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color.dot }} />}
      {chosen && !color && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      <span className="min-w-0 truncate">{label}</span>
      {count !== undefined && <span className="shrink-0 text-xs tabular-nums opacity-60">{count}</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ page */

export default function SchemaSelect({
  index,
  labels,
  curated,
  state,
  setState,
  terms,
  colorOf,
  renderPaper,
  customOrder,
  workingSet,
}: {
  index: SchemaIndex;
  labels: RunLabels;
  curated: Map<string, string>;
  state: SelectState;
  setState: (update: (state: SelectState) => SelectState) => void;
  terms: Term[];
  colorOf: (term: Term) => TermColor;
  renderPaper: (paperId: string) => ReactNode;
  /** Featured paper ids: listed first, badged, and the custom sort; unlisted papers follow A–Z. */
  customOrder: string[];
  workingSet: WorkingSetControls;
}) {
  const allPapers = useMemo(() => orderFeatured(index.papers, customOrder), [index.papers, customOrder]);
  const badgeOf = (paperId: string) => (customOrder.includes(paperId) ? labels.featured_badge : undefined);
  // Ticks only select; the working set changes through the editor. A tick hidden by the filter is kept but ignored.
  const [ticked, setTicked] = useState<ReadonlySet<string>>(() => new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  // Filters rows only; the selection, combine and findings controls keep their meaning.
  const [view, setView] = useState<TableView>("all");
  const effectiveView: TableView = workingSet.status === "ready" ? view : "all";
  const scoped = state.scope === "one" ? allPapers.filter((paper) => paper.paper_id === state.scopePaper) : allPapers;
  const group = state.group;
  const layerGroup = group === "Paper" ? null : (group as LayerGroup);
  const categories = layerGroup ? categoriesFor(labels, layerGroup, scoped, curated) : [];
  const chosen = layerGroup ? state.selection[layerGroup] ?? {} : {};
  const tag = labels.tag_variant;
  const termByKey = new Map(terms.map((term) => [term.key, term]));

  const papersWith = (category: CategoryDef, item?: string) =>
    scoped.filter((paper) =>
      category.values.some((value) =>
        item === undefined
          ? (paper.categories[layerGroup!]?.[value] ?? 0) > 0
          : (paper.items[layerGroup!]?.[value]?.[item] ?? 0) > 0
      )
    ).length;

  const update = (fn: (selection: SelectionState) => SelectionState) =>
    setState((current) => ({ ...current, selection: fn(current.selection) }));

  const toggleCategory = (category: CategoryDef) =>
    update((selection) => {
      const current = { ...(selection[layerGroup!] ?? {}) };
      if (current[category.key]) delete current[category.key];
      else current[category.key] = [];
      return { ...selection, [layerGroup!]: current };
    });

  const toggled = (list: string[], id: string) => (list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]);
  const colorOfKey = (key: string) => {
    const term = termByKey.get(key);
    return term && colorOf(term);
  };
  const toggleItem = (categoryKey: string, item: string) =>
    update((selection) => {
      const current = { ...(selection[layerGroup!] ?? {}) };
      current[categoryKey] = toggled(current[categoryKey] ?? [], item);
      return { ...selection, [layerGroup!]: current };
    });

  const removeTerm = (term: Term) =>
    update((selection) => {
      if (term.group === "Paper") return { ...selection, Paper: (selection.Paper ?? []).filter((id) => id !== term.item) };
      const group = term.group as LayerGroup;
      const current = { ...(selection[group] ?? {}) };
      if (term.item === undefined) delete current[term.category.key];
      else current[term.category.key] = (current[term.category.key] ?? []).filter((entry) => entry !== term.item);
      return { ...selection, [group]: current };
    });

  /* results */
  const results = useMemo(() => {
    const scored = scoped
      .map((paper) => {
        const hits = terms.map((term) => ({ term, count: termCount(paper, term) })).filter((hit) => hit.count > 0);
        return { paper, hits, findings: hits.reduce((sum, hit) => sum + hit.count, 0) };
      })
      .filter((entry) =>
        terms.length === 0 ? true : state.combine === "all" ? entry.hits.length === terms.length : entry.hits.length > 0
      );
    const rank = new Map(customOrder.map((id, position) => [id, position]));
    const customRank = (id: string) => rank.get(id) ?? customOrder.length;
    const name = (entry: (typeof scored)[number]) => paperName(entry.paper).toLowerCase();
    const sorters: Record<SortMode, (a: (typeof scored)[number], b: (typeof scored)[number]) => number> = {
      matches: (a, b) => b.hits.length - a.hits.length || b.findings - a.findings || name(a).localeCompare(name(b)),
      custom: (a, b) =>
        customRank(a.paper.paper_id) - customRank(b.paper.paper_id) || name(a).localeCompare(name(b)),
      findings: (a, b) => b.findings - a.findings || b.paper.row_count - a.paper.row_count,
      az: (a, b) => name(a).localeCompare(name(b)),
    };
    const shown = viewFilter(scored, (entry) => entry.paper.paper_id, effectiveView, workingSet.active);
    return shown.sort(sorters[state.sort]); // stable: demo order breaks ties
  }, [customOrder, effectiveView, scoped, state.combine, state.sort, terms, workingSet.active]);

  const isOpen = new Set(state.expanded);
  const toggleOpen = (id: string) =>
    setState((current) => ({
      ...current,
      expanded: toggled(current.expanded, id),
    }));
  const resultIds = results.map((entry) => entry.paper.paper_id);
  const selectedIds = tickedListed(resultIds, ticked);
  const button = workingSetButton(selectedIds, workingSet.active);
  // aria-disabled, not disabled: focus returns here after a save that clears every tick.
  const actionDisabled = selectedIds.length === 0 || saving;
  const clearDisabled = workingSet.active.size === 0 || saving;
  const nameOf = new Map(results.map(({ paper }) => [paper.paper_id, paperName(paper)]));

  const setTicks = (ids: string[], on: boolean) =>
    setTicked((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  async function saveTicked(reason: string): Promise<MembershipEditorOutcome> {
    const ids = selectedIds;
    setSaving(true);
    const result = await workingSet.saveMemberships(ids, button.membership, reason);
    setSaving(false);
    if (!result.ok) return { ok: false, message: batchSaveMessage(result.error, result.saved, result.attempted) };
    setTicks(ids, false);
    setEditorOpen(false);
    return { ok: true };
  }

  async function clearWorkingSet(reason: string): Promise<MembershipEditorOutcome> {
    const request = clearWorkingSetRequest(workingSet.active, reason);
    setSaving(true);
    const result = await workingSet.saveMemberships(request.paperIds, request.membership, request.reason);
    setSaving(false);
    if (!result.ok) return { ok: false, message: batchSaveMessage(result.error, result.saved, result.attempted) };
    setClearOpen(false);
    return { ok: true };
  }

  return (
    <div className="pb-16">
      {/* scope */}
      <div className="flex flex-col gap-2 pt-5 md:flex-row md:items-center">
        <Segmented
          label="Scope"
          value={state.scope}
          options={[
            { value: "all", label: "All papers" },
            { value: "one", label: "One paper" },
          ]}
          onChange={(scope) =>
            setState((current) => ({ ...current, scope, scopePaper: current.scopePaper || allPapers[0]?.paper_id || "" }))
          }
        />
        {state.scope === "one" && (
          <select
            aria-label="Paper"
            className="h-10 min-w-0 rounded-md border border-mc-line-input bg-white px-3 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 md:max-w-md md:flex-1"
            value={state.scopePaper}
            onChange={(event) => setState((current) => ({ ...current, scopePaper: event.target.value }))}
          >
            {allPapers.map((paper) => (
              <option key={paper.paper_id} value={paper.paper_id}>
                {paperName(paper)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm md:p-5">
        {/* 1. group */}
        <StepLabel n={1}>Group</StepLabel>
        <Segmented
          label="Schema group"
          value={group}
          options={GROUPS.map((value) => ({ value, label: value }))}
          onChange={(value) => setState((current) => ({ ...current, group: value }))}
          badge={(value) => terms.filter((term) => term.group === value).length}
        />

        {/* 2. categories */}
        {layerGroup ? (
          <div className="mt-5">
            <StepLabel n={2}>Category</StepLabel>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const selected = Boolean(chosen[category.key]);
                const papers = papersWith(category);
                return (
                  <Chip
                    key={category.key}
                    label={category.label}
                    count={papers}
                    chosen={selected}
                    color={colorOfKey(`${layerGroup}|${category.key}`)}
                    title={`${papers} ${papers === 1 ? "paper" : "papers"} · stored as ${category.values.join(", ")}`}
                    onClick={() => toggleCategory(category)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <StepLabel n={2}>Papers</StepLabel>
            <PaperPicker
              papers={scoped}
              picked={state.selection.Paper ?? []}
              colorFor={(id) => colorOfKey(`Paper|${id}`)}
              onToggle={(id) => update((selection) => ({ ...selection, Paper: toggled(selection.Paper ?? [], id) }))}
              badgeOf={badgeOf}
            />
          </div>
        )}

        {/* 3. items, one panel per chosen category */}
        {layerGroup && hasItemLayer(layerGroup) &&
          categories
            .filter((category) => chosen[category.key])
            .map((category) => (
              <ItemPanel
                key={category.key}
                group={layerGroup}
                category={category}
                papers={scoped}
                corpus={allPapers}
                picked={chosen[category.key] ?? []}
                labels={labels}
                curated={curated}
                colorFor={(item) => colorOfKey(`${layerGroup}|${category.key}|${item}`)}
                onToggle={(item) => toggleItem(category.key, item)}
                tagOffer={
                  tag &&
                  layerGroup === "Variants" &&
                  category.key !== tag.category &&
                  (chosen[category.key] ?? []).some((item) => tag.offered_for.includes(item))
                    ? {
                        name: tag.name,
                        under: tag.values.map((value) => demoLabel(labels, "entity_locus_type", value) ?? value),
                        label: itemLabel(labels, "Variants", "tag", tag.item, curated),
                        papers: scoped.filter((paper) =>
                          Object.values(paper.items.Variants ?? {}).some((items) => (items[tag.item] ?? 0) > 0)
                        ).length,
                        included: (state.selection.Variants?.[tag.category] ?? []).includes(tag.item),
                        color: colorOfKey(`Variants|${tag.category}|${tag.item}`),
                        onToggle: () => toggleItem(tag.category, tag.item),
                      }
                    : undefined
                }
                onClear={() =>
                  update((selection) => ({
                    ...selection,
                    [layerGroup]: { ...(selection[layerGroup] ?? {}), [category.key]: [] },
                  }))
                }
              />
            ))}
      </div>

      {/* legend + result controls */}
      <div className="mt-6 flex flex-col gap-3">
        {terms.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {terms.map((term) => {
              const color = colorOf(term);
              return (
                <span
                  key={term.key}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pl-2.5 pr-1 text-sm font-medium"
                  style={{ backgroundColor: color.soft, borderColor: color.ring, color: color.text }}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color.dot }} />
                  <span className="min-w-0 truncate">
                    {term.item !== undefined ? term.label : `Any ${/^.[a-z]/.test(term.label) ? term.label.replace(/^./, (c) => c.toLowerCase()) : term.label}`}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${term.label}`}
                    onClick={() => removeTerm(term)}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full hover:bg-black/5"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => setState((current) => ({ ...current, selection: {} }))}
              className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <h2 className="text-lg font-semibold text-foreground">
              {results.length} {results.length === 1 ? "paper" : "papers"}
            </h2>
            {workingSet.status === "ready" && (
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <button
                  type="button"
                  disabled={!canSelectAll(resultIds, ticked)}
                  onClick={() => setTicks(resultIds, true)}
                  className={TEXT_BUTTON_CLASS}
                >
                  Select all
                </button>
                <button
                  type="button"
                  disabled={!canUnselectAll(resultIds, ticked)}
                  onClick={() => setTicks(resultIds, false)}
                  className={TEXT_BUTTON_CLASS}
                >
                  Unselect all
                </button>
              </div>
            )}
          </div>
          {workingSet.status === "ready" && (
            <div className="inline-flex items-center gap-1">
              <Segmented
                label="Papers shown"
                value={view}
                options={[
                  { value: "all", label: "All papers" },
                  { value: "workingSet", label: workingSetViewLabel(workingSet.active) },
                ]}
                onChange={setView}
              />
              <InfoTip label="Papers shown" text={INFO.view} />
            </div>
          )}
          {terms.length > 1 && (
            <div className="inline-flex items-center gap-1">
              <Segmented
                label="Combine selections"
                value={state.combine}
                options={[
                  { value: "any", label: "Any selected" },
                  { value: "all", label: "All selected" },
                ]}
                onChange={(combine) => setState((current) => ({ ...current, combine }))}
              />
              <InfoTip label="Combine selections" text={INFO.combine} />
            </div>
          )}
          {terms.length > 0 && (
            <div className="inline-flex items-center gap-1">
              <Segmented
                label="Findings shown in open papers"
                value={state.onlySelection ? "sel" : "all"}
                options={[
                  { value: "sel", label: "Only my selection" },
                  { value: "all", label: "Whole paper" },
                ]}
                onChange={(value) => setState((current) => ({ ...current, onlySelection: value === "sel" }))}
              />
              <InfoTip label="Findings shown in open papers" text={INFO.findings} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <select
              aria-label="Sort papers"
              value={state.sort}
              onChange={(event) => setState((current) => ({ ...current, sort: event.target.value as SortMode }))}
              className="h-9 rounded-md border border-mc-line-input bg-white px-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="custom">Sort: custom order</option>
              <option value="matches">Sort: most matches</option>
              <option value="findings">Sort: most matching findings</option>
              <option value="az">Sort: A–Z</option>
            </select>
            {workingSet.status === "ready" && (
              <MembershipEditor
                open={editorOpen}
                onOpenChange={(next) => {
                  if (!next || !actionDisabled) setEditorOpen(next);
                }}
                onConfirm={saveTicked}
                idBase="table"
                subject={selectionSubject(selectedIds.map((id) => nameOf.get(id) ?? id))}
                currentLine={selectionCurrentLine(
                  selectedIds,
                  workingSet.active,
                  selectedIds.length === 1 ? workingSet.members.get(selectedIds[0]) : undefined
                )}
                reasonRequired={false}
                confirmLabel={selectionConfirmLabel(button.membership)}
              >
                <button
                  type="button"
                  aria-disabled={actionDisabled}
                  className="h-9 rounded-md border border-mc-line-input bg-white px-3 text-sm font-medium text-foreground shadow-sm hover:bg-secondary/50 aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-white"
                >
                  {button.label}
                </button>
              </MembershipEditor>
            )}
            {workingSet.status === "ready" && (
              <MembershipEditor
                open={clearOpen}
                onOpenChange={(next) => {
                  if (!next || !clearDisabled) setClearOpen(next);
                }}
                onConfirm={clearWorkingSet}
                idBase="table-clear"
                subject="whole working set"
                currentLine={clearWorkingSetCurrentLine(workingSet.active)}
                reasonRequired={false}
                confirmLabel="Clear working set"
              >
                <button
                  type="button"
                  aria-disabled={clearDisabled}
                  className="h-9 rounded-md border border-mc-line-input bg-white px-3 text-sm font-medium text-mc-alert-ink shadow-sm hover:bg-mc-alert-fill aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-white"
                >
                  Clear working set
                </button>
              </MembershipEditor>
            )}
            {workingSet.status !== "loading" && (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
                {workingSet.status === "ready" ? `Working set ${workingSet.active.size}` : "Working set unavailable"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* results */}
      <div className="mt-3 overflow-hidden rounded-lg border bg-white shadow-sm">
        {results.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {effectiveView === "workingSet" && workingSet.active.size === 0
              ? "The working set is empty."
              : terms.length === 0
                ? "No papers in the working set."
                : `No ${effectiveView === "workingSet" ? "working-set " : ""}papers contain ${state.combine === "all" ? "all of" : "any of"} the selection.`}
          </p>
        )}
        {results.map(({ paper, hits, findings }) => (
          <div key={paper.paper_id} className="border-b last:border-b-0">
          <div className={`flex items-center gap-2 pl-2 md:pl-3 ${isOpen.has(paper.paper_id) ? "bg-secondary/50" : ""}`}>
            {workingSet.status === "ready" ? (
              <label className="grid h-10 w-8 shrink-0 cursor-pointer place-items-center">
                <input
                  type="checkbox"
                  checked={ticked.has(paper.paper_id)}
                  onChange={(event) => setTicks([paper.paper_id], event.target.checked)}
                  aria-label={`Select ${paperName(paper)}`}
                  className="h-4 w-4"
                />
              </label>
            ) : (
              <span className="grid h-10 w-8 shrink-0" aria-hidden />
            )}
            {workingSet.status === "ready" && <WorkingSetIcon inSet={workingSet.active.has(paper.paper_id)} />}
            <button
              type="button"
              aria-expanded={isOpen.has(paper.paper_id)}
              onClick={() => toggleOpen(paper.paper_id)}
              className="group flex min-w-0 flex-1 items-center gap-3 py-3 pr-3 text-left transition-colors hover:bg-secondary/50 md:pr-4"
            >
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="min-w-0 break-words text-[15px] font-semibold text-foreground">{paperName(paper)}</span>
                {hits.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1" aria-label="Contains">
                    {hits.map(({ term, count }) => (
                      <span
                        key={term.key}
                        title={`${term.label} · ${count} ${count === 1 ? "finding" : "findings"}`}
                        className="h-3.5 w-3.5 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: colorOf(term).dot }}
                      />
                    ))}
                  </span>
                )}
                {badgeOf(paper.paper_id) && (
                  <span className="rounded-md bg-mc-tint-purple-fill px-1.5 py-0.5 text-[11px] font-semibold text-mc-tint-purple-ink ring-1 ring-inset ring-mc-line-accent">
                    {badgeOf(paper.paper_id)}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {terms.length > 0 ? (
                  <>
                    <span className="font-semibold text-foreground">{findings}</span>
                    <span className="hidden sm:inline"> of {paper.row_count} findings</span>
                    <span className="sm:hidden">/{paper.row_count}</span>
                  </>
                ) : (
                  <>
                    {paper.row_count}
                    <span className="hidden sm:inline"> findings</span>
                  </>
                )}
              </span>
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground ${
                  isOpen.has(paper.paper_id) ? "rotate-90" : ""
                }`}
                aria-hidden
              />
            </button>
          </div>
          {isOpen.has(paper.paper_id) && (
            <div className="border-t bg-secondary/50">{renderPaper(paper.paper_id)}</div>
          )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shape and colour both differ: a filled disc is in, a hollow ring is out. */
function WorkingSetIcon({ inSet }: { inSet: boolean }) {
  const label = inSet ? "In working set" : "Not in working set";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`box-border h-3 w-3 shrink-0 rounded-full border-2 ${
        inSet ? "border-mc-fill-solid bg-mc-fill-solid" : "border-mc-alert-border bg-white"
      }`}
    />
  );
}

/* ------------------------------------------------------------ item panel */

function itemStats(papers: PaperIndex[], group: LayerGroup, values: string[]) {
  const byItem = new Map<string, { papers: number; findings: number }>();
  for (const paper of papers) {
    const seen = new Set<string>();
    for (const value of values) {
      for (const [item, count] of Object.entries(paper.items[group]?.[value] ?? {})) {
        const entry = byItem.get(item) ?? { papers: 0, findings: 0 };
        entry.findings += count;
        if (!seen.has(item)) entry.papers += 1;
        seen.add(item);
        byItem.set(item, entry);
      }
    }
  }
  return byItem;
}

function ItemPanel({
  group,
  category,
  papers,
  picked,
  labels,
  curated,
  colorFor,
  onToggle,
  onClear,
  tagOffer,
  corpus,
}: {
  group: LayerGroup;
  category: CategoryDef;
  papers: PaperIndex[];
  /** All papers: the single-paper rule counts papers corpus-wide, whatever the scope. */
  corpus: PaperIndex[];
  picked: string[];
  labels: RunLabels;
  curated: Map<string, string>;
  colorFor: (item: string) => TermColor | undefined;
  onToggle: (item: string) => void;
  onClear: () => void;
  tagOffer?: {
    name: string;
    /** Categories the tag's term matches under. */
    under: string[];
    label: string;
    papers: number;
    included: boolean;
    color?: TermColor;
    onToggle: () => void;
  };
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  // Items seen in only one paper are mostly normalization noise.
  const hideSingles = group === "Variants" && category.key === labels.single_paper_hidden_category;
  const corpusPapers = useMemo(
    () => (hideSingles ? itemStats(corpus, group, category.values) : new Map<string, { papers: number }>()),
    [category, corpus, group, hideSingles]
  );
  const allItems = useMemo(
    () =>
      [...itemStats(papers, group, category.values).entries()]
        .map(([id, counts]) => ({ id, label: itemLabel(labels, group, category.key, id, curated), ...counts }))
        .sort((a, b) => b.papers - a.papers || b.findings - a.findings || a.label.localeCompare(b.label)),
    [category, curated, group, labels, papers]
  );
  const items = hideSingles ? allItems.filter((item) => (corpusPapers.get(item.id)?.papers ?? 0) > 1) : allItems;

  const needle = query.trim().toLowerCase();
  const matching = needle
    ? items.filter((item) => item.label.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle))
    : items;
  const shown = needle || showAll ? matching : matching.slice(0, ITEM_PREVIEW);
  const pickedOutsidePreview = allItems.filter((item) => picked.includes(item.id) && !shown.includes(item));

  return (
    <div className="mt-4 rounded-md border bg-secondary/50 p-3">
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center">
        <StepLabel n={3}>
          <span className="normal-case tracking-normal text-foreground">{category.label}</span>
        </StepLabel>
        <span className="-mt-2 text-xs text-muted-foreground md:mt-[-0.5rem]">
          {picked.length === 0 ? (
            "Any item. Pick items to narrow."
          ) : (
            <button type="button" onClick={onClear} className="underline-offset-2 hover:text-foreground hover:underline">
              {picked.length} picked · back to any item
            </button>
          )}
        </span>
        {items.length > ITEM_PREVIEW && (
          <div className="relative md:-mt-2 md:ml-auto md:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              aria-label={`Search ${category.label}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
              placeholder={`Search ${items.length} items`}
              className="h-9 w-full rounded-md border border-mc-line-input bg-white pl-8 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {[...pickedOutsidePreview, ...shown].map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            count={item.papers}
            chosen={picked.includes(item.id)}
            color={colorFor(item.id)}
            title={`${item.papers} ${item.papers === 1 ? "paper" : "papers"}, ${item.findings} findings · stored as ${item.id}`}
            onClick={() => onToggle(item.id)}
          />
        ))}
        {matching.length === 0 && <span className="text-sm text-muted-foreground">No items match “{query.trim()}”.</span>}
      </div>
      {tagOffer && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-sm text-foreground">
          <span>Often typed by its {tagOffer.name} instead:</span>
          <Chip
            label={`${tagOffer.included ? "" : "+ "}${tagOffer.label}`}
            count={tagOffer.papers}
            chosen={tagOffer.included}
            color={tagOffer.color}
            title={`Adds the ${tagOffer.name} as its own selection, under ${tagOffer.under.join(" or ")}`}
            onClick={tagOffer.onToggle}
          />
        </div>
      )}
      {!needle && items.length > ITEM_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-2 text-sm font-medium text-mc-ink-accent hover:underline"
        >
          {showAll ? "Show the most frequent only" : `Show all ${items.length}`}
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- paper picker */

function PaperPicker({
  papers,
  picked,
  colorFor,
  onToggle,
  badgeOf,
}: {
  papers: PaperIndex[];
  picked: string[];
  colorFor: (paperId: string) => TermColor | undefined;
  onToggle: (paperId: string) => void;
  badgeOf: (paperId: string) => string | undefined;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = papers.filter(
    (paper) =>
      !needle ||
      [paper.title, paper.journal, paper.author, paper.year].some((part) => String(part ?? "").toLowerCase().includes(needle))
  );
  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-mc-line-input bg-white px-3 text-sm font-medium text-foreground shadow-sm hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring/20 md:w-96"
          >
            <span className={picked.length ? "" : "text-muted-foreground"}>
              {picked.length === 0 ? "Select papers" : `${picked.length} ${picked.length === 1 ? "paper" : "papers"} selected`}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] p-0">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                aria-label="Find papers"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Author, year or journal"
                className="h-9 w-full rounded-md border border-mc-line-input bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>
          <div role="listbox" aria-multiselectable className="max-h-80 overflow-y-auto py-1">
            {shown.map((paper) => {
              const on = picked.includes(paper.paper_id);
              const badge = badgeOf(paper.paper_id);
              const color = colorFor(paper.paper_id);
              return (
                <button
                  key={paper.paper_id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => onToggle(paper.paper_id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary/50"
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? "border-transparent text-white" : "border-mc-line-input"}`}
                    style={on ? { backgroundColor: color?.dot ?? "var(--mc-ink)" } : undefined}
                  >
                    {on && <Check className="h-3 w-3" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{paperName(paper)}</span>
                  {badge && <span className="shrink-0 text-[11px] font-semibold text-mc-ink-accent">{badge}</span>}
                </button>
              );
            })}
            {shown.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No papers match.</p>}
          </div>
        </PopoverContent>
      </Popover>
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {picked.map((id) => {
            const paper = papers.find((entry) => entry.paper_id === id);
            return (
              <Chip key={id} label={paper ? paperName(paper) : id} chosen color={colorFor(id)} onClick={() => onToggle(id)} title="Click to remove" />
            );
          })}
        </div>
      )}
    </div>
  );
}
