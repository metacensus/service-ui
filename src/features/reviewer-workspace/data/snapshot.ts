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

type EvidenceStore = {
  sources: unknown[];
  reasoning: unknown[];
  derivation: unknown[];
};

function evidenceRef(
  table: "sources" | "reasoning" | "derivation",
  entries: unknown,
  ref: unknown,
  paperId: string
): unknown {
  if (!Number.isInteger(ref)) {
    throw new Error(
      `${paperId}: bad ${table} ref ${JSON.stringify(ref)} (expected an integer 0 <= i < ${table}.length)`
    );
  }
  const length = Array.isArray(entries) ? entries.length : 0;
  if ((ref as number) < 0 || (ref as number) >= length) {
    throw new Error(
      `${paperId}: bad ${table} ref ${JSON.stringify(ref)} (expected an integer 0 <= i < ${length})`
    );
  }
  return (entries as unknown[])[ref as number];
}

/** Expand v002 integer evidence references into the v001 row shape. */
export function expandRows(
  rows: Row[],
  evidence: EvidenceStore,
  paperId: string
): Row[] {
  for (const row of rows) {
    for (const pv of Object.values(row.provenance ?? {})) {
      if ("sources" in pv && pv.sources !== undefined) {
        if (!Array.isArray(pv.sources)) {
          throw new Error(
            `${paperId}: bad sources ref ${JSON.stringify(pv.sources)}`
          );
        }
        pv.sources = (pv.sources as unknown[]).map((ref) =>
          evidenceRef("sources", evidence.sources, ref, paperId)
        ) as Row["provenance"][string]["sources"];
      }
      for (const component of pv.source_components ?? []) {
        if ("sources" in component && component.sources !== undefined) {
          if (!Array.isArray(component.sources)) {
            throw new Error(
              `${paperId}: bad sources ref ${JSON.stringify(component.sources)}`
            );
          }
          component.sources = (component.sources as unknown[]).map((ref) =>
            evidenceRef("sources", evidence.sources, ref, paperId)
          ) as Row["provenance"][string]["sources"];
        }
      }
      for (const key of ["reasoning", "derivation"] as const) {
        if (key in pv && pv[key] !== undefined) {
          pv[key] = evidenceRef(key, evidence[key], pv[key], paperId) as string;
        }
      }
    }
  }
  return rows;
}

const formatVersions = new Map<string, Promise<string | undefined>>();

function snapshotFormatVersion(runId: string): Promise<string | undefined> {
  let version = formatVersions.get(runId);
  if (!version) {
    version = fetchManifest(runId).then((m) => m.snapshot_format_version);
    version.catch(() => formatVersions.delete(runId));
    formatVersions.set(runId, version);
  }
  return version;
}

export async function fetchPaperRows(
  runId: string,
  paperId: string
): Promise<Row[]> {
  const version = await snapshotFormatVersion(runId);
  if (version !== undefined && version !== "v001" && version !== "v002") {
    throw new Error(`unsupported snapshot_format_version: ${version}`);
  }
  const rows = await jsonFetch<Row[]>(
    `${fixtureBasePath(runId)}/rows/${pathPart(paperId)}.json`
  );
  if (version === "v002") {
    const evidence = await jsonFetch<EvidenceStore>(
      `${fixtureBasePath(runId)}/evidence/${pathPart(paperId)}.json`
    );
    return validatePaperRows(expandRows(rows, evidence, paperId), paperId);
  }
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
