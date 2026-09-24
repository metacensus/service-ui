import { describe, expect, it } from "vitest";
import type {
  Manifest,
  SchemaField,
  SchemaPresentation,
  SchemaSummary,
} from "../types";
import { buildSchemaExplorerModel, spaceSchemaFieldName } from "./schemaView";

const presentation: SchemaPresentation = {
  reported_value_fields: {
    outcome_category: "outcome_raw",
  },
  reviewer_descriptions: {
    outcome_raw: "The outcome wording exactly as reported by the paper.",
    outcome_category: "The standardized outcome category used across papers.",
  },
};

function field(name: string): SchemaField {
  return {
    name,
    type: "string",
    required: true,
    identity_dimension: name === "outcome_category",
    description: "Extractor-facing instructions that should not be displayed.",
    non_null_count: 1,
    total_count: 1,
    fill_rate: 1,
    papers_populating: 1,
    distinct_values: 1,
  };
}

describe("synthesis field set characterization", () => {
  it("counts fields with synthesis roles through presentation.field_roles", () => {
    const synthesisPresentation: SchemaPresentation = {
      field_roles: {
        f_count: "count",
        f_pct: "percentage",
        f_cont: "continuous_result",
        f_effect: "effect_estimate",
        f_std: "standardized_value",
        f_unc: "uncertainty",
        f_two: ["count", "uncertainty"],
        f_outcome: "outcome",
        f_pop: "population",
      },
    };
    const names = [
      "f_count",
      "f_pct",
      "f_cont",
      "f_effect",
      "f_std",
      "f_unc",
      "f_two",
      "f_outcome",
      "f_pop",
    ];
    const summary: SchemaSummary = {
      schema_version: "v006",
      field_count: names.length,
      top_n: 25,
      fields: names.map(field),
    };
    const manifest = {
      schema_version: "v001",
      papers: [],
      identity_dimensions: [],
    } as unknown as Manifest;
    const model = buildSchemaExplorerModel(
      summary,
      manifest,
      synthesisPresentation
    );

    expect(model.overview.summarizableFieldCount).toBe(7);
  });
});

describe("spaceSchemaFieldName", () => {
  it("swaps underscores for spaces and keeps case", () => {
    expect(spaceSchemaFieldName("entity_locus_type")).toBe(
      "entity locus type"
    );
    expect(spaceSchemaFieldName("_total_n")).toBe("total n");
  });
});

describe("schema reviewer presentation", () => {
  it("uses reviewer descriptions instead of extraction guidance", () => {
    const summary: SchemaSummary = {
      schema_version: "v006",
      field_count: 2,
      top_n: 25,
      fields: [field("outcome_raw"), field("outcome_category")],
    };
    const manifest = {
      schema_version: "v001",
      papers: [],
      identity_dimensions: [],
    } as unknown as Manifest;
    const model = buildSchemaExplorerModel(summary, manifest, presentation);

    expect(model.fields.map((view) => view.field.description)).toEqual([
      presentation.reviewer_descriptions?.outcome_raw,
      presentation.reviewer_descriptions?.outcome_category,
    ]);
  });
});
