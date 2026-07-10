import type { ProvSource } from "../types";

export type QuoteSegment = { text: string; mark: boolean };

export function splitOnQuote(text: string, quote: string): QuoteSegment[] {
  const q = quote.trim();
  if (!q) return [{ text, mark: false }];

  const escaped = q
    .split(/\s+/)
    .map((tok) => tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const re = new RegExp(escaped);
  const match = re.exec(text);
  if (!match) return [{ text, mark: false }];

  const start = match.index;
  const end = start + match[0].length;
  return [
    { text: text.slice(0, start), mark: false },
    { text: text.slice(start, end), mark: true },
    { text: text.slice(end), mark: false },
  ].filter((part) => part.text.length > 0);
}

export type BundleTableData = {
  title?: string;
  headers?: string[];
  rows?: string[][];
};

/**
 * Parse a bundle table JSON file. Accepts both the reference contract
 * ({headers, rows: string[][]}) and the object-row shape the synthetic
 * exporter emits ({rows: [{col: value, ...}]}), normalizing the latter into
 * headers (first-seen key order) + string rows so cited-cell resolution and
 * rendering work on either.
 */
export function parseBundleTable(raw: string): BundleTableData | null {
  try {
    const table = JSON.parse(raw) as unknown;
    if (table === null || typeof table !== "object") return null;
    const { title, headers, rows } = table as {
      title?: string;
      headers?: string[];
      rows?: unknown[];
    };

    if (
      Array.isArray(rows) &&
      rows.some(
        (row) => row !== null && typeof row === "object" && !Array.isArray(row)
      )
    ) {
      const objectRows = rows.filter(
        (row): row is Record<string, unknown> =>
          row !== null && typeof row === "object" && !Array.isArray(row)
      );
      const seenHeaders: string[] = [];
      for (const row of objectRows) {
        for (const key of Object.keys(row)) {
          if (!seenHeaders.includes(key)) seenHeaders.push(key);
        }
      }
      return {
        ...(title !== undefined ? { title } : {}),
        headers: seenHeaders,
        rows: objectRows.map((row) =>
          seenHeaders.map((key) => (row[key] == null ? "" : String(row[key])))
        ),
      };
    }

    return { title, headers, rows: rows as string[][] | undefined };
  } catch {
    return null;
  }
}

export type CitedCell = { rowIndex: number; colIndex: number };

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function resolveCitedCell(
  table: BundleTableData,
  cell?: NonNullable<ProvSource["cell"]>
): CitedCell {
  if (!cell) return { rowIndex: -1, colIndex: -1 };

  const headers = table.headers ?? [];
  const rows = table.rows ?? [];

  const colIndex = headers.findIndex(
    (header) => normalize(header) === normalize(cell.column)
  );
  const rowIndex = rows.findIndex((row) =>
    row.some((value) => normalize(value) === normalize(cell.row))
  );

  return { rowIndex, colIndex };
}

export function isTableLocation(location: string): boolean {
  return location.endsWith(".json");
}

export function isImageLocation(location: string): boolean {
  const path = location.split(/[?#]/, 1)[0] ?? location;
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}
