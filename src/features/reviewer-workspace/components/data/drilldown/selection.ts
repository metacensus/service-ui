import type {
  ProvSource,
  Row,
} from "@/features/reviewer-workspace/types";

export type Selection =
  | { kind: "row"; paperId: string; rowIndex: number; field: string }
  | {
      kind: "shared";
      paperId: string;
      field: string;
      scopeLabel: string;
      rowIndexes: number[];
    };

export function selectionKey(selection: Selection | null): string {
  if (!selection) return "";
  return selection.kind === "row"
    ? `row::${selection.paperId}::${selection.rowIndex}::${selection.field}`
    : `shared::${selection.paperId}::${selection.scopeLabel}::${selection.field}`;
}

export function firstSourceFor(
  selection: Selection | null,
  rowsByIndex: Map<number, Row>
): ProvSource | null {
  if (!selection) return null;
  const indexes =
    selection.kind === "row" ? [selection.rowIndex] : selection.rowIndexes;
  for (const index of indexes) {
    const source = rowsByIndex.get(index)?.provenance[selection.field]?.sources?.[0];
    if (source) return source;
  }
  return null;
}
