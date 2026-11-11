// Export-backed tests read the real run from a local demo at DEMO_BASE_URL
// (default http://localhost:5173), over the same paths the app requests. They
// skip when the demo is unreachable and fail when a reachable demo lacks a file.

import type { Manifest, Row } from "../types";
import { fixtureBasePath } from "./runResolver";
import { expandRows } from "./snapshot";

/** The run whose numbers the export-backed tests pin. */
export const EXPORT_RUN = "dpyd_full43_20260921_highlights";

const demoBase = (process.env.DEMO_BASE_URL ?? "http://localhost:5173").replace(/\/+$/, "");
// Throws here on a malformed DEMO_BASE_URL, which fetch would report as unreachable.
new URL(demoBase);

/** fetch against the demo: relative URLs resolve against it, as the browser's do. */
export const demoFetch: typeof fetch = (url, init) => fetch(`${demoBase}${String(url)}`, init);

/** False only when nothing answers at DEMO_BASE_URL (network error or timeout). */
export async function demoReachable(): Promise<boolean> {
  try {
    await demoFetch("/", { signal: AbortSignal.timeout(3000) });
    return true;
  } catch (error) {
    if (error instanceof TypeError || (error as Error).name === "TimeoutError") return false;
    throw error;
  }
}

/** The JSON the demo serves at `path`; throws on anything else, such as a dev server's HTML fallback. */
export async function demoJson<T>(path: string): Promise<T> {
  const response = await demoFetch(path);
  if (!response.ok || !response.headers.get("content-type")?.includes("json")) {
    throw new Error(`${demoBase}${path}: ${response.status} ${response.headers.get("content-type")}`);
  }
  return (await response.json()) as T;
}

/** A file of the run's export, such as `manifest.json` or `rows/<paper>.json`. */
export const exportJson = <T>(file: string) => demoJson<T>(`${fixtureBasePath(EXPORT_RUN)}/${file}`);

let manifest: Promise<Manifest> | undefined;

/** One paper's rows, read the way fetchPaperRows reads them: v002 evidence refs expanded. */
export async function loadExportRows(paperId: string): Promise<Row[]> {
  manifest ??= exportJson<Manifest>("manifest.json");
  const rows = await exportJson<Row[]>(`rows/${paperId}.json`);
  if ((await manifest).snapshot_format_version !== "v002") return rows;
  const evidence = await exportJson<Parameters<typeof expandRows>[1]>(`evidence/${paperId}.json`);
  return expandRows(rows, evidence, paperId);
}
