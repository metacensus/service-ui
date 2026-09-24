import type {
  NormalizationManifest,
  SchemaDiagramGroup,
} from "./schemaNormalization";
import {
  truncateSchemaValue,
  type SchemaExplorerModel,
  type SchemaFieldView,
} from "./schemaView";

const LABEL_GROUPS = ["Variants", "Study context", "Outcomes"] as const;

type SchemaDiagramLabelNode = {
  kind: "label";
  key: string;
  entry: NormalizationManifest["groups"][number];
};

type SchemaDiagramFieldNode = {
  kind: "field";
  key: string;
  view: SchemaFieldView;
};

export type SchemaDiagramNode =
  | SchemaDiagramLabelNode
  | SchemaDiagramFieldNode;

type SchemaDiagramSection = {
  title: string;
  nodes: SchemaDiagramNode[];
};

export const LABEL_FAMILY_FIELDS = new Set([
  "entity_id",
  "entity_raw",
  "study_design_id",
  "study_design_raw",
  "outcome_id",
  "outcome_raw",
]);

const SCHEMA_DIAGRAM_FIELD_ASSIGNMENT: {
  group: SchemaDiagramGroup;
  section: string;
  fields: string[];
}[] = [
  {
    group: "Variants",
    section: "Schema fields",
    fields: [
      "entity_locus_type",
      "entity_definition_note_raw",
      "comparison_group_raw",
      "comparison_group_type",
      "reference_group_raw",
      "genotype_panel_entity_ids",
      "genotype_panel_as_tested_raw",
    ],
  },
  {
    group: "Study context",
    section: "Schema fields",
    fields: [
      "total_n",
      "total_n_definition_raw",
      "genotype_guided_dosing_status",
      "genotyping_method_raw",
      "enrollment_period_raw",
      "population_cancer_types_raw",
      "treatment_setting_raw",
      "analysis_population_raw",
      "administration_form",
      "cohort_overlap_note_raw",
      "fp_exposure_id",
      "fp_exposure_raw",
      "population_ancestry_ids",
      "population_ancestry_raw",
    ],
  },
  {
    group: "Outcomes",
    section: "Schema fields",
    fields: [
      "outcome_category",
      "outcome_definition_note_raw",
      "grade_threshold_id",
      "grade_threshold_raw",
      "grading_scale_id",
      "grading_scale_raw",
      "time_window_id",
      "time_window_raw",
    ],
  },
  {
    group: "Results",
    section: "Schema fields",
    fields: [
      "n_events",
      "n_total",
      "denominator_type",
      "count_as_printed_raw",
      "effect_size_type",
      "effect_size",
      "effect_size_ci_lower",
      "effect_size_ci_upper",
      "p_value",
      "adjustment_status",
      "adjustment_covariates_raw",
      "effect_estimate_as_printed_raw",
      "sensitivity",
      "specificity",
      "positive_predictive_value",
      "negative_predictive_value",
    ],
  },
  {
    group: "Results",
    section: "Provenance",
    fields: ["data_origin_type", "cited_source_reference_raw"],
  },
  {
    group: "Paper",
    section: "Paper identity",
    fields: ["pmid", "doi", "author", "year", "journal"],
  },
];

export function assignedDiagramFieldNames(): string[] {
  return SCHEMA_DIAGRAM_FIELD_ASSIGNMENT.flatMap((entry) => entry.fields);
}

const fieldNode = (view: SchemaFieldView): SchemaDiagramNode => ({
  kind: "field",
  key: `field:${view.name}`,
  view,
});

export function buildDiagramSections(
  model: SchemaExplorerModel,
  manifest: NormalizationManifest | null | undefined,
  group: SchemaDiagramGroup
): { sections: SchemaDiagramSection[]; labelsAvailable: boolean } {
  const present = new Map(model.fields.map((field) => [field.name, field]));
  const isLabelGroup = (LABEL_GROUPS as readonly string[]).includes(group);
  const labels = isLabelGroup
    ? (manifest?.groups.filter(
        (entry) => entry.diagram_group === group
      ) ?? [])
    : [];
  const sections: SchemaDiagramSection[] = [];
  if (labels.length > 0) {
    sections.push({
      title: "Standardized labels",
      nodes: labels.map((entry) => ({
        kind: "label" as const,
        key: `${entry.field}:${entry.id}`,
        entry,
      })),
    });
  }
  for (const entry of SCHEMA_DIAGRAM_FIELD_ASSIGNMENT) {
    if (entry.group === group) {
      sections.push({
        title: entry.section,
        nodes: entry.fields
          .filter((name) => present.has(name))
          .map((name) => fieldNode(present.get(name)!)),
      });
    }
  }
  if (group === "Results") {
    const assigned = new Set(assignedDiagramFieldNames());
    const extra = [...present.values()].filter(
      (view) => !assigned.has(view.name) && !LABEL_FAMILY_FIELDS.has(view.name)
    );
    if (extra.length > 0) {
      sections.push({
        title: "Other schema fields",
        nodes: extra.map(fieldNode),
      });
    }
  }
  return { sections, labelsAvailable: !isLabelGroup || labels.length > 0 };
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatFillRate(fillRate: number): string {
  if (fillRate >= 1) return "100%";
  const pct = Math.round(fillRate * 100);
  if (pct <= 0) return fillRate > 0 ? "<1%" : "0%";
  return `${pct}%`;
}

type SchemaFieldStatsView = {
  type: string;
  fillRate: string;
  papersPopulating: string;
  distinctValues: string;
  topValues: { value: string; formattedCount: string }[];
};

export function buildFieldStatsView(
  field: SchemaFieldView,
  totalPapers: number
): SchemaFieldStatsView {
  return {
    type: field.field.type ?? "unspecified",
    fillRate: formatFillRate(field.fillRate),
    papersPopulating: `${field.field.papers_populating} of ${totalPapers}`,
    distinctValues: formatCount(field.field.distinct_values),
    topValues: (field.field.top_values ?? []).slice(0, 5).map((value) => ({
      value: truncateSchemaValue(value.value),
      formattedCount: formatCount(value.count),
    })),
  };
}

export function concernStorageKey(runId: string): string {
  return `metacensus-schema-concerns:${runId}`;
}

export function concernKey(labelKey: string, raw: string): string {
  return JSON.stringify([labelKey, raw]);
}

export function readConcerns(runId: string): Record<string, string> {
  try {
    const raw =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(concernStorageKey(runId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    );
  } catch {
    return {};
  }
}

export function writeConcerns(
  runId: string,
  concerns: Record<string, string>
): void {
  try {
    window.localStorage.setItem(
      concernStorageKey(runId),
      JSON.stringify(concerns)
    );
  } catch {}
}
