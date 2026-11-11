// Grouping, shared-context and column-projection rules for the design study.
//
// Every rule here is mechanical and reversible: it groups, lifts and orders
// values that are literally present in the export. Nothing is summarised,
// merged, translated, averaged or asserted to be equivalent, and no row is
// ever removed or deduplicated — a projection only decides where a value is
// printed, never whether it exists.

import {
  dataWorkspaceFieldStatusTargets,
  dataWorkspaceFieldValue,
  dataWorkspaceHasPopulatedValue,
  dataWorkspaceRowMatchesField,
  dataWorkspaceValueText,
  humanizeDataWorkspaceField,
  type DataWorkspaceStatusFilter,
} from "@/features/reviewer-workspace/model/dataWorkspace";
import { rawLabelFor } from "@/features/reviewer-workspace/model/display";
import type { RowReviewState } from "@/features/reviewer-workspace/model/rowStatus";
import type {
  Row,
  RunLabels,
  SchemaPresentation,
} from "@/features/reviewer-workspace/types";
import { prettyValue } from "./displayLabel";
import {
  TREE_IDENTITY_CANDIDATES,
  TREE_PARENTS,
  TREE_TABLE_MAX,
  TREE_TIERS,
  TREE_TIER_ORDER,
  type TreeOrder,
  type TreeTierId,
  CITATION_FIELDS,
  COMPARISON_FIELDS,
  DISTINGUISHING_PRIORITY,
  ENTITY_FIELDS,
  GROUP_BY_MODES,
  IDENTITY_COLUMN_CANDIDATES,
  OUTCOME_FIELDS,
  PAPER_LEVEL_CANDIDATES,
  PAPER_STRIP_PRIORITY,
  RESULT_FIELDS,
  RESULT_FIELD_SET,
  SHARED_STRIP_PRIORITY,
  intervalLabel,
  type GroupByMode,
} from "./fieldMap";

/** Display label for a field; the field name itself stays visible in detail. */
export function fieldLabel(labels: RunLabels, field: string): string {
  const override = labels.field_labels[field];
  if (override) return override;
  // Raw-only fields drop the "Raw" suffix; the field name stays in tooltips.
  return humanizeDataWorkspaceField(field).replace(/ Raw$/, "");
}

export const DISTINGUISHING_COLUMN_LIMIT = 3;
export const SHARED_STRIP_LIMIT = 6;

/* ------------------------------------------------------------------ values */

export function valueKey(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function readableToken(text: string): string {
  return /^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(text) ? text.replace(/_/g, " ") : text;
}

/** Product's own value text, plus comma-joined arrays and readable tokens. */
export function displayText(row: Row, field: string): string {
  const value = dataWorkspaceFieldValue(row, field);
  const provenance = row.provenance[field];
  if (Array.isArray(value) && value.length > 0) {
    return value.map((entry) => readableToken(String(entry))).join(", ");
  }
  return readableToken(dataWorkspaceValueText(value, provenance));
}

/** Table text: missing values say so in the table's own voice. */
export function cellText(row: Row, field: string): string {
  const value = dataWorkspaceFieldValue(row, field);
  if (dataWorkspaceHasPopulatedValue(value)) return displayText(row, field);
  return row.provenance[field]?.extraction_certainty === "abstained"
    ? "abstained — not recoverable from source"
    : "not recorded";
}

export function isPopulated(row: Row, field: string): boolean {
  return dataWorkspaceHasPopulatedValue(dataWorkspaceFieldValue(row, field));
}

export function hasProvenance(row: Row, field: string): boolean {
  return Boolean(row.provenance[field]);
}

/* ------------------------------------------------------- raw / normalized */

export type Partner = {
  field: string;
  label: string;
  text: string;
  role: "standardized" | "as printed";
};

/** The configured counterpart of a field, from demo_config.reported_value_fields. */
export function partnerField(
  field: string,
  presentation?: SchemaPresentation
): { field: string; role: Partner["role"] } | null {
  const map = presentation?.reported_value_fields;
  if (!map) return null;
  const reported = map[field];
  if (reported) return { field: reported, role: "as printed" };
  const normalized = Object.entries(map).find(
    ([, reportedField]) => reportedField === field
  )?.[0];
  return normalized ? { field: normalized, role: "standardized" } : null;
}

/** The normalized half of a pair when `field` is its printed half. */
export function normalizedOf(
  field: string,
  presentation?: SchemaPresentation
): string | null {
  const partner = partnerField(field, presentation);
  return partner && partner.role === "standardized" ? partner.field : null;
}

/** True for a field that has a printed counterpart (the normalized half). */
export function isNormalizedField(
  field: string,
  presentation?: SchemaPresentation
): boolean {
  return partnerField(field, presentation)?.role === "as printed";
}

/** Priority lists name printed fields; the normalized half ranks just before. */
function withNormalized(priority: string[], presentation?: SchemaPresentation): string[] {
  return priority.flatMap((field) => {
    const normalized = normalizedOf(field, presentation);
    return normalized && !priority.includes(normalized) ? [normalized, field] : [field];
  });
}

export function buildPartner(
  labels: RunLabels,
  row: Row,
  field: string,
  presentation?: SchemaPresentation
): Partner | null {
  const partner = partnerField(field, presentation);
  if (!partner || !isPopulated(row, partner.field)) return null;
  const text = displayText(row, partner.field);
  // Printing "not applicable / standardized: not applicable" twice adds noise
  // and no information; the pair is still visible in the row detail.
  if (text === displayText(row, field)) return null;
  return {
    field: partner.field,
    label: fieldLabel(labels, partner.field),
    text,
    role: partner.role,
  };
}

/* ----------------------------------------------------------------- fields */

export function allFieldNames(rows: Row[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const field of Object.keys(row.identity)) {
      if (!seen.has(field)) {
        seen.add(field);
        names.push(field);
      }
    }
    for (const field of Object.keys(row.fields)) {
      if (!seen.has(field)) {
        seen.add(field);
        names.push(field);
      }
    }
  }
  return names;
}

export type FieldAgreement = {
  /** one identical populated value on every row */
  shared: string[];
  /** two or more distinct values (a null counts as its own value) */
  varying: string[];
  /** no value on any row */
  absent: string[];
  distinct: Map<string, number>;
};

export function agreementOver(rows: Row[], fields: string[]): FieldAgreement {
  const shared: string[] = [];
  const varying: string[] = [];
  const absent: string[] = [];
  const distinct = new Map<string, number>();

  for (const field of fields) {
    const keys = new Set<string>();
    for (const row of rows) keys.add(valueKey(dataWorkspaceFieldValue(row, field)));
    distinct.set(field, keys.size);
    if (keys.size === 1) {
      if (rows.length > 0 && isPopulated(rows[0], field)) shared.push(field);
      else absent.push(field);
    } else {
      varying.push(field);
    }
  }
  return { shared, varying, absent, distinct };
}

function orderBy(fields: string[], priority: string[]): string[] {
  const rank = new Map(priority.map((field, index) => [field, index]));
  return [...fields].sort((a, b) => {
    const ra = rank.get(a) ?? priority.length;
    const rb = rank.get(b) ?? priority.length;
    return ra - rb || a.localeCompare(b);
  });
}

/* ------------------------------------------------------- shared-value chip */

export type SharedChip = {
  field: string;
  label: string;
  text: string;
  partner: Partner | null;
  /** set when only one half of a raw/normalized pair is actually shared */
  note: string | null;
  rowIndexes: number[];
};

export function buildSharedChips(
  labels: RunLabels,
  rows: Row[],
  sharedFields: string[],
  varyingFields: string[],
  presentation: SchemaPresentation | undefined,
  exclude: Set<string>,
  priority: string[] = SHARED_STRIP_PRIORITY
): SharedChip[] {
  const sharedSet = new Set(sharedFields);
  const varyingSet = new Set(varyingFields);
  const consumed = new Set<string>(exclude);
  const chips: SharedChip[] = [];
  const rowIndexes = rows.map((row) => row.row_index);

  // Normalized first: a printed field that has a normalized half never gets a
  // chip of its own. It is revealed from the normalized chip instead — either
  // as the one shared printed form or as the list of printed forms.
  const anchored = sharedFields.filter((field) => !normalizedOf(field, presentation));

  for (const field of orderBy(anchored, withNormalized(priority, presentation))) {
    if (consumed.has(field)) continue;
    consumed.add(field);
    const partnerRef = partnerField(field, presentation);
    let partner: Partner | null = null;
    let note: string | null = null;

    if (partnerRef && sharedSet.has(partnerRef.field)) {
      // Both halves agree across the whole group: one chip carries both.
      consumed.add(partnerRef.field);
      partner = buildPartner(labels, rows[0], field, presentation);
    } else if (partnerRef && varyingSet.has(partnerRef.field)) {
      const forms = new Set(
        rows.map((row) => valueKey(dataWorkspaceFieldValue(row, partnerRef.field)))
      );
      note =
        partnerRef.role === "as printed"
          ? `${forms.size} printed forms across these findings — see each row`
          : `${forms.size} standardized values across these findings — see each row`;
    }

    chips.push({
      field,
      label: fieldLabel(labels, field),
      text: displayText(rows[0], field),
      partner,
      note,
      rowIndexes,
    });
  }
  return chips;
}

/* ------------------------------------------------------------ paper level */

export type PaperContext = {
  rowCount: number;
  citation: {
    field: string;
    label: string;
    text: string;
    populated: boolean;
    rowIndexes: number[];
  }[];
  lifted: SharedChip[];
  exceptions: { field: string; label: string; distinct: number }[];
  absent: string[];
};

export function buildPaperContext(
  labels: RunLabels,
  rows: Row[],
  presentation?: SchemaPresentation
): PaperContext {
  const rowIndexes = rows.map((row) => row.row_index);
  const citationAgreement = agreementOver(rows, [...CITATION_FIELDS]);
  const citation = CITATION_FIELDS.map((field) => {
    const consistent = citationAgreement.shared.includes(field);
    const missing = citationAgreement.absent.includes(field);
    return {
      field,
      label: fieldLabel(labels, field),
      text: consistent
        ? displayText(rows[0], field)
        : missing
          ? "not recorded"
          : `${citationAgreement.distinct.get(field)} different values across rows — not lifted`,
      populated: consistent,
      rowIndexes,
    };
  });

  const candidates = [...PAPER_LEVEL_CANDIDATES];
  const agreement = agreementOver(rows, candidates);
  const lifted = buildSharedChips(
    labels,
    rows,
    agreement.shared,
    agreement.varying,
    presentation,
    new Set(),
    PAPER_STRIP_PRIORITY
  );
  const exceptions = agreement.varying.map((field) => ({
    field,
    label: fieldLabel(labels, field),
    distinct: agreement.distinct.get(field) ?? 0,
  }));

  return {
    rowCount: rows.length,
    citation,
    lifted,
    exceptions,
    absent: agreement.absent,
  };
}

/* ---------------------------------------------------------------- grouping */

export type GroupKind = "normalized" | "fallback" | "missing";

export type FindingGroup = {
  key: string;
  label: string;
  kind: GroupKind;
  kindNote: string;
  rows: Row[];
  /** distinct printed wordings inside the group, with counts */
  reportedAs: { text: string; count: number }[];
  categoryText: string | null;
};

export function buildGroups(
  rows: Row[],
  mode: GroupByMode
): FindingGroup[] {
  const config =
    GROUP_BY_MODES.find((entry) => entry.id === mode && !entry.id.startsWith("tree_")) ??
    GROUP_BY_MODES[2];
  const buckets = new Map<
    string,
    { label: string; kind: GroupKind; rows: Row[]; order: number }
  >();

  rows.forEach((row) => {
    const primary = dataWorkspaceFieldValue(row, config.field);
    const fallback = dataWorkspaceFieldValue(row, config.fallbackField);
    let key: string;
    let label: string;
    let kind: GroupKind;
    if (dataWorkspaceHasPopulatedValue(primary)) {
      key = `primary:${valueKey(primary)}`;
      label = readableToken(String(primary));
      kind = "normalized";
    } else if (dataWorkspaceHasPopulatedValue(fallback)) {
      key = `fallback:${valueKey(fallback)}`;
      label = String(fallback);
      kind = "fallback";
    } else {
      key = "missing";
      label = "No outcome value recorded";
      kind = "missing";
    }
    const bucket = buckets.get(key);
    if (bucket) bucket.rows.push(row);
    else buckets.set(key, { label, kind, rows: [row], order: buckets.size });
  });

  const outcomeGrouping = config.field !== ENTITY_FIELDS.normalized;
  const wordingField = outcomeGrouping ? OUTCOME_FIELDS.raw : ENTITY_FIELDS.raw;

  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const counts = new Map<string, number>();
      for (const row of bucket.rows) {
        const text = cellText(row, wordingField);
        counts.set(text, (counts.get(text) ?? 0) + 1);
      }
      const categoryKeys = new Set(
        bucket.rows.map((row) => valueKey(dataWorkspaceFieldValue(row, OUTCOME_FIELDS.category)))
      );
      return {
        key,
        label: bucket.label,
        kind: bucket.kind,
        kindNote:
          bucket.kind === "normalized"
            ? `grouped on ${config.field}`
            : bucket.kind === "fallback"
              ? `no ${config.field} was recorded — grouped on the printed ${config.fallbackField}`
              : `neither ${config.field} nor ${config.fallbackField} was recorded — records kept in their own group`,
        rows: bucket.rows,
        reportedAs: [...counts.entries()]
          .map(([text, count]) => ({ text, count }))
          .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)),
        categoryText:
          categoryKeys.size === 1 && isPopulated(bucket.rows[0], OUTCOME_FIELDS.category)
            ? cellText(bucket.rows[0], OUTCOME_FIELDS.category)
            : null,
        order: bucket.order,
      };
    })
    .sort((a, b) => b.rows.length - a.rows.length || a.order - b.order)
    .map(({ order: _order, ...group }) => group);
}

/* ------------------------------------------------------------ projection */

export type Cell = {
  field: string;
  label: string;
  text: string;
  populated: boolean;
  partner: Partner | null;
};

export type ResultAtom =
  | { kind: "label"; text: string }
  | { kind: "plain"; text: string }
  | { kind: "value"; field: string; text: string; strong: boolean };

export type ResultLine = { id: string; atoms: ResultAtom[]; muted: boolean };

export type RowProjection = {
  row: Row;
  identity: Cell | null;
  comparison: Cell | null;
  reference: Cell | null;
  comparisonType: Cell | null;
  distinguishing: Cell[];
  hiddenDifferences: string[];
  result: ResultLine[];
  resultEmpty: boolean;
  signature: string;
  /** set when another row in the group renders an identical summary */
  twinNote: string | null;
};

export type GroupProjection = {
  group: FindingGroup;
  shared: SharedChip[];
  sharedOverflow: SharedChip[];
  identityField: string | null;
  identityLabel: string;
  showComparisonColumn: boolean;
  comparisonLabel: string;
  /** comparison_group_raw prints the same text as the identity column */
  comparisonMirrorsIdentity: boolean;
  showDistinguishingColumn: boolean;
  distinguishingFields: string[];
  referenceAbsentForAll: boolean;
  varyingCount: number;
  rows: RowProjection[];
  byRowIndex: Map<number, RowProjection>;
};

function buildCell(
  labels: RunLabels,
  row: Row,
  field: string,
  presentation?: SchemaPresentation
): Cell {
  return {
    field,
    label: fieldLabel(labels, field),
    text: cellText(row, field),
    populated: isPopulated(row, field),
    partner: buildPartner(labels, row, field, presentation),
  };
}

function numberText(row: Row, field: string): string {
  return displayText(row, field);
}

function buildResult(labels: RunLabels, row: Row, presentation?: SchemaPresentation): ResultLine[] {
  const lines: ResultLine[] = [];
  const measureType = dataWorkspaceFieldValue(row, RESULT_FIELDS.measureType);
  const measureLabel =
    labels.measure_labels[String(measureType)] ??
    (measureType ? readableToken(String(measureType)) : "Effect");

  if (isPopulated(row, RESULT_FIELDS.estimate)) {
    lines.push({
      id: "estimate",
      muted: false,
      atoms: [
        { kind: "label", text: measureLabel },
        {
          kind: "value",
          field: RESULT_FIELDS.estimate,
          text: numberText(row, RESULT_FIELDS.estimate),
          strong: true,
        },
      ],
    });
  } else if (
    measureType &&
    measureType !== "no_effect_measure_reported" &&
    measureType !== "diagnostic_performance_metric" &&
    measureType !== "survival_curve_only"
  ) {
    lines.push({
      id: "estimate",
      muted: true,
      atoms: [
        { kind: "label", text: measureLabel },
        {
          kind: "value",
          field: RESULT_FIELDS.measureType,
          text: "no point estimate printed",
          strong: false,
        },
      ],
    });
  }

  const hasLower = isPopulated(row, RESULT_FIELDS.ciLower);
  const hasUpper = isPopulated(row, RESULT_FIELDS.ciUpper);
  if (hasLower || hasUpper) {
    const atoms: ResultAtom[] = [
      { kind: "label", text: intervalLabel(measureType) },
    ];
    if (hasLower) {
      atoms.push({
        kind: "value",
        field: RESULT_FIELDS.ciLower,
        text: numberText(row, RESULT_FIELDS.ciLower),
        strong: false,
      });
    } else {
      atoms.push({ kind: "plain", text: "lower bound not printed" });
    }
    atoms.push({ kind: "plain", text: "–" });
    if (hasUpper) {
      atoms.push({
        kind: "value",
        field: RESULT_FIELDS.ciUpper,
        text: numberText(row, RESULT_FIELDS.ciUpper),
        strong: false,
      });
    } else {
      atoms.push({ kind: "plain", text: "upper bound not printed" });
    }
    lines.push({ id: "ci", muted: false, atoms });
  }

  if (isPopulated(row, RESULT_FIELDS.pValue)) {
    lines.push({
      id: "p",
      muted: false,
      atoms: [
        { kind: "label", text: "P" },
        {
          kind: "value",
          field: RESULT_FIELDS.pValue,
          text: numberText(row, RESULT_FIELDS.pValue),
          strong: false,
        },
      ],
    });
  }

  const diagnostics = RESULT_FIELDS.diagnostic.filter((field) =>
    isPopulated(row, field)
  );
  diagnostics.forEach((field, index) => {
    lines.push({
      id: field,
      muted: false,
      atoms: [
        { kind: "label", text: fieldLabel(labels, field) },
        {
          kind: "value",
          field,
          text: numberText(row, field),
          strong: true,
        },
        // The schema keeps whatever unit the paper printed, so the design says
        // "as printed" once rather than inventing a percent sign.
        ...(index === 0
          ? [{ kind: "plain" as const, text: "as printed — unit as the paper gave it" }]
          : []),
      ],
    });
  });

  const hasEvents = isPopulated(row, RESULT_FIELDS.events);
  const hasTotal = isPopulated(row, RESULT_FIELDS.total);
  if (hasEvents || hasTotal) {
    const atoms: ResultAtom[] = [{ kind: "label", text: "Count" }];
    if (hasEvents) {
      atoms.push({
        kind: "value",
        field: RESULT_FIELDS.events,
        text: numberText(row, RESULT_FIELDS.events),
        strong: true,
      });
    } else {
      atoms.push({ kind: "plain", text: "events not printed" });
    }
    atoms.push({ kind: "plain", text: "/" });
    if (hasTotal) {
      atoms.push({
        kind: "value",
        field: RESULT_FIELDS.total,
        text: numberText(row, RESULT_FIELDS.total),
        strong: true,
      });
    } else {
      atoms.push({ kind: "plain", text: "denominator not printed" });
    }
    lines.push({ id: "count", muted: false, atoms });
    if (isPopulated(row, RESULT_FIELDS.denominator)) {
      lines.push({
        id: "denominator",
        muted: true,
        atoms: [
          { kind: "label", text: "of" },
          {
            kind: "value",
            field: RESULT_FIELDS.denominator,
            text: numberText(row, RESULT_FIELDS.denominator),
            strong: false,
          },
        ],
      });
    }
  }

  // One "as printed" line carries the audit copies of both the estimate and
  // the count cell, so the label is never ambiguous between two rows.
  // n_total. It shows here only when neither was parsed (e.g. "65%"); otherwise
  // it stays in "All extracted fields" and the evidence panel.
  const printed = [RESULT_FIELDS.estimatePrinted, RESULT_FIELDS.countPrinted].filter(
    (field) =>
      isPopulated(row, field) &&
      !(field === RESULT_FIELDS.countPrinted && (hasEvents || hasTotal))
  );
  printed.forEach((field, index) => {
    lines.push({
      id: `as-printed-${field}`,
      muted: true,
      atoms: [
        // The label is written once; a second printed cell continues under it
        // rather than competing for the same line's width.
        { kind: "label", text: index === 0 ? "as printed" : "" },
        { kind: "value", field, text: displayText(row, field), strong: false },
      ],
    });
  });

  if (lines.length === 0) {
    lines.push({
      id: "none",
      muted: true,
      atoms: [
        {
          kind: "value",
          field: RESULT_FIELDS.measureType,
          text:
            measureType === "no_effect_measure_reported"
              ? "no numeric result recorded (no effect measure reported)"
              : "no numeric result recorded",
          strong: false,
        },
      ],
    });
  }
  return lines;
}

function resultSignature(lines: ResultLine[]): string {
  return lines
    .map((line) => line.atoms.map((atom) => atom.text).join(" "))
    .join(" | ");
}

export function projectGroup(
  labels: RunLabels,
  group: FindingGroup,
  presentation: SchemaPresentation | undefined,
  paperLifted: Set<string>,
  /** fields the group header already states, so the strip does not repeat them */
  headerFields: string[] = [],
  identityCandidates: string[] = IDENTITY_COLUMN_CANDIDATES
): GroupProjection {
  const rows = group.rows;
  const fields = allFieldNames(rows).filter((field) => !RESULT_FIELD_SET.has(field));
  // A group of one shares nothing with anything: lifting its fields into a
  // "shared by all 1 findings" strip would just move the row's own values away
  // from it. Treat every populated field as row context instead.
  const agreement =
    rows.length > 1
      ? agreementOver(rows, fields)
      : {
          shared: [] as string[],
          varying: fields.filter((field) => isPopulated(rows[0], field)),
          absent: fields.filter((field) => !isPopulated(rows[0], field)),
          distinct: new Map<string, number>(),
        };

  // Column selection: the first candidate that actually varies inside the
  // group becomes the identity column, so the column always earns its width.
  const varying = new Set(agreement.varying);
  const header = new Set(headerFields);
  // Normalized first: a printed candidate is replaced by its normalized half.
  const identityField =
    identityCandidates
      .map((field) => normalizedOf(field, presentation) ?? field)
      .find((field) => varying.has(field) && !header.has(field)) ?? null;

  const comparisonVaries =
    varying.has(COMPARISON_FIELDS.group) && COMPARISON_FIELDS.group !== identityField;
  const referenceVaries = varying.has(COMPARISON_FIELDS.reference);
  const referencePopulatedSomewhere = rows.some((row) =>
    isPopulated(row, COMPARISON_FIELDS.reference)
  );
  const referenceAbsentForAll = !referencePopulatedSomewhere;
  // Some papers print the comparison group as the entity itself on every row.
  // Repeating it in its own column would be two columns saying one thing; the
  // value stays selectable in the row detail and the group says so out loud.
  const comparisonMirrorsIdentity =
    identityField !== null &&
    identityField !== COMPARISON_FIELDS.group &&
    rows.every(
      (row) => cellText(row, COMPARISON_FIELDS.group) === cellText(row, identityField)
    );
  const showComparisonColumn =
    (comparisonVaries || (referenceVaries && referencePopulatedSomewhere)) &&
    !(comparisonMirrorsIdentity && referenceAbsentForAll);

  const columnFields = new Set<string>(
    [
      identityField,
      showComparisonColumn ? COMPARISON_FIELDS.group : null,
      showComparisonColumn ? COMPARISON_FIELDS.reference : null,
    ].filter(Boolean) as string[]
  );
  // The normalized counterpart of a column field rides along with it.
  for (const field of [...columnFields]) {
    const partner = partnerField(field, presentation);
    if (partner) columnFields.add(partner.field);
  }

  // Normalized first: printed halves of a pair never take a column; they are
  // revealed from the normalized value they belong to.
  const distinguishingCandidates = orderBy(
    agreement.varying.filter(
      (field) =>
        !columnFields.has(field) &&
        !paperLifted.has(field) &&
        !header.has(field) &&
        !normalizedOf(field, presentation)
    ),
    withNormalized(DISTINGUISHING_PRIORITY, presentation)
  );

  const distinguishingFields = distinguishingCandidates.slice(
    0,
    DISTINGUISHING_COLUMN_LIMIT
  );
  const overflowFields = distinguishingCandidates.slice(DISTINGUISHING_COLUMN_LIMIT);

  const sharedChips = buildSharedChips(
    labels,
    rows,
    agreement.shared.filter((field) => !paperLifted.has(field)),
    agreement.varying,
    presentation,
    new Set(headerFields)
  );

  const projections: RowProjection[] = rows.map((row) => {
    const identity = identityField ? buildCell(labels, row, identityField, presentation) : null;
    const comparison =
      showComparisonColumn &&
      COMPARISON_FIELDS.group !== identityField &&
      !comparisonMirrorsIdentity
        ? buildCell(labels, row, COMPARISON_FIELDS.group, presentation)
        : null;
    const reference = showComparisonColumn
      ? buildCell(labels, row, COMPARISON_FIELDS.reference, presentation)
      : null;
    const comparisonType = varying.has(COMPARISON_FIELDS.type)
      ? buildCell(labels, row, COMPARISON_FIELDS.type, presentation)
      : null;
    const distinguishing = distinguishingFields.map((field) =>
      buildCell(labels, row, field, presentation)
    );
    const result = buildResult(labels, row, presentation);
    const signature = [
      identity?.text ?? "",
      comparison?.text ?? "",
      reference?.text ?? "",
      distinguishing.map((cell) => `${cell.field}=${cell.text}`).join(";"),
      resultSignature(result),
    ].join("||");

    return {
      row,
      identity,
      comparison,
      reference,
      comparisonType,
      distinguishing,
      hiddenDifferences: overflowFields,
      result,
      resultEmpty: result.length === 1 && result[0].id === "none",
      signature,
      twinNote: null,
    };
  });

  // Apparent duplicates: same rendered summary. Never merged — instead the
  // fields that actually differ are named on the row, and when nothing
  // differs at all the row says so.
  const bySignature = new Map<string, RowProjection[]>();
  for (const projection of projections) {
    const list = bySignature.get(projection.signature);
    if (list) list.push(projection);
    else bySignature.set(projection.signature, [projection]);
  }
  for (const twins of bySignature.values()) {
    if (twins.length < 2) continue;
    const twinRows = twins.map((projection) => projection.row);
    const differing = allFieldNames(twinRows).filter((field) => {
      const keys = new Set(
        twinRows.map((row) => valueKey(dataWorkspaceFieldValue(row, field)))
      );
      return keys.size > 1;
    });
    for (const projection of twins) {
      const others = twins
        .filter((twin) => twin !== projection)
        .map((twin) => `Finding ${twin.row.row_index + 1}`)
        .join(", ");
      const named = orderBy(
        differing,
        withNormalized(DISTINGUISHING_PRIORITY, presentation)
      ).slice(0, 3);
      projection.twinNote =
        differing.length > 0
          ? `Same summary as ${others} — differs in ${named
              .map(
                (field) =>
                  `${fieldLabel(labels, field)} = ${cellText(projection.row, field)}`
              )
              .join("; ")}${differing.length > named.length ? ` (+${differing.length - named.length} more fields)` : ""}`
          : `Every extracted field is identical to ${others}. Both records are kept; open the detail to compare provenance.`;
    }
  }

  return {
    group,
    shared: sharedChips.slice(0, SHARED_STRIP_LIMIT),
    sharedOverflow: sharedChips.slice(SHARED_STRIP_LIMIT),
    identityField,
    identityLabel: identityField
      ? fieldLabel(labels, identityField)
      : "Finding",
    showComparisonColumn,
    comparisonMirrorsIdentity,
    comparisonLabel:
      COMPARISON_FIELDS.group === identityField || comparisonMirrorsIdentity
        ? "Compared with"
        : "Compared groups",
    showDistinguishingColumn: distinguishingFields.length > 0,
    distinguishingFields,
    referenceAbsentForAll,
    varyingCount: agreement.varying.length,
    rows: projections,
    byRowIndex: new Map(
      projections.map((projection) => [projection.row.row_index, projection])
    ),
  };
}

/* -------------------------------------------------------------- searching */

/**
 * Literal matching over the stored value, the paper's printed wording and the
 * displayed label of a normalized value: the case-insensitive query
 * must be a literal substring of one of those three. Field names are never
 * searched. There is no synonym expansion beyond the displayed labels.
 */
export function rowMatchesQuery(
  labels: RunLabels,
  row: Row,
  query: string,
  presentation?: SchemaPresentation
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  for (const value of Object.values(row.identity)) {
    const text = dataWorkspaceValueText(value);
    if (text && text.toLowerCase().includes(needle)) return true;
  }
  for (const [field, value] of Object.entries(row.fields)) {
    if (!isPopulated(row, field)) continue;
    const text = dataWorkspaceValueText(value, row.provenance[field]);
    if (text && text.toLowerCase().includes(needle)) return true;
    const raw = rawLabelFor(row, field, presentation);
    if (raw && raw.toLowerCase().includes(needle)) return true;
  }
  // The tree displays the normalized value through prettyValue, so
  // the query must also match that displayed label (e.g. "Diarrhea" for
  // stored `diarrhoea`, "Severe diarrhea, mucositis or neutropenia" for
  // `composite_dmn_severe_toxicity`). Added to the checks above, which stay
  // as they are. The label rule covers every populated field of the row.
  for (const fieldName of allFieldNames([row])) {
    if (!isPopulated(row, fieldName)) continue;
    const label = prettyValue(
      labels,
      displayText(row, fieldName),
      fieldName,
      dataWorkspaceFieldValue(row, fieldName)
    );
    if (label.toLowerCase().includes(needle)) return true;
  }
  return false;
}

/**
 * Row indexes passing search plus the Field and Review-status filters,
 * composed exactly as the mock-up workspace drives them. The tree is always
 * built from the complete row set — this only narrows what is displayed.
 */
export function matchedRowIndexes(
  labels: RunLabels,
  rows: Row[],
  filters: {
    query: string;
    fieldFilter: string;
    statusFilter: DataWorkspaceStatusFilter;
  },
  presentation: SchemaPresentation | undefined,
  reviewStateOf: (rowIndex: number, field: string) => RowReviewState
): Set<number> {
  const matched = new Set<number>();
  for (const row of rows) {
    if (!rowMatchesQuery(labels, row, filters.query, presentation)) continue;
    if (!dataWorkspaceRowMatchesField(row, filters.fieldFilter)) continue;
    if (filters.statusFilter !== "all") {
      const targets = dataWorkspaceFieldStatusTargets(row, filters.fieldFilter);
      const hit = targets.some(
        (field) => reviewStateOf(row.row_index, field) === filters.statusFilter
      );
      if (!hit) continue;
    }
    matched.add(row.row_index);
  }
  return matched;
}

/** Fields whose OWN displayed value literally contains the query. */
export function matchingFields(row: Row, query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return allFieldNames([row]).filter((field) => {
    if (!isPopulated(row, field)) return false;
    return displayText(row, field).toLowerCase().includes(needle);
  });
}

/* ---------------------------------------------------------- shared sources */

export type SharedSource = {
  quote: string;
  location: string;
  page: number;
  source: NonNullable<Row["provenance"][string]>["sources"][number];
  rowIndexes: number[];
};

/**
 * Distinct recorded sources behind one value that several rows share. A shared
 * value is evidenced by every row that carries it, so the panel lists the
 * distinct sources and how many findings each covers rather than presenting
 * one arbitrary citation as the whole story.
 */
export function sharedSourcesFor(
  rows: Row[],
  field: string
): { sources: SharedSource[]; rowsWithoutSource: number[] } {
  const byKey = new Map<string, SharedSource>();
  const rowsWithoutSource: number[] = [];
  for (const row of rows) {
    const entries = row.provenance[field]?.sources ?? [];
    if (entries.length === 0) {
      rowsWithoutSource.push(row.row_index);
      continue;
    }
    for (const source of entries) {
      const key = `${source.location}::${source.page}::${source.quote}`;
      const existing = byKey.get(key);
      if (existing) existing.rowIndexes.push(row.row_index);
      else
        byKey.set(key, {
          quote: source.quote,
          location: source.location,
          page: source.page,
          source,
          rowIndexes: [row.row_index],
        });
    }
  }
  return {
    sources: [...byKey.values()].sort(
      (a, b) => b.rowIndexes.length - a.rowIndexes.length
    ),
    rowsWithoutSource,
  };
}

export { humanizeDataWorkspaceField, dataWorkspaceValueText };

/* ------------------------------------------------------- printed forms */

export type PrintedForm = {
  text: string;
  rowIndexes: number[];
  /** distinct (location, page, quote) sources recorded for the printed field */
  sourceCount: number;
};

/**
 * The printed forms behind one normalized value, over a scope of rows. Three
 * quantities stay separate: distinct printed forms, findings (rows) carrying
 * each, and distinct recorded sources for each.
 */
export function printedFormsFor(
  rows: Row[],
  normalizedField: string,
  presentation?: SchemaPresentation
): { printedField: string | null; forms: PrintedForm[]; rowsWithoutPrinted: number[] } {
  const partner = partnerField(normalizedField, presentation);
  if (!partner || partner.role !== "as printed") {
    return { printedField: null, forms: [], rowsWithoutPrinted: [] };
  }
  const byText = new Map<string, { rowIndexes: number[]; sources: Set<string> }>();
  const rowsWithoutPrinted: number[] = [];
  for (const row of rows) {
    if (!isPopulated(row, partner.field)) {
      rowsWithoutPrinted.push(row.row_index);
      continue;
    }
    const text = displayText(row, partner.field);
    const entry = byText.get(text) ?? { rowIndexes: [], sources: new Set<string>() };
    entry.rowIndexes.push(row.row_index);
    for (const source of row.provenance[partner.field]?.sources ?? []) {
      entry.sources.add(`${source.location}::${source.page}::${source.quote}`);
    }
    byText.set(text, entry);
  }
  return {
    printedField: partner.field,
    forms: [...byText.entries()]
      .map(([text, entry]) => ({
        text,
        rowIndexes: entry.rowIndexes,
        sourceCount: entry.sources.size,
      }))
      .sort((a, b) => b.rowIndexes.length - a.rowIndexes.length || a.text.localeCompare(b.text)),
    rowsWithoutPrinted,
  };
}

/* ------------------------------------------------------------ study tree */

export type TreeNode = {
  key: string;
  depth: number;
  /** field whose value this node stands for; null at the root */
  field: string | null;
  tier: TreeTierId | null;
  valueText: string;
  populated: boolean;
  rows: Row[];
  /** path from the paper to this node */
  path: { field: string; text: string }[];
  /** fields constant here and not already shown higher up (internal nodes) */
  lifted: SharedChip[];
  liftedOverflow: SharedChip[];
  /** how this node's children were made */
  split: { tier: TreeTierId; field: string } | null;
  children: TreeNode[];
  /** set when the node is a findings table */
  projection: GroupProjection | null;
};

const EMPTY_KEY = "∅";

/**
 * order of importance (who → compared → measured, or measured before
 * compared); inside a tier the split is the varying candidate that makes the
 * most other fields constant, weighted by child size, ÷ log2(values + 1).
 * A field splits only once its TREE_PARENTS are constant. A level with one
 * value is never made; its value is lifted into the node. A node with
 * ≤ TREE_TABLE_MAX findings, or whose remaining splits would have more values
 * than half its findings, is a findings table. Results and printed halves of
 * pairs never become levels. Always built from all of the paper's rows —
 * filters only hide nodes, they never reshape the tree.
 */
export function buildTieredTree(
  labels: RunLabels,
  rows: Row[],
  presentation: SchemaPresentation | undefined,
  paperLifted: Set<string>,
  order: TreeOrder
): TreeNode {
  const fields = allFieldNames(rows).filter((field) => !normalizedOf(field, presentation));
  const keys = new Map<number, Map<string, string>>();
  for (const row of rows) {
    const map = new Map<string, string>();
    for (const field of fields) {
      map.set(
        field,
        isPopulated(row, field) ? valueKey(dataWorkspaceFieldValue(row, field)) : EMPTY_KEY
      );
    }
    keys.set(row.row_index, map);
  }
  const keyOf = (row: Row, field: string) => keys.get(row.row_index)?.get(field) ?? EMPTY_KEY;
  const distinct = (group: Row[], field: string) => new Set(group.map((row) => keyOf(row, field))).size;
  const tiers = TREE_TIER_ORDER[order].map((tier) => ({ tier, fields: TREE_TIERS[tier].fields }));

  const score = (group: Row[], field: string) => {
    const buckets = new Map<string, Row[]>();
    for (const row of group) {
      const key = keyOf(row, field);
      const list = buckets.get(key);
      if (list) list.push(row);
      else buckets.set(key, [row]);
    }
    let gained = 0;
    for (const bucketRows of buckets.values()) {
      let constant = 0;
      for (const other of fields) if (other !== field && distinct(bucketRows, other) === 1) constant += 1;
      gained += bucketRows.length * constant;
    }
    return gained / group.length / Math.log2(buckets.size + 1);
  };

  const withPartner = (field: string) => {
    const partner = partnerField(field, presentation);
    return partner ? [field, partner.field] : [field];
  };

  const build = (
    group: Row[],
    depth: number,
    key: string,
    node: Pick<TreeNode, "field" | "tier" | "valueText" | "populated" | "path">,
    shownAbove: Set<string>
  ): TreeNode => {
    const constant = fields.filter(
      (field) => !shownAbove.has(field) && !RESULT_FIELD_SET.has(field) && distinct(group, field) === 1
    );
    const shownHere = new Set([...shownAbove, ...constant.flatMap(withPartner)]);

    let split: { tier: TreeTierId; field: string } | null = null;
    if (group.length > TREE_TABLE_MAX) {
      for (const { tier, fields: candidates } of tiers) {
        const varying = candidates.filter(
          (field) =>
            distinct(group, field) > 1 &&
            distinct(group, field) <= group.length / 2 &&
            (TREE_PARENTS[field] ?? []).every((parent) => distinct(group, parent) === 1)
        );
        if (varying.length === 0) continue;
        const best = varying.reduce((a, b) => {
          const sa = score(group, a);
          const sb = score(group, b);
          return sb > sa || (sb === sa && candidates.indexOf(b) < candidates.indexOf(a)) ? b : a;
        });
        split = { tier, field: best };
        break;
      }
    }

    const base = { key, depth, ...node, rows: group };
    if (!split) {
      const findingGroup: FindingGroup = {
        key,
        label: node.valueText,
        kind: "normalized",
        kindNote: "",
        rows: group,
        reportedAs: [],
        categoryText: null,
      };
      const headerFields = node.path.flatMap((step) => withPartner(step.field));
      return {
        ...base,
        lifted: [],
        liftedOverflow: [],
        split: null,
        children: [],
        projection: projectGroup(
          labels,
          findingGroup,
          presentation,
          new Set([...paperLifted, ...shownAbove]),
          headerFields,
          TREE_IDENTITY_CANDIDATES[order]
        ),
      };
    }

    const agreement = agreementOver(group, constant);
    const chips = depth === 0
      ? []
      : buildSharedChips(
          labels,
          group,
          agreement.shared.filter((field) => !paperLifted.has(field) && field !== node.field),
          [],
          presentation,
          new Set(node.field ? withPartner(node.field) : [])
        );

    const buckets = new Map<string, Row[]>();
    for (const row of group) {
      const bucketKey = keyOf(row, split.field);
      const list = buckets.get(bucketKey);
      if (list) list.push(row);
      else buckets.set(bucketKey, [row]);
    }
    const splitField = split.field;
    const splitTier = split.tier;
    const children = [...buckets.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([bucketKey, childRows]) => {
        const populated = bucketKey !== EMPTY_KEY;
        const valueText = populated ? displayText(childRows[0], splitField) : "not recorded";
        return build(
          childRows,
          depth + 1,
          `${key}|${splitField}=${bucketKey}`,
          {
            field: splitField,
            tier: splitTier,
            valueText,
            populated,
            path: [...node.path, { field: splitField, text: valueText }],
          },
          new Set([...shownHere, ...withPartner(splitField)])
        );
      });

    return {
      ...base,
      lifted: chips.slice(0, SHARED_STRIP_LIMIT),
      liftedOverflow: chips.slice(SHARED_STRIP_LIMIT),
      split,
      children,
      projection: null,
    };
  };

  return build(
    rows,
    0,
    `tree:${order}`,
    { field: null, tier: null, valueText: "", populated: true, path: [] },
    new Set(paperLifted)
  );
}

function paperLiftedOf(paperContext: ReturnType<typeof buildPaperContext> | null): Set<string> {
  return new Set<string>([
    ...(paperContext?.lifted.map((chip) => chip.field) ?? []),
    ...(paperContext?.lifted.flatMap((chip) => (chip.partner ? [chip.partner.field] : [])) ?? []),
    ...(paperContext?.citation.filter((entry) => entry.populated).map((entry) => entry.field) ?? []),
  ]);
}

export function buildPaperTree(
  labels: RunLabels,
  rows: Row[],
  presentation: SchemaPresentation | undefined,
  order: TreeOrder
): TreeNode {
  const paperContext = rows.length > 0 ? buildPaperContext(labels, rows, presentation) : null;
  return buildTieredTree(labels, rows, presentation, paperLiftedOf(paperContext), order);
}

export function treeLeaves(node: TreeNode): TreeNode[] {
  return node.projection ? [node] : node.children.flatMap(treeLeaves);
}
