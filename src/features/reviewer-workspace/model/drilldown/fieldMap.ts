// Explicit field mappings for THIS run's schema (dpyd v006, 58 fields).
//
// Deliberately not a generalized schema summarizer: every list below names
// real fields from `schema_summary.json`, and the projection code only ever
// reads fields named here (plus an explicit "everything else" catch-all that
// keeps unmapped fields reachable in the row detail, so nothing is dropped).
// Porting the design to another domain means writing another map like this.

/** Citation: rendered once at paper level, never inside a finding row. */
export const CITATION_FIELDS = ["author", "year", "journal", "pmid", "doi"] as const;

/**
 * Study-level candidates. Lifted to the paper header only when one identical
 * populated value is present on EVERY row of the paper; otherwise they stay in
 * the per-group / per-row pool and the header names them as exceptions.
 */
export const PAPER_LEVEL_CANDIDATES = [
  "study_design_raw",
  "study_design_id",
  "total_n",
  "total_n_definition_raw",
  "genotyping_method_raw",
  "genotype_panel_as_tested_raw",
  "genotype_panel_entity_ids",
  "population_ancestry_raw",
  "population_ancestry_ids",
  "population_cancer_types_raw",
  "treatment_setting_raw",
  "enrollment_period_raw",
  "cohort_overlap_note_raw",
  "genotype_guided_dosing_status",
  "data_origin_type",
  "administration_form",
] as const;

/** Grouping dimensions offered in the UI. `raw` is the paper's own wording. */
export const GROUP_BY_MODES = [
  {
    id: "tree_variant_first",
    label: "Study tree — variant first",
    field: "analysis_population_raw",
    fallbackField: "analysis_population_raw",
    inMenu: true,
    hint: "who (analysis population, FP exposure) → what's compared (variant type → variant; comparison frame → compared group) → what's measured (outcome type → normalized outcome) → findings",
  },
  {
    id: "tree_outcome_first",
    label: "Study tree — outcome first",
    field: "analysis_population_raw",
    fallbackField: "analysis_population_raw",
    inMenu: true,
    hint: "who (analysis population, FP exposure) → what's measured (outcome type → normalized outcome) → what's compared (variant type → variant; comparison frame → compared group) → findings",
  },
  {
    id: "outcome_normalized",
    label: "Outcome — normalized ID",
    field: "outcome_id",
    fallbackField: "outcome_raw",
    inMenu: false,
    hint: "outcome_id, falling back to the printed outcome_raw when no ID was resolved",
  },
  {
    id: "outcome_raw",
    label: "Outcome — as printed",
    field: "outcome_raw",
    fallbackField: "outcome_id",
    inMenu: false,
    hint: "outcome_raw verbatim; no normalization applied",
  },
  {
    id: "entity",
    label: "Variant",
    field: "entity_id",
    fallbackField: "entity_raw",
    inMenu: false,
    hint: "entity_id, falling back to the printed entity_raw",
  },
] as const;

export type GroupByMode = (typeof GROUP_BY_MODES)[number]["id"];

/** Row-level column fields. */
export const ENTITY_FIELDS = {
  raw: "entity_raw",
  normalized: "entity_id",
  locus: "entity_locus_type",
  note: "entity_definition_note_raw",
} as const;

export const COMPARISON_FIELDS = {
  group: "comparison_group_raw",
  reference: "reference_group_raw",
  type: "comparison_group_type",
} as const;

export const OUTCOME_FIELDS = {
  raw: "outcome_raw",
  normalized: "outcome_id",
  category: "outcome_category",
  note: "outcome_definition_note_raw",
} as const;

/** Reported result. Never lifted, never replaced by a citation field. */
export const RESULT_FIELDS = {
  measureType: "effect_size_type",
  estimate: "effect_size",
  ciLower: "effect_size_ci_lower",
  ciUpper: "effect_size_ci_upper",
  pValue: "p_value",
  estimatePrinted: "effect_estimate_as_printed_raw",
  events: "n_events",
  total: "n_total",
  denominator: "denominator_type",
  countPrinted: "count_as_printed_raw",
  diagnostic: [
    "sensitivity",
    "specificity",
    "positive_predictive_value",
    "negative_predictive_value",
  ],
} as const;

export const RESULT_FIELD_SET = new Set<string>([
  RESULT_FIELDS.measureType,
  RESULT_FIELDS.estimate,
  RESULT_FIELDS.ciLower,
  RESULT_FIELDS.ciUpper,
  RESULT_FIELDS.pValue,
  RESULT_FIELDS.estimatePrinted,
  RESULT_FIELDS.events,
  RESULT_FIELDS.total,
  RESULT_FIELDS.denominator,
  RESULT_FIELDS.countPrinted,
  ...RESULT_FIELDS.diagnostic,
]);

/**
 * Interval label. schema_summary describes effect_size_ci_lower/upper as "the
 * printed 95% CI as printed", except on bayesian rows where it carries the
 * printed HPD credible interval — so the label follows the measure type and no
 * confidence level is invented anywhere else.
 */
export function intervalLabel(measureType: unknown): string {
  return measureType === "bayesian_posterior_odds_ratio"
    ? "HPD interval"
    : "95% CI";
}

/** Order the paper header shows lifted study fields in. */
export const PAPER_STRIP_PRIORITY = [
  "study_design_raw",
  "study_design_id",
  "total_n",
  "total_n_definition_raw",
  "population_cancer_types_raw",
  "population_ancestry_raw",
  "treatment_setting_raw",
  "enrollment_period_raw",
  "genotyping_method_raw",
  "genotype_panel_as_tested_raw",
  "genotype_panel_entity_ids",
  "cohort_overlap_note_raw",
  "administration_form",
  "genotype_guided_dosing_status",
  "data_origin_type",
];

/** Order the shared-context strip shows lifted fields in. */
export const SHARED_STRIP_PRIORITY = [
  "analysis_population_raw",
  "fp_exposure_raw",
  "entity_raw",
  "comparison_group_raw",
  "reference_group_raw",
  "grade_threshold_raw",
  "grading_scale_raw",
  "time_window_raw",
  "adjustment_status",
  "comparison_group_type",
  "entity_locus_type",
  "outcome_category",
  "outcome_definition_note_raw",
  "entity_definition_note_raw",
  "adjustment_covariates_raw",
  "administration_form",
  "treatment_setting_raw",
  "population_cancer_types_raw",
  "population_ancestry_raw",
  "enrollment_period_raw",
  "genotype_panel_as_tested_raw",
  "cohort_overlap_note_raw",
  "genotype_guided_dosing_status",
  "data_origin_type",
  "cited_source_reference_raw",
];

/** Candidate columns for the row's short identity, first varying one wins. */
export const IDENTITY_COLUMN_CANDIDATES = [
  "entity_raw",
  "comparison_group_raw",
  "outcome_raw",
  "analysis_population_raw",
  "fp_exposure_raw",
  "grade_threshold_raw",
  "time_window_raw",
];

/** Order the "what else differs" column picks varying fields in. */
export const DISTINGUISHING_PRIORITY = [
  "outcome_raw",
  "grade_threshold_raw",
  "analysis_population_raw",
  "fp_exposure_raw",
  "time_window_raw",
  "adjustment_status",
  "comparison_group_type",
  "grading_scale_raw",
  "entity_locus_type",
  "outcome_category",
  "administration_form",
  "treatment_setting_raw",
  "population_cancer_types_raw",
  "population_ancestry_raw",
  "enrollment_period_raw",
  "adjustment_covariates_raw",
  "entity_definition_note_raw",
  "outcome_definition_note_raw",
  "genotype_panel_as_tested_raw",
  "cohort_overlap_note_raw",
  "cited_source_reference_raw",
  "genotype_guided_dosing_status",
  "data_origin_type",
  "genotype_panel_entity_ids",
];

/** Field groups for the expanded row detail. Order is the reading order. */
export const DETAIL_GROUPS: { id: string; label: string; fields: string[] }[] = [
  {
    id: "entity",
    label: "Variant",
    fields: ["entity_raw", "entity_id", "entity_locus_type", "entity_definition_note_raw"],
  },
  {
    id: "comparison",
    label: "Compared groups",
    fields: ["comparison_group_raw", "reference_group_raw", "comparison_group_type"],
  },
  {
    id: "outcome",
    label: "Outcome",
    fields: [
      "outcome_raw",
      "outcome_id",
      "outcome_category",
      "outcome_definition_note_raw",
      "grade_threshold_raw",
      "grade_threshold_id",
      "grading_scale_raw",
      "grading_scale_id",
      "time_window_raw",
      "time_window_id",
    ],
  },
  {
    id: "result",
    label: "Reported result",
    fields: [
      "effect_size_type",
      "effect_size",
      "effect_size_ci_lower",
      "effect_size_ci_upper",
      "p_value",
      "effect_estimate_as_printed_raw",
      "adjustment_status",
      "adjustment_covariates_raw",
      "n_events",
      "n_total",
      "denominator_type",
      "count_as_printed_raw",
      "sensitivity",
      "specificity",
      "positive_predictive_value",
      "negative_predictive_value",
    ],
  },
  {
    id: "population",
    label: "Population and exposure",
    fields: [
      "analysis_population_raw",
      "fp_exposure_raw",
      "fp_exposure_id",
      "administration_form",
      "treatment_setting_raw",
      "population_cancer_types_raw",
      "population_ancestry_raw",
      "population_ancestry_ids",
      "enrollment_period_raw",
      "cohort_overlap_note_raw",
      "genotype_guided_dosing_status",
    ],
  },
  {
    id: "study",
    label: "Study and citation",
    fields: [
      "author",
      "year",
      "journal",
      "pmid",
      "doi",
      "study_design_raw",
      "study_design_id",
      "total_n",
      "total_n_definition_raw",
      "genotyping_method_raw",
      "genotype_panel_as_tested_raw",
      "genotype_panel_entity_ids",
      "data_origin_type",
      "cited_source_reference_raw",
    ],
  },
];

/**
 * Study tree (tiered drill-down). The tiers fix the order of importance; inside
 * a tier the data picks the split. Qualifiers and results are never levels.
 */
export type TreeTierId = "who" | "compared" | "measured";
export type TreeOrder = "variant_first" | "outcome_first";

export const TREE_TIERS: Record<TreeTierId, { label: string; fields: string[] }> = {
  who: { label: "Who", fields: ["analysis_population_raw", "fp_exposure_id"] },
  compared: {
    label: "What's compared",
    fields: ["entity_locus_type", "entity_id"],
  },
  measured: { label: "What's measured", fields: ["outcome_category", "outcome_id"] },
};

export const TREE_TIER_ORDER: Record<TreeOrder, TreeTierId[]> = {
  variant_first: ["who", "compared", "measured"],
  outcome_first: ["who", "measured", "compared"],
};

/** A field splits only once its parents are constant: class before ID; printed group wording last. */
export const TREE_PARENTS: Record<string, string[]> = {
  entity_id: ["entity_locus_type"],
  outcome_id: ["outcome_category"],
};

/** A node with this many findings or fewer is a findings table, not split further. */
export const TREE_TABLE_MAX = 8;

/** Identity column inside a findings table: the most specific structure field that still differs. */
export const TREE_IDENTITY_CANDIDATES: Record<TreeOrder, string[]> = {
  variant_first: [
    "outcome_id", "entity_id", "comparison_group_raw", "analysis_population_raw", "fp_exposure_id",
    "outcome_category", "entity_locus_type",
    "grade_threshold_id", "time_window_id", "reference_group_raw",
  ],
  outcome_first: [
    "entity_id", "comparison_group_raw", "outcome_id", "analysis_population_raw", "fp_exposure_id",
    "entity_locus_type", "outcome_category",
    "grade_threshold_id", "time_window_id", "reference_group_raw",
  ],
};

/** Stored placeholders that say nothing on their own; kept out of the tree's context tags (still in All extracted fields). */
export const PLACEHOLDER_VALUES = new Set([
  "not_applicable_no_grading",
  "threshold_not_stated",
  "not_applicable_no_grading_scale",
  "scale_not_stated",
  "window_not_stated",
  "not_applicable_no_time_window",
  "adjustment_status_not_stated",
  "fp_exposure_not_stated",
]);
