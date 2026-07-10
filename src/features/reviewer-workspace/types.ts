// Snapshot + review-state types for the local reviewer-workspace port.

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
}

export interface GateInfo {
  blocking_total: number;
  by_tier: Record<string, number>;
}

export interface RectStats {
}

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

export interface ProvenanceEntry {
  derivation?: string;
  reasoning?: string;
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
  author: string;
  text: string;
  created_at: string;
};

export type NewReviewComment = Omit<ReviewComment, "id" | "created_at">;

export type DemoReviewState = {
  version: 1;
  reviewerName?: string;
  actions: StoredReviewAction[];
  comments: ReviewComment[];
};

  row_index: number;
  field: string;
export type ReviewerPersistenceAdapter = {
  getReviewerName(): Promise<string | null>;
  setReviewerName(name: string): Promise<void>;
  listActions(runId: string): Promise<StoredReviewAction[]>;
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
