export type DataMode = "chat" | "table";

export const DATA_MODE_LABEL: Record<DataMode, string> = { chat: "Chat", table: "Table" };

const LAST_MODE_KEY = "metacensus:data-last-mode";

export function parseDataMode(value: unknown): DataMode | null {
  return value === "chat" || value === "table" ? value : null;
}

export function resolveDataMode(
  urlMode: DataMode | null,
  storedMode: DataMode | null
): DataMode {
  return urlMode ?? storedMode ?? "chat";
}

export function readLastDataMode(
  storage: Pick<Storage, "getItem">
): DataMode | null {
  try {
    return parseDataMode(storage.getItem(LAST_MODE_KEY));
  } catch {
    return null;
  }
}

export function writeLastDataMode(
  storage: Pick<Storage, "setItem">,
  mode: DataMode
): void {
  try {
    storage.setItem(LAST_MODE_KEY, mode);
  } catch {
    // Private mode or quota: the URL still carries the mode.
  }
}
