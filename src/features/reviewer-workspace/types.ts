// Snapshot + review-state types for the local reviewer-workspace port.
// These mirror the reviewer snapshot contract while keeping the non-visual
// data/model layer independent from any one domain's frozen fixture.

export type SourceRect = { x: number; y: number; w: number; h: number };
export type SourceLocation = { page: number; rects: SourceRect[] }[];

export type CertaintyCounts = Record<string, number>;
export type TierCounts = Record<string, number>;

export interface PaperMeta {
  paper_id: string;
  document_id: string;
  title: string;
  pdf: string;
  page_count: number;
  row_count: number;
  abstained_count: number;
  field_fill_rate: number;
  certainty_counts: CertaintyCounts;
  tier_counts: TierCounts;
  pdf_available?: boolean;
  highlight_stats?: Partial<RectStats>;
}

export interface GateInfo {
  blocking_total: number;
  by_tier: Record<string, number>;
}

export type SchemaSemanticRole =
  | "citation"
  | "study"
  | "population"
  | "exposure"
  | "comparator"
  | "outcome"
  | "subgroup"
  | "count"
  | "percentage"
  | "continuous_result"
  | "effect_estimate"
  | "uncertainty"
  | "reported_value"
  | "standardized_value"
  | "provenance"
  | "technical";

export interface SchemaPresentationGroup {
  id: string;
  label: string;
  description?: string;
  fields: string[];
}

export interface SchemaPresentation {
  schema_version?: string;
  run_id?: string;
  finding_label?: string;
  groups?: SchemaPresentationGroup[];
  field_roles?: Record<string, SchemaSemanticRole | SchemaSemanticRole[]>;
  /** Explicit standardized-field -> paper-reported-field relationships. */
  reported_value_fields?: Record<string, string>;
  /** Human-authored display copy; never generated from extraction guidance. */
  reviewer_descriptions?: Record<string, string>;
}

export interface RectStats {
  exact?: number;
  table_region?: number;
  page_only?: number;
  pdf_missing?: number;
  not_resolved_for_demo?: number;
}

export interface DemoConfig {
  featured_papers?: string[];
  featured_units?: string[];
  schema_presentation?: SchemaPresentation;
}

  featured_papers?: string[];
export interface IdentityDimension {
  field: string;
  description: string;
}

export interface Manifest {
  run_id: string;
  domain: string;
  exported_at: string;
  blind: boolean;
  schema_version: string;
  has_eval: boolean;
  identity_dimensions?: IdentityDimension[];
  papers: PaperMeta[];
  tier_totals: Record<string, number>;
  gate: GateInfo;
  rect_stats: RectStats;
}

export interface Identity {
  document_id?: string;
  site_region_raw?: string;
  intervention_raw?: string;
  outcome_raw?: string;
  result_group_id?: string;
  [k: string]: unknown;
}

export type ResolutionKind =
  | "exact"
  | "partial_quote"
  | "table_region"
  | "page_only"
  | "not_resolved_for_demo";

export interface ProvSource {
  quote: string;
  location: string;
  page: number;
  cell?: { row: string; column: string };
  resolution?: ResolutionKind;
  highlight?: SourceLocation;
}

export interface ReviewHistoryEntry {
  action?: string;
  [k: string]: unknown;
}

export interface SourceComponent {
  label: string;
  value: unknown;
  sources: ProvSource[];
}

export interface ProvenanceEntry {
  /** Legacy abstentions in the frozen run omit type. */
  type?: "paper" | "derived";
  derivation?: string;
  derivation_kind?: "verbatim" | "derived" | "inferred";
  extraction_certainty?: "clean" | "ambiguous" | "abstained";
  reasoning?: string;
  source_components?: SourceComponent[];
  review_history?: ReviewHistoryEntry[];
  sources: ProvSource[];
}

export interface Row {
  row_index: number;
  identity: Identity;
  fields: Record<string, unknown>;
  provenance: Record<string, ProvenanceEntry>;
}

export type UnitKind =
  | "read_item"
  | "verify_table"
  | "verify_section"
  | "vocab_mapping"
  | "vocab_normalization"
  | "abstention_policy"
  | "spot_check";

export type UnitTier = 1 | 2 | 3;

export type SuggestedAction =
  | "verify_then_approve"
  | "read_each"
  | "decide_mapping"
  | "decide_policy"
  | "spot_check_then_approve"
  | "bulk_approve";

export interface UnitMember {
  row_index: number;
  field: string;
}

export interface UnitAnchor {
  location?: string;
  page?: number;
  table_title?: string;
  validation?: string;
  field?: string;
  label?: string;
  fields?: string[];
  [k: string]: unknown;
}

export interface ReviewUnit {
  id: string;
  kind: UnitKind;
  tier: UnitTier;
  gate_blocking: boolean;
  title: string;
  why: string;
  paper_id: string | null;
  anchor?: UnitAnchor;
  members: UnitMember[];
  member_count: number;
  sample?: UnitMember[];
  suggested_action: SuggestedAction;
}

export interface ReviewUnits {
  total_units: number;
  total_items: number;
  tier_counts: Record<string, number>;
  units: ReviewUnit[];
}

export interface TopValue {
  value: string;
  count: number;
}

export interface NumericStats {
  min: number;
  max: number;
  count_non_null: number;
}

export interface SchemaField {
  name: string;
  type: string | null;
  required: boolean | null;
  identity_dimension: boolean | null;
  description: string | null;
  non_null_count: number;
  total_count: number;
  fill_rate: number;
  papers_populating: number;
  distinct_values: number;
  numeric?: NumericStats;
  top_values?: TopValue[];
}

export interface SchemaSummary {
  schema_version: string;
  field_count: number;
  top_n: number;
  fields: SchemaField[];
}

export type ActionKind = "approve" | "correct" | "flag" | "adjudicate_gold";

export interface CorrectedPayload {
  value: unknown;
  note?: string;
  source?: { quote: string; location: string; page: number };
}

export interface AdjudicationPayload {
  resolution: string;
  evidence?: {
    quote: string;
    page: number;
    highlight?: unknown;
  };
  note?: string;
}

export interface ReviewAction {
  action: ActionKind;
  run_id: string;
  paper_id: string;
  row_index: number | null;
  gold_index?: number | null;
  field: string | null;
  expect_identity?: Record<string, unknown>;
  corrected?: CorrectedPayload;
  flag_reason?: string;
  adjudication?: AdjudicationPayload;
  reviewed_by: string;
  reviewed_at: string;
  via_unit?: string;
}

export type StoredReviewAction = ReviewAction & {
  id: number;
  created_at: string;
};

export type ReviewComment = {
  id: number;
  run_id: string;
  paper_id: string;
  row_index: number | null;
  field: string | null;
  unit_id?: string;
  author: string;
  text: string;
  created_at: string;
};

export type NewReviewComment = Omit<ReviewComment, "id" | "created_at">;

export type DemoReviewState = {
  version: 1;
  reviewerName?: string;
  actions: StoredReviewAction[];
  actionHistory?: StoredReviewAction[];
  comments: ReviewComment[];
};

/**
 * Explore (agentic evidence search) wire types, mirroring the API's
 */
export type ExploreEvidence = {
  evidence_id: string;
  paper_id: string;
  row_index: number;
  field: string;
  source_index: number;
  title: string;
  pdf_path: string;
  pdf_available: boolean;
  value: unknown;
  quote: string | null;
  location: string | null;
  article_page: number | null;
  pdf_page: number | null;
  resolution: ResolutionKind;
  highlight: ProvSource["highlight"] | null;
  cell: ProvSource["cell"] | null;
  provenance_type: string | null;
  derivation: string | null;
  derivation_kind: string | null;
  extraction_certainty: string | null;
  reasoning: string | null;
  review_status: "unreviewed" | "approved" | "corrected" | "flagged";
};

export type ExploreStep = { tool: string; summary: string };

export type ExploreResponse = {
  answer: string;
  model: string;
  steps: ExploreStep[];
  evidence: ExploreEvidence[];
  /** True when the agent hit its turn budget before concluding. */
  truncated?: boolean;
};

export type ExploreRequest = {
  session_id: string;
  question: string;
  review_overlay: ReviewAction[];
};

export type ReviewerPersistenceAdapter = {
  getStorageMode(): Promise<"persistent" | "memory">;
  getReviewerName(): Promise<string | null>;
  setReviewerName(name: string): Promise<void>;
  listActions(runId: string): Promise<StoredReviewAction[]>;
  listActionHistory(runId: string): Promise<StoredReviewAction[]>;
  upsertAction(action: ReviewAction): Promise<StoredReviewAction>;
  bulkUpsertActions(
    runId: string,
    actions: ReviewAction[]
  ): Promise<{ inserted: number }>;
  deleteAction(id: number): Promise<void>;
  listComments(runId: string, paperId?: string): Promise<ReviewComment[]>;
  addComment(comment: NewReviewComment): Promise<ReviewComment>;
  deleteComment(id: number): Promise<void>;
  resetReviewState(runId?: string): Promise<void>;
};
