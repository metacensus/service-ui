import type {
  IdentityDimension,
  Manifest,
  NumericStats,
  SchemaField,
  SchemaPresentation,
  SchemaSemanticRole,
  SchemaSummary,
  TopValue,
} from "../types";

export type SchemaGroupId = string;

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
  semanticRoles: SchemaSemanticRole[];
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

export type SchemaOverview = {
  [key: string]: unknown;
  findingLabel: string;
  summarizableFieldCount: number;
};

export type SchemaExplorerModel = {
  schemaVersion: string;
  overview: SchemaOverview;
  totals: SchemaTotals;
  fields: SchemaFieldView[];
};

export const SCHEMA_GROUPS: SchemaGroup[] = [
  {
    id: "citation",
    label: "Paper citation",
    shortLabel: "Citation",
    description: "Source identifiers and citation metadata.",
    answer: "Which paper produced the finding.",
    exact: [
      "document_id",
      "paper_id",
      "title",
      "doi",
      "pmid",
      "author",
      "authors",
      "year",
      "publication_year",
      "journal",
    ],
    patterns: ["citation", "doi", "journal", "pmid", "publication"],
  },
  {
    id: "study",
    label: "Study context",
    shortLabel: "Study",
    description: "Design, population, sample, and setting context.",
    answer: "Who was studied and under what design.",
    exact: [
      "study_design",
      "total_n",
      "sample_size",
      "population_raw",
      "population_id",
      "enrollment_start_year",
      "enrollment_end_year",
      "institution_country",
      "country",
      "setting",
      "unit_of_analysis",
    ],
    patterns: [
      "study",
      "design",
      "population",
      "participant",
      "patient",
      "subject",
      "sample",
      "cohort",
      "enrollment",
      "institution",
      "setting",
      "country",
      "region",
      "subgroup",
    ],
  },
  {
    id: "exposure_comparator",
    label: "Exposure and comparator",
    shortLabel: "Exposure",
    description: "Interventions, exposures, comparators, arms, and settings.",
    answer: "What was studied against what comparison.",
    exact: [
      "exposure_raw",
      "exposure_id",
      "intervention_raw",
      "intervention_id",
      "treatment_raw",
      "treatment_id",
      "comparator_raw",
      "comparator_id",
      "control_raw",
      "control_id",
      "arm",
      "dose",
      "duration",
    ],
    patterns: [
      "exposure",
      "intervention",
      "treatment",
      "therapy",
      "regimen",
      "comparator",
      "control",
      "arm",
      "dose",
      "duration",
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
      "threshold",
      "time_window",
    ],
    patterns: [
      "outcome",
      "endpoint",
      "measure",
      "metric",
      "instrument",
      "timepoint",
      "time_window",
      "threshold",
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
      "count",
      "percentage",
      "percent",
      "rate",
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
      "median",
      "iqr",
      "tp",
      "fp",
      "fn",
      "tn",
    ],
    patterns: [
      "result",
      "effect",
      "estimate",
      "ci_",
      "confidence",
      "p_value",
      "n_",
      "count",
      "percent",
      "percentage",
      "rate",
      "ratio",
      "risk",
      "odds",
      "hazard",
      "mean",
      "median",
      "sd",
      "se",
      "comparison",
    ],
  },
  {
    id: "provenance",
    label: "Evidence and provenance",
    shortLabel: "Evidence",
    description: "Source usage, quotes, certainty, and extraction support.",
    answer: "What source material supports or qualifies the finding.",
    exact: [
      "sources_used",
      "sources_not_used",
      "quote",
      "page",
      "evidence",
      "provenance",
      "reasoning",
      "extraction_certainty",
    ],
    patterns: [
      "source",
      "quote",
      "page",
      "evidence",
      "provenance",
      "certainty",
      "reasoning",
      "quality",
      "bias",
    ],
  },
  {
    id: "technical",
    label: "Technical fields",
    shortLabel: "Technical",
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
    patterns: [
      "schema",
      "confidence",
      "ambigu",
      "gap",
      "generated",
      "completeness",
      "metadata",
    ],
  },
  {
    id: "additional",
    label: "Additional fields",
    shortLabel: "Additional",
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
  paper_id: "Paper identifier",
  title: "Paper title",
  doi: "DOI",
  pmid: "PubMed identifier",
  author: "First author",
  authors: "Authors",
  year: "Publication year",
  publication_year: "Publication year",
  journal: "Journal",
  study_design: "Study design",
  population_raw: "Population label in the paper",
  population_id: "Normalized population",
  exposure_raw: "Exposure label in the paper",
  exposure_id: "Normalized exposure",
  intervention_raw: "Intervention label in the paper",
  intervention_id: "Normalized intervention",
  treatment_raw: "Treatment label in the paper",
  treatment_id: "Normalized treatment",
  comparator_raw: "Comparator label in the paper",
  comparator_id: "Normalized comparator",
  control_raw: "Control label in the paper",
  control_id: "Normalized control",
  outcome_raw: "Outcome label in the paper",
  outcome_id: "Normalized outcome",
  result_group_id: "Result group",
  outcome_category: "Outcome category",
  outcome_subtype: "Outcome subtype",
  outcome_metric: "Outcome metric",
  outcome_timepoint: "Outcome timepoint",
  n_total: "Total count",
  n_events: "Events",
  n_arm: "Arm count",
  effect_measure: "Effect measure",
  effect_estimate: "Effect estimate",
  ci_lower: "Lower confidence bound",
  ci_upper: "Upper confidence bound",
  p_value: "P value",
};

const ADDITIONAL_GROUP = GROUP_BY_ID.additional;

const SEMANTIC_ROLE_ORDER: SchemaSemanticRole[] = [
  "citation",
  "study",
  "population",
  "exposure",
  "comparator",
  "outcome",
  "subgroup",
  "count",
  "percentage",
  "continuous_result",
  "effect_estimate",
  "uncertainty",
  "reported_value",
  "standardized_value",
  "provenance",
  "technical",
];

const VALID_SEMANTIC_ROLES = new Set<SchemaSemanticRole>(SEMANTIC_ROLE_ORDER);

  "count",
  "percentage",
  "continuous_result",
  "effect_estimate",
const SUMMARY_ROLES = new Set<SchemaSemanticRole>([
  "count",
  "percentage",
  "continuous_result",
  "effect_estimate",
  "uncertainty",
  "reported_value",
  "standardized_value",
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
  manifest: Manifest,
  presentation?: SchemaPresentation
): SchemaFieldView[] {
  const identityByField = identityDimensionsByField(manifest);
  const presentationGroups = buildPresentationGroups(presentation);

  return summary.fields.map((field) => {
    const identityDimension = identityByField[field.name] ?? null;
    const isIdentityDimension =
      field.identity_dimension === true || identityDimension !== null;
    const semanticRoles = semanticRolesForSchemaField(field, presentation);
    const group = groupForSchemaField(field.name, semanticRoles, presentationGroups);
    const role = roleForSchemaField(
      group,
      isIdentityDimension,
      semanticRoles
    );

    return {
      name: field.name,
      label: FRIENDLY_LABELS[field.name] ?? humanizeSchemaFieldName(field.name),
      group,
      role,
      roleLabel: schemaFieldRoleLabel(role),
      identityDimension,
      isIdentityDimension,
      isAnalysisReady: isAnalysisReadySchemaField(field, role, semanticRoles),
      semanticRoles,
      fillRate: field.fill_rate,
      topValues: field.top_values ?? [],
      numeric: field.numeric,
    };
  });
}

export function buildSchemaExplorerModel(
  summary: SchemaSummary,
  manifest: Manifest,
  presentation?: SchemaPresentation
): SchemaExplorerModel {
  const fields = buildSchemaFieldViews(summary, manifest, presentation);

  return {
    schemaVersion: summary.schema_version ?? manifest.schema_version,
    overview,
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

type PresentationGroups = {
  groups: SchemaGroup[];
  fieldToGroup: Map<string, SchemaGroup>;
};

const resultValueRoles = new Set<SchemaSemanticRole>([
  "count",
  "percentage",
  "continuous_result",
  "reported_value",
]);

const statisticRoles = new Set<SchemaSemanticRole>([
  "effect_estimate",
  "uncertainty",
]);

function buildPresentationGroups(
  presentation?: SchemaPresentation
): PresentationGroups {
  const groups =
    presentation?.groups?.map((group) => ({
      id: group.id,
      label: group.label,
      shortLabel: group.label,
      description: group.description ?? "",
      answer: group.description ?? "Configured schema presentation group.",
      exact: group.fields,
      patterns: [],
    })) ?? [];

  const fieldToGroup = new Map<string, SchemaGroup>();
  for (const group of groups) {
    for (const field of group.exact) fieldToGroup.set(field, group);
  }

  return { groups, fieldToGroup };
}

function normalizeConfiguredRoles(
  fieldName: string,
  presentation?: SchemaPresentation
): SchemaSemanticRole[] {
  const configured = presentation?.field_roles?.[fieldName];
  const roles = Array.isArray(configured)
    ? configured
    : configured
      ? [configured]
      : [];

  return orderedUniqueRoles(
    roles.filter((role): role is SchemaSemanticRole =>
      VALID_SEMANTIC_ROLES.has(role)
    )
  );
}

function semanticRolesForSchemaField(
  field: SchemaField,
  presentation?: SchemaPresentation
): SchemaSemanticRole[] {
  const configuredRoles = normalizeConfiguredRoles(field.name, presentation);
  if (configuredRoles.length > 0) return configuredRoles;

  const name = field.name;
  const lower = name.toLowerCase();
  const roles: SchemaSemanticRole[] = [];

  if (name.startsWith("_")) roles.push("technical");
  if (matchesGenericGroup(name, "citation")) roles.push("citation");
  if (matchesAny(lower, ["study", "design", "cohort", "enrollment"])) {
    roles.push("study");
  }
  if (
    matchesAny(lower, [
      "population",
      "participant",
      "patient",
      "subject",
      "sample",
    ])
  ) {
    roles.push("population");
  }
  if (matchesAny(lower, ["subgroup", "stratum", "strata"])) {
    roles.push("subgroup");
  }
  if (
    matchesAny(lower, [
      "exposure",
      "intervention",
      "treatment",
      "therapy",
      "regimen",
      "dose",
    ])
  ) {
    roles.push("exposure");
  }
  if (matchesAny(lower, ["comparator", "control"])) {
    roles.push("comparator");
  }
  if (matchesGenericGroup(name, "outcome")) roles.push("outcome");
  if (isStandardizedFieldName(name)) roles.push("standardized_value");
  if (name.endsWith("_raw")) roles.push("reported_value");
  if (isCountFieldName(name)) roles.push("count");
  if (matchesAny(lower, ["percent", "percentage", "proportion", "rate"])) {
    roles.push("percentage");
  }
  if (["mean", "median", "sd", "iqr"].includes(lower)) {
    roles.push("continuous_result");
  }
  if (
    matchesAny(lower, [
      "effect",
      "estimate",
      "odds",
      "risk",
      "hazard",
      "ratio",
    ])
  ) {
    roles.push("effect_estimate");
  }
  if (
    lower.startsWith("ci_") ||
    matchesAny(lower, ["confidence", "se", "p_value", "uncertainty"])
  ) {
    roles.push("uncertainty");
  }
  if (matchesGenericGroup(name, "provenance")) roles.push("provenance");
  if (matchesGenericGroup(name, "technical")) roles.push("technical");

  return orderedUniqueRoles(roles);
}

function orderedUniqueRoles(
  roles: readonly SchemaSemanticRole[]
): SchemaSemanticRole[] {
  const roleSet = new Set(roles);
  return SEMANTIC_ROLE_ORDER.filter((role) => roleSet.has(role));
}

function groupForSemanticRoles(
  semanticRoles: SchemaSemanticRole[]
): SchemaGroup | null {
  if (semanticRoles.includes("citation")) return GROUP_BY_ID.citation;
  if (
    semanticRoles.some((role) =>
      ["study", "population", "subgroup"].includes(role)
    )
  ) {
    return GROUP_BY_ID.study;
  }
  if (
    semanticRoles.some((role) => ["exposure", "comparator"].includes(role))
  ) {
    return GROUP_BY_ID.exposure_comparator;
  }
  if (semanticRoles.includes("outcome")) return GROUP_BY_ID.outcome;
  if (semanticRoles.some((role) => SUMMARY_ROLES.has(role))) {
    return GROUP_BY_ID.results;
  }
  if (semanticRoles.includes("provenance")) return GROUP_BY_ID.provenance;
  if (semanticRoles.includes("technical")) return GROUP_BY_ID.technical;
  return null;
}

function groupForGenericConvention(
  fieldName: string,
  key: "exact" | "patterns"
): SchemaGroup | null {
  const normalized = fieldName.toLowerCase();
  for (const group of SCHEMA_GROUPS) {
    if (group.id === "additional") continue;
    const matches =
      key === "exact"
        ? group.exact.includes(fieldName)
        : group.patterns.some((pattern) => normalized.includes(pattern));
    if (matches) return group;
  }
  return null;
}

function matchesGenericGroup(fieldName: string, groupId: SchemaGroupId): boolean {
  const group = SCHEMA_GROUPS.find((item) => item.id === groupId);
  if (!group) return false;
  const normalized = fieldName.toLowerCase();
  return (
    group.exact.includes(fieldName) ||
    group.patterns.some((pattern) => normalized.includes(pattern))
  );
}

function matchesAny(value: string, fragments: string[]): boolean {
  return fragments.some((fragment) => value.includes(fragment));
}

function isStandardizedFieldName(name: string): boolean {
  return (
    name.endsWith("_id") ||
    name.endsWith("_category") ||
    name.endsWith("_subtype") ||
    name.endsWith("_code") ||
    name.endsWith("_standardized")
  );
}

function isCountFieldName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower === "n" ||
    lower === "count" ||
    lower === "total_n" ||
    lower.startsWith("n_") ||
    lower.endsWith("_n") ||
    lower.endsWith("_count")
  );
}

export function groupForSchemaField(
  fieldName: string,
  semanticRoles: SchemaSemanticRole[] = [],
  presentationGroups = buildPresentationGroups()
): SchemaGroup {
  const configuredGroup = presentationGroups.fieldToGroup.get(fieldName);
  if (configuredGroup) return configuredGroup;

  const roleGroup = groupForSemanticRoles(semanticRoles);
  if (roleGroup) return roleGroup;

  const exactGroup = groupForGenericConvention(fieldName, "exact");
  if (exactGroup) return exactGroup;

  const patternGroup = groupForGenericConvention(fieldName, "patterns");
  if (patternGroup) return patternGroup;

  return ADDITIONAL_GROUP;
}

function roleForSchemaField(
  field: SchemaField,
  group: SchemaGroup,
  isIdentityDimension: boolean,
  semanticRoles: SchemaSemanticRole[]
): SchemaFieldRole {
  const name = field.name;
  if (isIdentityDimension) return "identity";
  if (name.endsWith("_raw")) return "raw";
  if (semanticRoles.includes("standardized_value") || isStandardizedFieldName(name)) {
    return "normalized";
  }
  if (semanticRoles.some((role) => resultValueRoles.has(role))) {
    return "result";
  }
  if (semanticRoles.some((role) => statisticRoles.has(role))) {
    return "statistic";
  }
  if (semanticRoles.includes("provenance") || group.id === "provenance") {
    return "evidence";
  }
  if (semanticRoles.includes("technical") || group.id === "technical") {
    return "system";
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
  role: SchemaFieldRole,
  semanticRoles: SchemaSemanticRole[]
): boolean {
  if (semanticRoles.some((semanticRole) => SUMMARY_ROLES.has(semanticRole))) {
    return true;
  }
  if (role === "normalized" || role === "result" || role === "statistic") {
    return true;
  }
  if (field.numeric && role !== "system") return true;
  return false;
}

function buildSchemaOverview(
  presentation: SchemaPresentation | undefined,
): SchemaOverview {
  return {
    findingLabel: presentation?.finding_label?.trim() || "finding",
  };
}

function humanizeSchemaFieldName(name: string): string {
}
