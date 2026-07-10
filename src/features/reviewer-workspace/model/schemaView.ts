import type {
  IdentityDimension,
  Manifest,
  NumericStats,
  SchemaField,
  SchemaSummary,
  TopValue,
} from "../types";

export type SchemaFieldView = {
  field: SchemaField;
  name: string;
  identityDimension: IdentityDimension | null;
  isIdentityDimension: boolean;
  fillRate: number;
  topValues: TopValue[];
  numeric?: NumericStats;
};

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
    return {
      name: field.name,
      identityDimension,
      fillRate: field.fill_rate,
      topValues: field.top_values ?? [],
      numeric: field.numeric,
    };
  });
}

  summary: SchemaSummary,
