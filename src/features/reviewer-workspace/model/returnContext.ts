import { DATA_MODE_LABEL, parseDataMode, type DataMode } from "./dataMode";
import {
  isDataWorkspaceStatusFilter,
  type DataWorkspaceSelectedValue,
  type DataWorkspaceStatusFilter,
} from "./dataWorkspace";
import { GROUPS, type Combine, type Group, type SortMode } from "./schemaSelect";

/** Review return context, carried in the URL (`?from=chat|table` + Table params) so a shared or
 * reloaded link keeps its origin. */

export type TableState = {
  /** Selected term keys (`Group|category`, `Group|category|item`, `Paper|paperId`), in color-slot order. */
  terms: string[];
  /** Open paper ids, in open order. */
  open: string[];
  /** The scoped paper id when scope is "One paper"; empty = All papers. */
  scope: string;
  group: Group;
  combine: Combine;
  sort: SortMode;
  view: "selection" | "whole";
  /** The focused paper: the open paper where the user last changed the search, the filters or the evidence selection, and its tree state. */
  paper: string;
  q: string;
  field: string;
  status: DataWorkspaceStatusFilter;
  sel: string;
};

export const EMPTY_TABLE_STATE: TableState = parseTableState();
export const TABLE_STATE_PARAMS = Object.keys(EMPTY_TABLE_STATE);

export type ReviewOrigin = { mode: "chat" } | { mode: "table"; table: TableState };

type SearchLike = {
  get: (key: string) => string | null;
};

export function selectionParam(
  selected: Pick<DataWorkspaceSelectedValue, "rowIndex" | "field"> | null
): string {
  return selected ? `${selected.rowIndex}:${selected.field}` : "";
}

export function parseSelectionParam(
  paperId: string,
  sel: string
): DataWorkspaceSelectedValue | null {
  if (!paperId || !sel) return null;
  const [rowPart, ...fieldParts] = sel.split(":");
  const field = fieldParts.join(":");
  const rowIndex = Number(rowPart);
  return field && Number.isInteger(rowIndex) && rowIndex >= 0
    ? { paperId, rowIndex, field }
    : null;
}

/** Ids never contain "," or "|", so both work as separators. */
export function splitListParam(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Parse `?from=` (plus table params) off a Review URL. Unknown/absent `from` means "not from Data". */
export function parseReviewOrigin(
  from: unknown,
  search?: SearchLike
): ReviewOrigin | null {
  const mode = parseDataMode(from);
  if (!mode) return null;
  return mode === "table" ? { mode, table: parseTableState(search) } : { mode };
}

export function parseTableState(search?: SearchLike): TableState {
  const get = (key: string) => search?.get(key) ?? "";
  const field = get("field");
  const status = get("status");
  const group = get("group");
  const combine = get("combine");
  const sort = get("sort");
  const view = get("view");
  return {
    terms: splitListParam(get("terms")),
    open: splitListParam(get("open")),
    scope: get("scope"),
    group: (GROUPS as readonly string[]).includes(group) ? (group as Group) : "Variants",
    combine: combine === "all" ? "all" : "any",
    sort: sort === "matches" || sort === "findings" || sort === "az" ? sort : "custom",
    view: view === "whole" ? "whole" : "selection",
    paper: get("paper"),
    q: get("q"),
    field: field.trim() ? field : "all",
    status: isDataWorkspaceStatusFilter(status) ? status : "all",
    sel: get("sel"),
  };
}

export const hasTableState = (table: TableState) =>
  Object.keys(tableStateParams(table)).length > 0;

/** Encode a TableState as flat query params, omitting defaults/empties. */
export function tableStateParams(table: TableState): Record<string, string> {
  const params: Record<string, string> = {};
  if (table.terms.length > 0) params.terms = table.terms.join(",");
  if (table.open.length > 0) params.open = table.open.join(",");
  if (table.scope) params.scope = table.scope;
  if (table.group !== "Variants") params.group = table.group;
  if (table.combine === "all") params.combine = "all";
  if (table.sort !== "custom") params.sort = table.sort;
  if (table.view === "whole") params.view = "whole";
  if (table.paper) params.paper = table.paper;
  if (table.q) params.q = table.q;
  if (table.field && table.field !== "all") params.field = table.field;
  if (table.status !== "all") params.status = table.status;
  if (table.sel) params.sel = table.sel;
  return params;
}

function originParams(origin: ReviewOrigin, key: "from" | "mode"): string {
  return new URLSearchParams({
    [key]: origin.mode,
    ...(origin.mode === "table" ? tableStateParams(origin.table) : {}),
  }).toString();
}

/** Unit href that remembers where it was opened from (mode + table snapshot). */
export function unitHrefWithOrigin(
  base: string,
  unitId: string,
  origin: ReviewOrigin | null
): string {
  const path = `${base}/units/${encodeURIComponent(unitId)}`;
  return origin ? `${path}?${originParams(origin, "from")}` : path;
}

/** Where Review (landing or unit) sends the user back — mode plus table state. */
export function reviewBackHref(base: string, origin: ReviewOrigin | null): string {
  return origin ? `${base}/data?${originParams(origin, "mode")}` : base;
}

export function reviewSearchFromData(
  mode: DataMode | null | undefined,
  search: SearchLike
) {
  const origin = parseReviewOrigin(mode, search);
  return origin ? `?${originParams(origin, "from")}` : "";
}

/** Back-link label that never over-promises: filters restored only for Table. */
export function reviewBackLabel(origin: ReviewOrigin | null): string {
  if (!origin) return "Back to the review queue";
  return origin.mode === "chat"
    ? `Back to Data — ${DATA_MODE_LABEL.chat}`
    : `Back to Data — ${DATA_MODE_LABEL.table} (filters restored)`;
}
