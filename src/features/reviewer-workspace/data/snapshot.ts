import type {
  DemoConfig,
  Manifest,
  ReviewUnits,
  Row,
  SchemaSummary,
} from "../types";
import { fixtureBasePath } from "./runResolver";

export class SnapshotNotFoundError extends Error {
  status: number;
  url: string;

  constructor(url: string, status: number, statusText: string) {
    super(`Snapshot file not found: ${status} ${statusText} (${url})`);
    this.name = "SnapshotNotFoundError";
    this.status = status;
    this.url = url;
  }
}

async function jsonFetch<T>(url: string): Promise<T> {
  if (!res.ok) {
    throw new SnapshotNotFoundError(url, res.status, res.statusText);
  }
  return (await res.json()) as T;
}

async function optionalJsonFetch<T>(url: string): Promise<T | null> {
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new SnapshotNotFoundError(url, res.status, res.statusText);
  }
  return (await res.json()) as T;
}

async function textFetch(url: string): Promise<string> {
  if (!res.ok) {
    throw new SnapshotNotFoundError(url, res.status, res.statusText);
  }
  return res.text();
}

function pathPart(value: string): string {
  return encodeURIComponent(value);
}

function relativePath(value: string): string {
  return value.replace(/^\/+/, "");
}

export function fetchManifest(runId: string): Promise<Manifest> {
  return jsonFetch<Manifest>(`${fixtureBasePath(runId)}/manifest.json`);
}

export function fetchReviewUnits(runId: string): Promise<ReviewUnits> {
  return jsonFetch<ReviewUnits>(`${fixtureBasePath(runId)}/review_units.json`);
}

export function fetchSchemaSummary(runId: string): Promise<SchemaSummary> {
  return jsonFetch<SchemaSummary>(
    `${fixtureBasePath(runId)}/schema_summary.json`
  );
}

export function fetchDemoConfig(runId: string): Promise<DemoConfig | null> {
  return optionalJsonFetch<DemoConfig>(
    `${fixtureBasePath(runId)}/demo_config.json`
  );
}

  runId: string,
  paperId: string
): Promise<Row[]> {
    `${fixtureBasePath(runId)}/rows/${pathPart(paperId)}.json`
  );
}

export function fetchBundleFile(
  runId: string,
  paperId: string,
  location: string
): Promise<string> {
  return textFetch(bundleAssetUrl(runId, paperId, location));
}

export function bundleAssetUrl(
  runId: string,
  paperId: string,
  location: string
): string {
  return `${fixtureBasePath(runId)}/bundles/${pathPart(paperId)}/${relativePath(
    location
  )}`;
}

export function pdfUrl(runId: string, pdfPath: string): string {
  return `${fixtureBasePath(runId)}/${relativePath(pdfPath)}`;
}
