// Small display helpers for extracted values and row identity.

import type {
  Identity,
  ProvenanceEntry,
  Row,
  SchemaPresentation,
} from "../types";

export const fmt = (n: number) => n.toLocaleString("en-US");

export const count = (n: number, one: string, many: string) =>
  `${fmt(n)} ${n === 1 ? one : many}`;

export function displayValue(
  value: unknown,
  provenance?: ProvenanceEntry | null
): string {
  if (value === null || value === undefined || value === "") {
    return provenance?.extraction_certainty === "abstained"
      ? "not recoverable from the available source (abstained)"
      : "No value in extraction";
  }
  if (value === "not_applicable") return "not applicable";
  if (value === "not_stated") return "not stated";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Identity entries worth showing as chips, in stable order, sans document_id. */
export function identityChips(identity: Identity): [string, string][] {
  return Object.entries(identity)
    .filter(([key, value]) => key !== "document_id" && value != null)
    .map(([key, value]) => [key, String(value)]);
}

/** For a normalized `<base>_id` field, find the raw reported label on the row. */
export function rawLabelFor(
  row: Row,
  field: string,
  presentation?: SchemaPresentation
): string | null {
  const configured = presentation?.reported_value_fields;
  // Backward compatibility for historical snapshots that predate the explicit
  // map. Once a map is present it is authoritative, including its omissions.
  const rawField = configured
    ? configured[field]
    : field.endsWith("_id")
      ? `${field.slice(0, -"_id".length)}_raw`
      : undefined;
  if (!rawField) return null;
  const raw = row.fields[rawField] ?? row.identity[rawField];
  return raw == null ? null : String(raw);
}
