// The run's normalization manifest: curated labels for normalized values, each
// with the paper-reported forms it covers. Read by the Schema diagram and the
// Data table's value labels.

/** The diagram groups a manifest entry may belong to, in display order. */
export const SCHEMA_DIAGRAM_GROUPS = [
  "Variants",
  "Study context",
  "Outcomes",
  "Results",
  "Paper",
] as const;

export type SchemaDiagramGroup = (typeof SCHEMA_DIAGRAM_GROUPS)[number];

type NormalizationManifestPaper = {
  paper_id: string;
  display: string;
};

type NormalizationManifestForm = {
  raw: string;
  papers: NormalizationManifestPaper[];
};

type NormalizationManifestGroup = {
  diagram_group: string;
  field: string;
  id: string;
  label: string;
  primary: boolean;
  forms: NormalizationManifestForm[];
};

export type NormalizationManifest = {
  run_id: string;
  groups: NormalizationManifestGroup[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isPaper = (p: unknown): p is NormalizationManifestPaper =>
  isRecord(p) &&
  typeof p.paper_id === "string" &&
  typeof p.display === "string";

const isForm = (f: unknown): f is NormalizationManifestForm =>
  isRecord(f) &&
  typeof f.raw === "string" &&
  Array.isArray(f.papers) &&
  f.papers.every(isPaper);

const isGroup = (g: unknown): g is NormalizationManifestGroup =>
  isRecord(g) &&
  typeof g.diagram_group === "string" &&
  (SCHEMA_DIAGRAM_GROUPS as readonly string[]).includes(g.diagram_group) &&
  typeof g.field === "string" &&
  typeof g.id === "string" &&
  typeof g.label === "string" &&
  typeof g.primary === "boolean" &&
  Array.isArray(g.forms) &&
  g.forms.every(isForm);

export function parseNormalizationManifest(
  value: unknown,
  runId: string
): NormalizationManifest | null {
  if (
    !(
      isRecord(value) &&
      value.run_id === runId &&
      Array.isArray(value.groups) &&
      value.groups.length > 0 &&
      value.groups.every(isGroup)
    )
  ) {
    return null;
  }
  const groups = (value as NormalizationManifest).groups;
  return { run_id: runId, groups };
}

function normalizationAssetRoot(): string {
  const configured = import.meta.env.VITE_REVIEWER_NORMALIZATION_BASE_URL
    ?.trim()
    .replace(/\/+$/, "");
  return configured || "/reviewer-snapshots/normalization";
}

export function normalizationAssetUrl(runId: string, path: string): string {
  return `${normalizationAssetRoot()}/${encodeURIComponent(runId)}/${path}`;
}

export async function fetchNormalizationManifest(
  runId: string
): Promise<NormalizationManifest | null> {
  const res = await fetch(normalizationAssetUrl(runId, "manifest.json"), {
    headers: { Accept: "application/json" },
  }).catch(() => null);
  if (!res?.ok) return null;
  return parseNormalizationManifest(await res.json().catch(() => null), runId);
}
