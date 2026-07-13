import type {
  IdentityDimension,
  Manifest,
  NumericStats,
  SchemaField,
  SchemaSummary,
  TopValue,
} from "../types";


export type SchemaGroup = {
  id: SchemaGroupId;
  label: string;
  shortLabel: string;
  description: string;
  answer: string;
  exact: string[];
  patterns: string[];
};

export type SchemaFieldRole =
  | "identity"
  | "raw"
  | "normalized"
  | "result"
  | "statistic"
  | "evidence"
  | "system"
  | "context";

export type SchemaFieldView = {
  field: SchemaField;
  name: string;
  label: string;
  group: SchemaGroup;
  role: SchemaFieldRole;
  roleLabel: string;
  identityDimension: IdentityDimension | null;
  isIdentityDimension: boolean;
  isAnalysisReady: boolean;
  fillRate: number;
  topValues: TopValue[];
  numeric?: NumericStats;
};

export type SchemaTotals = {
  contractFields: number;
  identityFields: number;
  requiredFields: number;
  analysisReadyFields: number;
  papers: number;
};

export type SchemaExplorerModel = {
  schemaVersion: string;
  totals: SchemaTotals;
  fields: SchemaFieldView[];
};

export const SCHEMA_GROUPS: SchemaGroup[] = [
  {
    label: "Paper citation",
    description: "Source identifiers and citation metadata.",
    answer: "Which paper produced the finding.",
  },
  {
    id: "study",
    label: "Study context",
    shortLabel: "Study",
    answer: "Who was studied and under what design.",
    exact: [
      "study_design",
      "total_n",
      "population_raw",
      "population_id",
      "enrollment_start_year",
      "enrollment_end_year",
      "institution_country",
      "unit_of_analysis",
    ],
  },
  {
    exact: [
      "intervention_raw",
      "intervention_id",
      "comparator_raw",
      "comparator_id",
    ],
    ],
  },
  {
    id: "outcome",
    label: "Outcome definition",
    shortLabel: "Outcome",
    description: "Endpoints, grading, instruments, and time windows.",
    answer: "What endpoint the paper reported and how it was normalized.",
    exact: [
      "outcome_raw",
      "outcome_id",
      "outcome_instrument",
      "outcome_metric",
      "outcome_timepoint",
      "outcome_direction",
      "outcome_category",
      "outcome_subtype",
    ],
  },
  {
    id: "results",
    label: "Results and statistics",
    shortLabel: "Results",
    description: "Counts, effect estimates, confidence intervals, and tests.",
    answer: "Which extracted numbers are ready to compare or analyze.",
    exact: [
      "n_total",
      "n_events",
      "n_arm",
      "effect_measure",
      "effect_estimate",
      "ci_level",
      "ci_lower",
      "ci_upper",
      "se",
      "p_value",
      "p_value_bound",
      "estimate_adjusted",
      "adjustment_covariates",
      "result_group_id",
      "comparison_id",
      "shared_control_id",
      "mean",
      "sd",
      "tp",
      "fp",
      "fn",
      "tn",
    ],
  },
  {
    shortLabel: "Evidence",
    answer: "What source material supports or qualifies the finding.",
    exact: [
      "sources_used",
      "sources_not_used",
    ],
  },
  {
    description: "Completeness, ambiguity, vocabulary gaps, and export state.",
    answer: "What caveats or export signals the reviewer should notice.",
    exact: [
      "_meta_commentary",
      "identity_dimension_values",
      "schema_vocabulary_gaps",
      "ambiguities",
      "gap_explanation",
      "estimated_completeness",
      "confidence_concerns",
      "schema_version",
      "actual_rows",
      "cartesian_product_size",
      "generated_at",
      "schema_diff_applied",
    ],
  },
  {
    description: "Fields that do not match a reviewer-facing group yet.",
    answer: "Additional export details preserved for completeness.",
    exact: [],
    patterns: [],
  },
];

const GROUP_BY_ID = Object.fromEntries(
  SCHEMA_GROUPS.map((group) => [group.id, group])
) as Record<SchemaGroupId, SchemaGroup>;

const FRIENDLY_LABELS: Record<string, string> = {
  document_id: "Paper identifier",
  doi: "DOI",
  author: "First author",
  year: "Publication year",
  journal: "Journal",
  study_design: "Study design",
  intervention_raw: "Intervention label in the paper",
  intervention_id: "Normalized intervention",
  outcome_raw: "Outcome label in the paper",
  outcome_id: "Normalized outcome",
  result_group_id: "Result group",
  outcome_category: "Outcome category",
  outcome_subtype: "Outcome subtype",
  outcome_metric: "Outcome metric",
  effect_measure: "Effect measure",
  effect_estimate: "Effect estimate",
  ci_lower: "Lower confidence bound",
  ci_upper: "Upper confidence bound",
  p_value: "P value",
};


]);

export function identityDimensionsByField(
  manifest: Manifest
): Record<string, IdentityDimension> {
  return Object.fromEntries(
    (manifest.identity_dimensions ?? []).map((dimension) => [
      dimension.field,
      dimension,
    ])
  );
}

export function buildSchemaFieldViews(
  summary: SchemaSummary,
): SchemaFieldView[] {
  const identityByField = identityDimensionsByField(manifest);

  return summary.fields.map((field) => {
    const identityDimension = identityByField[field.name] ?? null;
    const isIdentityDimension =
      field.identity_dimension === true || identityDimension !== null;

    return {
      name: field.name,
      label: FRIENDLY_LABELS[field.name] ?? humanizeSchemaFieldName(field.name),
      group,
      role,
      roleLabel: schemaFieldRoleLabel(role),
      identityDimension,
      isIdentityDimension,
      fillRate: field.fill_rate,
      topValues: field.top_values ?? [],
      numeric: field.numeric,
    };
  });
}

export function buildSchemaExplorerModel(
  summary: SchemaSummary,
): SchemaExplorerModel {

  return {
    schemaVersion: summary.schema_version ?? manifest.schema_version,
    totals: {
      contractFields: summary.field_count,
      requiredFields: fields.filter((field) => field.field.required).length,
      analysisReadyFields: fields.filter((field) => field.isAnalysisReady)
        .length,
      papers: manifest.papers.length,
    },
    fields,
  };
}

export function truncateSchemaValue(value: string, maxLength = 58): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

}

  const normalized = fieldName.toLowerCase();
  for (const group of SCHEMA_GROUPS) {
    name.endsWith("_id") ||
    name.endsWith("_category") ||
    name.endsWith("_subtype") ||
}
}

}

function roleForSchemaField(
  field: SchemaField,
  group: SchemaGroup,
): SchemaFieldRole {
  const name = field.name;
  if (isIdentityDimension) return "identity";
  if (name.endsWith("_raw")) return "raw";
    return "normalized";
  }
    return "result";
  }
    return "statistic";
  }
  return "context";
}

function schemaFieldRoleLabel(role: SchemaFieldRole): string {
  switch (role) {
    case "identity":
      return "row identity";
    case "raw":
      return "raw source label";
    case "normalized":
      return "normalized vocabulary";
    case "result":
      return "result value";
    case "statistic":
      return "statistic";
    case "evidence":
      return "evidence";
    case "system":
      return "system signal";
    case "context":
    default:
      return "context";
  }
}

function isAnalysisReadySchemaField(
  field: SchemaField,
): boolean {
  if (role === "normalized" || role === "result" || role === "statistic") {
    return true;
  }
  if (field.numeric && role !== "system") return true;
  return false;
}

function humanizeSchemaFieldName(name: string): string {
}
