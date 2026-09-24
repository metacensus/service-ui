// Data → Table selection: scope, group, category and item pickers over papers as rows; each row opens its study tree.

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MembershipEditor, type MembershipEditorOutcome } from "@/features/reviewer-workspace/components/MembershipEditor";
import type { WorkingSetControls } from "@/features/reviewer-workspace/hooks/useWorkingSet";
import {
  batchSaveMessage,
  canSelectAll,
  canUnselectAll,
  selectionConfirmLabel,
  selectionCurrentLine,
  selectionSubject,
  tickedListed,
  workingSetButton,
} from "@/features/reviewer-workspace/model/workingSetControls";
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
  group: "Variants",
  selection: {},
  combine: "any",
  sort: "custom",
  expanded: [],
  onlySelection: true,
};

const ITEM_PREVIEW = 12;
const TEXT_BUTTON_CLASS =

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
      {options.map((option) => {
        const count = badge?.(option.value) ?? 0;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded px-3 font-medium transition-colors ${
            }`}
          >
            {option.label}
            {count > 0 && (
            )}
          </button>
        );
      })}
    </div>
  );
}

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
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
  curated: Map<string, string>;
  state: SelectState;
  setState: (update: (state: SelectState) => SelectState) => void;
  terms: Term[];
  colorOf: (term: Term) => TermColor;
  renderPaper: (paperId: string) => ReactNode;
  customOrder: string[];
  workingSet: WorkingSetControls;
}) {
  // Ticks only select; the working set changes through the editor. A tick hidden by the filter is kept but ignored.
  const [ticked, setTicked] = useState<ReadonlySet<string>>(() => new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const scoped = state.scope === "one" ? allPapers.filter((paper) => paper.paper_id === state.scopePaper) : allPapers;
  const group = state.group;
  const layerGroup = group === "Paper" ? null : (group as LayerGroup);
  const chosen = layerGroup ? state.selection[layerGroup] ?? {} : {};
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

    setSaving(false);
    if (!result.ok) return { ok: false, message: batchSaveMessage(result.error, result.saved, result.attempted) };
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
        />
        {state.scope === "one" && (
          <select
            aria-label="Paper"
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
                curated={curated}
                colorFor={(item) => colorOfKey(`${layerGroup}|${category.key}|${item}`)}
                onToggle={(item) => toggleItem(category.key, item)}
                tagOffer={
                  layerGroup === "Variants" &&
                    ? {
                        papers: scoped.filter((paper) =>
                        ).length,
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
            >
              Clear
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
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
                options={[
                  { value: "all", label: "All papers" },
          {terms.length > 1 && (
              <Segmented
                label="Combine selections"
                value={state.combine}
                options={[
                  { value: "any", label: "Any selected" },
                  { value: "all", label: "All selected" },
                ]}
                onChange={(combine) => setState((current) => ({ ...current, combine }))}
              />
          )}
          {terms.length > 0 && (
              <Segmented
                label="Findings shown in open papers"
                value={state.onlySelection ? "sel" : "all"}
                options={[
                  { value: "sel", label: "Only my selection" },
                  { value: "all", label: "Whole paper" },
                ]}
                onChange={(value) => setState((current) => ({ ...current, onlySelection: value === "sel" }))}
              />
          )}
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <select
              aria-label="Sort papers"
              value={state.sort}
              onChange={(event) => setState((current) => ({ ...current, sort: event.target.value as SortMode }))}
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
                >
                  {button.label}
                </button>
              </MembershipEditor>
            )}
            {workingSet.status === "ready" && (
              <MembershipEditor
                </button>
              </MembershipEditor>
            )}
            {workingSet.status !== "loading" && (
                {workingSet.status === "ready" ? `Working set ${workingSet.active.size}` : "Working set unavailable"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* results */}
      <div className="mt-3 overflow-hidden rounded-lg border bg-white shadow-sm">
        {results.length === 0 && (
        )}
        {results.map(({ paper, hits, findings }) => (
            {workingSet.status === "ready" ? (
              <label className="grid h-10 w-8 shrink-0 cursor-pointer place-items-center">
                <input
                  type="checkbox"
                  checked={ticked.has(paper.paper_id)}
                  onChange={(event) => setTicks([paper.paper_id], event.target.checked)}
                  aria-label={`Select ${paperName(paper)}`}
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
            >
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
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
                  </span>
                )}
              </span>
                {terms.length > 0 ? (
                  <>
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
                  isOpen.has(paper.paper_id) ? "rotate-90" : ""
                }`}
                aria-hidden
              />
            </button>
          </div>
          {isOpen.has(paper.paper_id) && (
          )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkingSetIcon({ inSet }: { inSet: boolean }) {
  const label = inSet ? "In working set" : "Not in working set";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`box-border h-3 w-3 shrink-0 rounded-full border-2 ${
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
  curated: Map<string, string>;
  colorFor: (item: string) => TermColor | undefined;
  onToggle: (item: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const corpusPapers = useMemo(
    () => (hideSingles ? itemStats(corpus, group, category.values) : new Map<string, { papers: number }>()),
    [category, corpus, group, hideSingles]
  );
  const allItems = useMemo(
    () =>
      [...itemStats(papers, group, category.values).entries()]
        .sort((a, b) => b.papers - a.papers || b.findings - a.findings || a.label.localeCompare(b.label)),
  );
  const items = hideSingles ? allItems.filter((item) => (corpusPapers.get(item.id)?.papers ?? 0) > 1) : allItems;

  const needle = query.trim().toLowerCase();
  const matching = needle
    ? items.filter((item) => item.label.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle))
    : items;
  const shown = needle || showAll ? matching : matching.slice(0, ITEM_PREVIEW);
  const pickedOutsidePreview = allItems.filter((item) => picked.includes(item.id) && !shown.includes(item));

  return (
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center">
        <StepLabel n={3}>
        </StepLabel>
          {picked.length === 0 ? (
            "Any item. Pick items to narrow."
          ) : (
              {picked.length} picked · back to any item
            </button>
          )}
        </span>
        {items.length > ITEM_PREVIEW && (
          <div className="relative md:-mt-2 md:ml-auto md:w-64">
            <input
              aria-label={`Search ${category.label}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
              placeholder={`Search ${items.length} items`}
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
      </div>
      {tagOffer && (
          <Chip
            label={`${tagOffer.included ? "" : "+ "}${tagOffer.label}`}
            count={tagOffer.papers}
            chosen={tagOffer.included}
            color={tagOffer.color}
            onClick={tagOffer.onToggle}
          />
        </div>
      )}
      {!needle && items.length > ITEM_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
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
}: {
  papers: PaperIndex[];
  picked: string[];
  colorFor: (paperId: string) => TermColor | undefined;
  onToggle: (paperId: string) => void;
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
          >
              {picked.length === 0 ? "Select papers" : `${picked.length} ${picked.length === 1 ? "paper" : "papers"} selected`}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] p-0">
          <div className="border-b p-2">
            <div className="relative">
              <input
                aria-label="Find papers"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Author, year or journal"
              />
            </div>
          </div>
          <div role="listbox" aria-multiselectable className="max-h-80 overflow-y-auto py-1">
            {shown.map((paper) => {
              const on = picked.includes(paper.paper_id);
              const color = colorFor(paper.paper_id);
              return (
                <button
                  key={paper.paper_id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => onToggle(paper.paper_id)}
                >
                  <span
                  >
                    {on && <Check className="h-3 w-3" aria-hidden />}
                  </span>
                </button>
              );
            })}
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
