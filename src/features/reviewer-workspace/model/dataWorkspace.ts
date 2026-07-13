import { displayValue } from "./display";

export type DataWorkspaceStatusFilter =
  | "all"
  | "open"
  | "approved"
  | "corrected"
  | "flagged";

export type DataWorkspaceSelectedValue = {
  paperId: string;
  rowIndex: number;
  field: string;
};

  field: string;
  label: string;
  value: unknown;
]);

export function dataWorkspaceHasPopulatedValue(value: unknown): boolean {
  return !(
    value === null ||
    value === undefined ||
    value === "" ||
  );
}

}

export function dataWorkspaceRowMatchesField(row: Row, fieldFilter: string): boolean {
  if (fieldFilter === "all") return true;
}

export function dataWorkspaceFieldStatusTargets(
  row: Row,
  fieldFilter: string
): string[] {
  if (fieldFilter !== "all") return [fieldFilter];
  return Object.keys(row.fields).filter((field) =>
  );
}

export function humanizeDataWorkspaceField(field: string): string {
}

  row: Row,
          field,
          label: humanizeDataWorkspaceField(field),
          value,
  field: string;
  label: string;
  value: unknown;
