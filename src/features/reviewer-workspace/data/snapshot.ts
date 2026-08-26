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
  const res = await fetch(url);
  if (!res.ok) {
    throw new SnapshotNotFoundError(url, res.status, res.statusText);
  }
  return (await res.json()) as T;
}

const PROVENANCE_TYPES = new Set(["paper", "derived"]);
const DERIVATION_KINDS = new Set(["verbatim", "derived", "inferred"]);
const EXTRACTION_CERTAINTIES = new Set(["clean", "ambiguous", "abstained"]);

function assertAllowed(
  value: unknown,
  allowed: Set<string>,
  label: string,
  coordinate: string
): void {
  if (value != null && (typeof value !== "string" || !allowed.has(value))) {
    throw new Error(
      `Invalid reviewer snapshot at ${coordinate}: unsupported ${label} ${JSON.stringify(value)}`
    );
  }
}

export function validatePaperRows(value: unknown, paperId: string): Row[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid reviewer snapshot for ${paperId}: rows must be an array`);
  }
  for (const row of value as Row[]) {
    if (!row || typeof row !== "object" || typeof row.row_index !== "number") {
      throw new Error(`Invalid reviewer snapshot for ${paperId}: malformed row`);
    }
    for (const [field, provenance] of Object.entries(row.provenance ?? {})) {
      const coordinate = `${paperId}:${row.row_index}:${field}`;
      assertAllowed(provenance.type, PROVENANCE_TYPES, "provenance type", coordinate);
      assertAllowed(
        provenance.derivation_kind,
        DERIVATION_KINDS,
        "derivation kind",
        coordinate
      );
      assertAllowed(
        provenance.extraction_certainty,
        EXTRACTION_CERTAINTIES,
        "extraction certainty",
        coordinate
      );
      if (!Array.isArray(provenance.sources)) {
        throw new Error(`Invalid reviewer snapshot at ${coordinate}: sources must be an array`);
      }
      for (const [index, component] of (
        provenance.source_components ?? []
      ).entries()) {
        if (!component.label || !Array.isArray(component.sources)) {
          throw new Error(
            `Invalid reviewer snapshot at ${coordinate}: malformed source component ${index}`
          );
        }
      }
    }
  }
  return value as Row[];
}

async function optionalJsonFetch<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new SnapshotNotFoundError(url, res.status, res.statusText);
  }
  return (await res.json()) as T;
}

async function textFetch(url: string): Promise<string> {
  const res = await fetch(url);
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

export async function fetchPaperRows(
  runId: string,
  paperId: string
): Promise<Row[]> {
    `${fixtureBasePath(runId)}/rows/${pathPart(paperId)}.json`
  );
  return validatePaperRows(rows, paperId);
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
