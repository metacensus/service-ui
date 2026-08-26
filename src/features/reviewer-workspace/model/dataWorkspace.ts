import { displayValue } from "./display";
import type {
  ProvenanceEntry,
  Row,
  SchemaField,
  SchemaPresentation,
  SchemaSemanticRole,
} from "../types";

export type DataWorkspaceStatusFilter =
  | "all"
  | "open"
  | "approved"
  | "corrected"
  | "flagged";

export type DataWorkspaceSelectedValue = {
  paperId: string;
  rowIndex: number;
  field: string;
};

export type DataWorkspaceFieldOptionGroupId =
  | "key"
  | "results"
  | "context"
  | "other";

export type DataWorkspaceFieldOption = {
  value: string;
  label: string;
  field: SchemaField;
};

export type DataWorkspaceFieldOptionGroup = {
  id: DataWorkspaceFieldOptionGroupId;
  label: string;
  options: DataWorkspaceFieldOption[];
};

  field: string;
  label: string;
  value: unknown;
  roles: SchemaSemanticRole[];
  order: number;
};

const DATA_WORKSPACE_FIELD_OPTION_GROUPS: Array<{
  id: DataWorkspaceFieldOptionGroupId;
  label: string;
}> = [
  { id: "key", label: "Finding key" },
  { id: "results", label: "Results" },
  { id: "context", label: "Study context" },
  { id: "other", label: "Other fields" },
];

const DATA_WORKSPACE_RESULT_ROLES = new Set<SchemaSemanticRole>([
  "count",
  "percentage",
  "continuous_result",
  "effect_estimate",
  "uncertainty",
]);

const DATA_WORKSPACE_CONTEXT_ROLES = new Set<SchemaSemanticRole>([
  "citation",
  "study",
  "population",
  "exposure",
  "comparator",
  "outcome",
  "subgroup",
]);

const DATA_WORKSPACE_RESEARCH_ACRONYMS = new Set([
  "id",
  "pmid",
  "doi",
  "ci",
  "n",
  "sd",
  "ppv",
  "npv",
  "hwe",
]);

export function dataWorkspaceHasPopulatedValue(value: unknown): boolean {
  return !(
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  );
}

export function dataWorkspaceValueText(
  value: unknown,
  provenance?: ProvenanceEntry | null
): string {
  return displayValue(value, provenance);
}

export function dataWorkspaceFieldValue(row: Row, field: string): unknown {
  if (Object.prototype.hasOwnProperty.call(row.fields, field)) {
    return row.fields[field];
  }
  return row.identity[field];
}

export function dataWorkspaceFieldIsVisible(row: Row, field: string): boolean {
  return (
    dataWorkspaceHasPopulatedValue(dataWorkspaceFieldValue(row, field)) ||
    row.provenance[field]?.extraction_certainty === "abstained"
  );
}

export function buildDataWorkspaceFieldOptionGroups(
  fields: SchemaField[],
  presentation?: SchemaPresentation
): DataWorkspaceFieldOptionGroup[] {
  const optionsByGroup = new Map<
    DataWorkspaceFieldOptionGroupId,
    DataWorkspaceFieldOption[]
  >(
    DATA_WORKSPACE_FIELD_OPTION_GROUPS.map((group) => [
      group.id,
      [] as DataWorkspaceFieldOption[],
    ])
  );
  const seenFields = new Set<string>();

  for (const field of fields) {
    if (seenFields.has(field.name)) continue;
    seenFields.add(field.name);

    const option = {
      value: field.name,
      label: humanizeDataWorkspaceField(field.name),
      field,
    };
    optionsByGroup
      .get(dataWorkspaceFieldOptionGroupId(field, presentation))
      ?.push(option);
  }

  return DATA_WORKSPACE_FIELD_OPTION_GROUPS.flatMap((group) => {
    const options = optionsByGroup.get(group.id) ?? [];
    if (options.length === 0) return [];
    return [
      {
        ...group,
        options: options.sort((a, b) => a.label.localeCompare(b.label)),
      },
    ];
  });
}

export function dataWorkspaceRowMatchesField(row: Row, fieldFilter: string): boolean {
  if (fieldFilter === "all") return true;
  return dataWorkspaceFieldIsVisible(row, fieldFilter);
}

export function dataWorkspaceFieldStatusTargets(
  row: Row,
  fieldFilter: string
): string[] {
  if (fieldFilter !== "all") return [fieldFilter];
  return Object.keys(row.fields).filter((field) =>
    dataWorkspaceFieldIsVisible(row, field)
  );
}

export function humanizeDataWorkspaceField(field: string): string {
  return field
    .split("_")
    .filter(Boolean)
    .map((word) => {
      const normalized = word.toLowerCase();
      if (DATA_WORKSPACE_RESEARCH_ACRONYMS.has(normalized)) {
        return normalized.toUpperCase();
      }
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(" ");
}

function dataWorkspaceFieldOptionGroupId(
  field: SchemaField,
  presentation?: SchemaPresentation
): DataWorkspaceFieldOptionGroupId {
  if (field.identity_dimension) return "key";

  const roles = dataWorkspaceSemanticRolesForField(field, presentation);
  if (roles.some((role) => DATA_WORKSPACE_RESULT_ROLES.has(role))) {
    return "results";
  }
  if (roles.some((role) => DATA_WORKSPACE_CONTEXT_ROLES.has(role))) {
    return "context";
  }
  return "other";
}

function dataWorkspaceSemanticRolesForField(
  field: SchemaField,
  presentation?: SchemaPresentation
): SchemaSemanticRole[] {
  return dataWorkspaceSemanticRolesForFieldName(field.name, presentation);
}

function dataWorkspaceSemanticRolesForFieldName(
  name: string,
  presentation?: SchemaPresentation
): SchemaSemanticRole[] {
  const configured = presentation?.field_roles?.[name];
  const configuredRoles = Array.isArray(configured)
    ? configured
    : configured
      ? [configured]
      : [];
  return [...new Set(configuredRoles)];
}

function buildDataWorkspaceFieldEntries(
  row: Row,
  presentation?: SchemaPresentation
): DataWorkspaceFieldEntry[] {
  return dataWorkspaceOrderedFieldNames(row, presentation).flatMap(
    (field, order) => {
      const value = dataWorkspaceFieldValue(row, field);
      if (!dataWorkspaceFieldIsVisible(row, field)) return [];

      return [
        {
          field,
          label: humanizeDataWorkspaceField(field),
          value,
          roles: dataWorkspaceSemanticRolesForFieldName(field, presentation),
          order,
        },
      ];
    }
  );
}

function dataWorkspaceOrderedFieldNames(
  row: Row,
  presentation?: SchemaPresentation
): string[] {
  const fields: string[] = [];
  const seen = new Set<string>();
  const addField = (field: string) => {
    if (seen.has(field)) return;
    seen.add(field);
    fields.push(field);
  };

  for (const group of presentation?.groups ?? []) {
    group.fields.forEach(addField);
  }
  Object.keys(row.identity).forEach(addField);
  Object.keys(row.fields).forEach(addField);

  return fields;
}

  field: string;
  label: string;
  value: unknown;
  return {
    field: entry.field,
    label: entry.label,
    value: entry.value,
  };
}
