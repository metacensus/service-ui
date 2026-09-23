import { DATA_MODE_LABEL, parseDataMode, type DataMode } from "./dataMode";
import {
  isDataWorkspaceStatusFilter,
  type DataWorkspaceSelectedValue,
  type DataWorkspaceStatusFilter,
} from "./dataWorkspace";

/** Review return context, carried in the URL (`?from=chat|table` + Table params) so a shared or
 * reloaded link keeps its origin. */

export type TableState = {
  paper: string;
  q: string;
  field: string;
  status: DataWorkspaceStatusFilter;
  sel: string;
};

export const EMPTY_TABLE_STATE: TableState = parseTableState();

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
  return {
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
