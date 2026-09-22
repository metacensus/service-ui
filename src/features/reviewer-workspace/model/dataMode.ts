export type DataMode = "chat" | "table";


const LAST_MODE_KEY = "metacensus:data-last-mode";

export function parseDataMode(value: unknown): DataMode | null {
  return value === "chat" || value === "table" ? value : null;
}

export function readLastDataMode(
): DataMode | null {
  try {
  } catch {
    return null;
  }
}

export function writeLastDataMode(
  mode: DataMode
): void {
  try {
  } catch {
  }
}
