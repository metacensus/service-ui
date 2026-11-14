// Clean study tree, ruthlessly simplified. One line per
// node — value and count. Findings are plain rows: what they are, then the
// result. Values are clickable: normalized → printed forms → evidence. No
// explanatory text, no status or evidence columns, no field names on screen
// (they stay in tooltips and in "All extracted fields").

import { useState, type CSSProperties, type ReactNode } from "react";
import { ChevronRight, Pill, Users } from "lucide-react";
import type { PaperMeta, Row, RunLabels, SchemaPresentation } from "@/features/reviewer-workspace/types";
import type { Selection } from "./selection";
import { prettyValue } from "@/features/reviewer-workspace/model/drilldown/displayLabel";
import { PLACEHOLDER_VALUES, type TreeOrder } from "@/features/reviewer-workspace/model/drilldown/fieldMap";
import {
  displayText,
  fieldLabel,
  isNormalizedField,
  isPopulated,
  printedFormsFor,
  type SharedChip,
  type TreeNode,
} from "@/features/reviewer-workspace/model/drilldown/groupedFindings";
import { Highlight } from "./parts";

type Select = (selection: Selection) => void;

/** Context shown as tags on an open node, most decisive first; everything else lives in "All extracted fields". */
const CONTEXT_FIELDS = [
  "grade_threshold_id",
  "grading_scale_id",
  "time_window_id",
  "adjustment_status",
  "fp_exposure_id",
  "analysis_population_raw",
  "entity_locus_type",
  "outcome_category",
  "comparison_group_raw",
  "reference_group_raw",
];

/** "Who" levels say what they are: a cohort label alone reads like any other text. */
const LEVEL_KIND: Record<string, { word: string; icon: typeof Users }> = {
  analysis_population_raw: { word: "Cohort", icon: Users },
  fp_exposure_id: { word: "Regimen", icon: Pill },
};

/** Columns a findings table may add when they differ between its rows. */
const EXTRA_COLUMN_FIELDS = [
  "comparison_group_raw",
  "grade_threshold_id",
  "time_window_id",
  "reference_group_raw",
  "grading_scale_id",
  "adjustment_status",
  "fp_exposure_id",
  "analysis_population_raw",
];

const keyOf = (paperId: string, selection: Selection) =>
  selection.kind === "row"
    ? `row::${paperId}::${selection.rowIndex}::${selection.field}`
    : `shared::${paperId}::${selection.scopeLabel}::${selection.field}`;

/* ---------------------------------------------------------------- values */

/** A value you can click. Normalized values unfold their printed forms; anything else opens evidence. */
function Value({
  paperId,
  rows,
  field,
  text,
  scopeLabel,
  presentation,
  labels,
  query,
  selectedKey,
  onSelect,
  className = "",
  tight = false,
}: {
  paperId: string;
  rows: Row[];
  field: string;
  text?: string;
  scopeLabel: string;
  presentation?: SchemaPresentation;
  labels: RunLabels;
  query: string;
  selectedKey: string;
  onSelect: Select;
  className?: string;
  /** Numbers inside a result line: a narrower box, so "(0.92–1.9)" stays one unit. */
  tight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchor = rows[0];
  if (!anchor) return null;
  const shown = text ?? prettyValue(labels, displayText(anchor, field), field, anchor.fields[field]);
  const selectionFor = (target: string, indexes: number[], label: string): Selection =>
    indexes.length === 1
      ? { kind: "row", paperId, rowIndex: indexes[0], field: target }
      : { kind: "shared", paperId, field: target, scopeLabel: label, rowIndexes: indexes };
  // Same box as ValueButton in parts.tsx.
  const base = `rounded-sm border ${tight ? "px-px" : "px-1"} text-left ${className}`;
  const idle = "border-transparent hover:border-mc-line-accent hover:bg-secondary";

  const normalized = isNormalizedField(field, presentation) && isPopulated(anchor, field);
  if (!normalized) {
    const selection = selectionFor(field, rows.map((row) => row.row_index), scopeLabel);
    const selected = selectedKey === keyOf(paperId, selection);
    return (
      <button
        type="button"
        title={shown === displayText(anchor, field) ? `${fieldLabel(labels, field)} · ${field}` : `${fieldLabel(labels, field)} · stored as ${displayText(anchor, field)}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(selection);
        }}
        className={`${base} ${selected ? "border-mc-line-accent bg-mc-fill-emphasis text-mc-ink-accent" : idle}`}
      >
        <Highlight text={shown} query={query} />
      </button>
    );
  }

  const { forms } = printedFormsFor(rows, field, presentation);
  return (
    <span className="inline-flex min-w-0 flex-col items-start">
      <button
        type="button"
        title={`${fieldLabel(labels, field)} · ${displayText(anchor, field)} — click for the paper's wording`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`${base} ${open ? "border-mc-line-accent bg-secondary" : idle}`}
      >
        <Highlight text={shown} query={query} />
      </button>
      {open && (
        <span className="mt-1 flex flex-col items-start gap-0.5 border-l-2 border-mc-line-accent pl-2">
          {forms.map((form) => {
            const selection = selectionFor(
              presentation?.reported_value_fields?.[field] ?? field,
              form.rowIndexes,
              `${scopeLabel} · printed as “${form.text}”`
            );
            const selected = selectedKey === keyOf(paperId, selection);
            return (
              <button
                key={form.text}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(selection);
                }}
                className={`rounded-sm border border-mc-line-accent px-1 py-0.5 text-left text-xs font-normal text-mc-ink-accent ${
                  selected
                    ? "bg-mc-fill-emphasis"
                    : "bg-secondary hover:bg-mc-fill-emphasis"
                }`}
              >
                “{form.text}”
              </button>
            );
          })}
          {forms.length === 0 && (
            <span className="text-xs font-normal italic text-muted-foreground">not printed in the paper</span>
          )}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------ paper line */

export function PaperLine({
  paper,
  rows,
  presentation,
  labels,
  query,
  selectedKey,
  onSelect,
}: {
  paper: PaperMeta;
  rows: Row[];
  presentation?: SchemaPresentation;
  labels: RunLabels;
  query: string;
  selectedKey: string;
  onSelect: Select;
}) {
  const constant = (field: string) =>
    rows.length > 0 &&
    isPopulated(rows[0], field) &&
    rows.every((row) => displayText(row, field) === displayText(rows[0], field));
  const facts = ["study_design_id", "fp_exposure_id", "total_n", "analysis_population_raw"].filter(constant);
  return (
    <div className="mt-3">
      {facts.length > 0 && (
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-foreground">
          {facts.map((field, index) => (
            <span key={field} className="inline-flex items-baseline gap-2">
              {index > 0 && <span className="text-mc-ink-secondary">·</span>}
              {field === "total_n" && <span className="text-muted-foreground">Total N</span>}
              <Value
                paperId={paper.paper_id}
                rows={rows}
                field={field}
                scopeLabel="paper"
                presentation={presentation}
                labels={labels}
                query={query}
                selectedKey={selectedKey}
                onSelect={onSelect}
              />
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ tree */

type Shared = {
  paper: PaperMeta;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  matched: Set<number>;
  filtering: boolean;
  query: string;
  selectedKey: string;
  onSelect: Select;
  expandedRows: Set<number>;
  onToggleRow: (rowIndex: number) => void;
  renderDetail: (row: Row, node: TreeNode) => ReactNode;
  presentation?: SchemaPresentation;
  labels: RunLabels;
  narrow: boolean;
};

export function CleanTree({ tree, ...props }: Shared & { tree: TreeNode; order: TreeOrder }) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border bg-white shadow-sm">
      {tree.projection ? <Table node={tree} {...props} /> : <Children node={tree} {...props} />}
    </div>
  );
}

function Children({ node, ...props }: Shared & { node: TreeNode }) {
  const visible = node.children.filter(
    (child) => !props.filtering || child.rows.some((row) => props.matched.has(row.row_index))
  );
  return (
    <>
      {visible.map((child) => (
        <Node key={child.key} node={child} {...props} />
      ))}
    </>
  );
}

function indentStyle(depth: number): CSSProperties {
  const level = Math.min(depth, 4);
  return { "--i": `${level * 1.25}rem`, "--i-sm": `${level * 0.6}rem` } as CSSProperties;
}

/** Printed group wording that only restates a genetic model ("unit increase in the dosage of the minor allele") — the result says "per allele". */
function restatesModel(labels: RunLabels, field: string, rows: Row[]) {
  return (
    field === "comparison_group_raw" &&
    rows.every((row) => labels.frame_tags[String(row.fields.comparison_group_type ?? "")])
  );
}

function contextChips(labels: RunLabels, chips: SharedChip[], rows: Row[]) {
  const byField = new Map(chips.map((chip) => [chip.field, chip]));
  return CONTEXT_FIELDS.flatMap((field) => {
    const chip = byField.get(field);
    if (!chip || restatesModel(labels, field, rows)) return [];
    if (PLACEHOLDER_VALUES.has(String(rows[0]?.fields[field] ?? ""))) return [];
    return [chip];
  });
}

/** What every finding below shares, as readable tags on the node's own line. */
function ContextTags({ chips, node, ...props }: Shared & { chips: SharedChip[]; node: TreeNode }) {
  const shown = contextChips(props.labels, chips, node.rows);
  const scope = node.path.map((step) => step.text).join(" › ");
  return (
    <>
      {shown.map((chip) => (
        <span
          key={chip.field}
          className="inline-flex max-w-full self-center rounded-md bg-mc-tint-purple-fill px-1.5 py-0.5 text-[13px] font-medium text-mc-tint-purple-ink ring-1 ring-inset ring-mc-line-accent"
        >
          <Value
            paperId={props.paper.paper_id}
            rows={node.rows}
            field={chip.field}
            scopeLabel={scope}
            presentation={props.presentation}
            labels={props.labels}
            query={props.query}
            selectedKey={props.selectedKey}
            onSelect={props.onSelect}
          />
        </span>
      ))}
    </>
  );
}

function Node({ node, ...props }: Shared & { node: TreeNode }) {
  const open = props.expanded.has(node.key);
  const count = props.filtering
    ? node.rows.filter((row) => props.matched.has(row.row_index)).length
    : node.rows.length;
  const field = node.field ?? "";
  const scope = node.path.map((step) => step.text).join(" › ");
  const chips = node.projection
    ? [...node.projection.shared, ...node.projection.sharedOverflow]
    : [...node.lifted, ...node.liftedOverflow];

  return (
    <div className={node.depth === 1 ? "border-b last:border-b-0" : ""}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => props.onToggle(node.key)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            props.onToggle(node.key);
          }
        }}
        className={`group flex cursor-pointer items-baseline gap-2 pr-4 pl-[calc(var(--i-sm)+0.75rem)] transition-colors hover:bg-secondary/50 md:pl-[calc(var(--i)+1rem)] ${
          node.depth === 1 ? "py-3.5" : "py-2"
        }`}
        style={indentStyle(node.depth - 1)}
      >
        <ChevronRight
          aria-hidden
          className={`relative top-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground ${
            open ? "rotate-90" : ""
          }`}
        />
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
        {LEVEL_KIND[field] && <LevelKind field={field} />}
        <span
          className={`min-w-0 break-words ${
            node.depth === 1
              ? "text-[15px] font-semibold text-foreground"
              : node.depth === 2
                ? "font-medium text-foreground"
                : "text-foreground"
          }`}
        >
          {node.populated ? (
            <Value
              paperId={props.paper.paper_id}
              rows={node.rows}
              field={field}
              scopeLabel={scope}
              presentation={props.presentation}
              labels={props.labels}
              query={props.query}
              selectedKey={props.selectedKey}
              onSelect={props.onSelect}
            />
          ) : (
            <span className="italic text-muted-foreground">No {fieldLabel(props.labels, field).toLowerCase()} recorded</span>
          )}
        </span>
        {open && <ContextTags chips={chips} node={node} {...props} />}
        </span>
        <span className="shrink-0 self-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
          {count}
        </span>
      </div>
      {open && (
        <>
          {node.projection ? <Table node={node} {...props} /> : <Children node={node} {...props} />}
        </>
      )}
    </div>
  );
}

function LevelKind({ field }: { field: string }) {
  const { word, icon: Icon } = LEVEL_KIND[field];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-md bg-mc-tint-purple-fill px-2 py-0.5 text-xs font-bold text-mc-tint-purple-ink">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {word}
    </span>
  );
}

/* ------------------------------------------------------------ findings */

function Table({ node, ...props }: Shared & { node: TreeNode }) {
  const projection = node.projection!;
  const rows = props.filtering
    ? node.rows.filter((row) => props.matched.has(row.row_index))
    : node.rows;
  const identity = projection.identityField;
  const varies = (field: string) =>
    new Set(node.rows.map((row) => (isPopulated(row, field) ? displayText(row, field) : ""))).size > 1;
  const extras = EXTRA_COLUMN_FIELDS.filter(
    (field) => field !== identity && varies(field) && !restatesModel(props.labels, field, node.rows)
  ).slice(0, 2);
  const columns = [identity ? "minmax(0,1.3fr)" : null, ...extras.map(() => "minmax(0,1fr)"), "minmax(0,1.4fr)"]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="mb-3 mr-4 ml-[calc(var(--i-sm)+2.25rem)] overflow-hidden rounded-md border md:ml-[calc(var(--i)+2.5rem)]"
      style={indentStyle(node.depth - 1)}
    >
      {!props.narrow && (
        <div
          className="grid gap-4 border-b bg-secondary/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
          style={{ gridTemplateColumns: columns }}
        >
          {identity && <span>{fieldLabel(props.labels, identity)}</span>}
          {extras.map((field) => (
            <span key={field}>{fieldLabel(props.labels, field)}</span>
          ))}
          <span>Result</span>
        </div>
      )}
      {rows.map((row) => {
        const open = props.expandedRows.has(row.row_index);
        return (
          <div key={row.row_index} className="border-b last:border-b-0">
            <div
              role="button"
              tabIndex={0}
              aria-expanded={open}
              aria-label={`All fields for finding ${row.row_index + 1}`}
              onClick={() => props.onToggleRow(row.row_index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  props.onToggleRow(row.row_index);
                }
              }}
              className={`cursor-pointer gap-x-4 gap-y-0.5 px-3 py-2 text-sm transition-colors ${
                props.narrow ? "flex flex-col" : "grid items-baseline"
              } ${open ? "bg-secondary" : "hover:bg-secondary/50"}`}
              style={props.narrow ? undefined : { gridTemplateColumns: columns }}
            >
              {identity && (
                <span className="min-w-0 break-words font-medium text-foreground">
                  <CellValue row={row} field={identity} {...props} />
                </span>
              )}
              {extras.map((field) => (
                <span key={field} className="min-w-0 break-words text-foreground">
                  {/* the printed wording of a genetic model is already "per allele" etc. on the result */}
                  {restatesModel(props.labels, field, [row]) ? null : <CellValue row={row} field={field} {...props} />}
                </span>
              ))}
              <span className="min-w-0">
                <Result row={row} {...props} />
              </span>
            </div>
            {open && <div className="border-t bg-white px-3 pb-3">{props.renderDetail(row, node)}</div>}
          </div>
        );
      })}
    </div>
  );
}

function CellValue({ row, field, ...props }: Shared & { row: Row; field: string }) {
  if (!isPopulated(row, field)) return <span className="text-mc-ink-secondary">—</span>;
  return (
    <Value
      paperId={props.paper.paper_id}
      rows={[row]}
      field={field}
      scopeLabel={`Finding ${row.row_index + 1}`}
      presentation={props.presentation}
      labels={props.labels}
      query={props.query}
      selectedKey={props.selectedKey}
      onSelect={props.onSelect}
    />
  );
}

/** One line: OR 1.7 (1.3–2.4) · p <.001 · 765/1545. Every number opens its evidence. */
function Result({ row, ...props }: Shared & { row: Row }) {
  const num = (field: string, text?: string) => (
    <Value
      paperId={props.paper.paper_id}
      rows={[row]}
      field={field}
      text={text ?? displayText(row, field)}
      scopeLabel={`Finding ${row.row_index + 1}`}
      labels={props.labels}
      query={props.query}
      selectedKey={props.selectedKey}
      onSelect={props.onSelect}
      className="tabular-nums"
      tight
    />
  );
  const parts: ReactNode[] = [];
  const measure = String(row.fields.effect_size_type ?? "");
  const frame = props.labels.frame_tags[String(row.fields.comparison_group_type ?? "")];
  if (isPopulated(row, "effect_size")) {
    parts.push(
      <span key="est" className="inline-flex items-baseline gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {props.labels.measure_labels[measure] ?? "Effect"}
          {frame ? ` ${frame}` : ""}
        </span>
        <span className="font-semibold text-foreground">{num("effect_size")}</span>
        {(isPopulated(row, "effect_size_ci_lower") || isPopulated(row, "effect_size_ci_upper")) && (
          <span className="text-muted-foreground">
            ({isPopulated(row, "effect_size_ci_lower") ? num("effect_size_ci_lower") : "?"}–
            {isPopulated(row, "effect_size_ci_upper") ? num("effect_size_ci_upper") : "?"})
          </span>
        )}
      </span>
    );
  }
  if (isPopulated(row, "p_value")) {
    parts.push(
      <span key="p" className="inline-flex items-baseline gap-1 text-foreground">
        <span className="text-xs font-medium text-muted-foreground">p</span>
        {num("p_value")}
      </span>
    );
  }
  for (const field of ["sensitivity", "specificity", "positive_predictive_value", "negative_predictive_value"]) {
    if (!isPopulated(row, field)) continue;
    parts.push(
      <span key={field} className="inline-flex items-baseline gap-1">
        <span className="text-xs font-medium text-muted-foreground">{fieldLabel(props.labels, field)}</span>
        {num(field)}
      </span>
    );
  }
  const events = isPopulated(row, "n_events");
  const total = isPopulated(row, "n_total");
  if (events || total) {
    parts.push(
      <span key="n" className="inline-flex items-baseline text-muted-foreground">
        {events ? num("n_events") : "?"}/{total ? num("n_total") : "?"}
      </span>
    );
  } else if (isPopulated(row, "count_as_printed_raw")) {
    parts.push(
      <span key="n" className="text-foreground">
        {num("count_as_printed_raw")}
      </span>
    );
  }
  if (parts.length === 0) return <span className="text-mc-ink-secondary">—</span>;
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">{parts}</span>
  );
}

/* -------------------------------------------------------------- controls */

export function CleanControls({
  query,
  onQueryChange,
  order,
  onOrderChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  order: TreeOrder;
  onOrderChange: (order: TreeOrder) => void;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <input
        aria-label="Search findings"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onQueryChange("");
        }}
        placeholder="Search"
        className="h-10 min-w-0 rounded-md border border-mc-line-input bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/20 md:w-64"
      />
      <div className="inline-flex h-10 shrink-0 self-start rounded-md bg-secondary p-1 text-sm md:ml-auto md:self-auto">
        {(["variant_first", "outcome_first"] as TreeOrder[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={order === value}
            onClick={() => onOrderChange(value)}
            className={`rounded px-3 font-medium transition-colors ${
              order === value ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {value === "variant_first" ? "By variant" : "By outcome"}
          </button>
        ))}
      </div>
    </div>
  );
}
