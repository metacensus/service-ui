import { describe, expect, it } from "vitest";
import {
  assignedDiagramFieldNames,
  buildDiagramSections,
  buildFieldStatsView,
  concernKey,
  concernStorageKey,
  formatFillRate,
  LABEL_FAMILY_FIELDS,
  type SchemaDiagramNode,
} from "./schemaDiagram";
import type {
  SchemaExplorerModel,
  SchemaFieldView,
} from "./schemaView";

function fieldView(name: string, overrides = {}): SchemaFieldView {
  return {
    name,
    fillRate: 0.5,
    field: {
      type: "string",
      papers_populating: 10,
      distinct_values: 3,
      top_values: [],
      ...overrides,
    },
  } as unknown as SchemaFieldView;
}

const modelWith = (names: string[]) =>
  ({
    fields: names.map((name) => fieldView(name)),
  }) as unknown as SchemaExplorerModel;

const fieldNames = (sections: { nodes: SchemaDiagramNode[] }[]) =>
  sections
    .flatMap((s) => s.nodes)
    .map((n) => (n.kind === "field" ? n.view.name : ""));

describe("field assignment", () => {
  it("holds exactly the 52 names with no duplicates and no label-family fields", () => {
    const names = assignedDiagramFieldNames();
    expect(names).toHaveLength(52);
    expect(new Set(names).size).toBe(52);
    for (const name of names) {
      expect(LABEL_FAMILY_FIELDS.has(name)).toBe(false);
    }
  });

  it("skips fields absent from the summary", () => {
    const model = modelWith(["n_events", "n_total"]);
    const { sections } = buildDiagramSections(model, null, "Results");
    expect(fieldNames(sections)).toEqual(["n_events", "n_total"]);
  });

  it("lands an unassigned summary field in Results under Other schema fields, not under Paper", () => {
    const model = modelWith(["n_events", "pmid", "surprise_field"]);
    const other = buildDiagramSections(model, null, "Results").sections.find(
      (s) => s.title === "Other schema fields"
    );
    expect(fieldNames(other ? [other] : [])).toEqual(["surprise_field"]);
    expect(
      fieldNames(buildDiagramSections(model, null, "Paper").sections)
    ).not.toContain("surprise_field");
  });

  it("gives Variants with no manifest the labels-unavailable state plus field nodes", () => {
    const model = modelWith(["entity_locus_type"]);
    const { sections, labelsAvailable } = buildDiagramSections(
      model,
      null,
      "Variants"
    );
    expect(labelsAvailable).toBe(false);
    expect(sections.map((s) => s.title)).toEqual(["Schema fields"]);
  });
});

describe("fill-rate formatting", () => {
  it("formats whole percent, sub-one-percent and full", () => {
    expect(formatFillRate(0.5476)).toBe("55%");
    expect(formatFillRate(0.003)).toBe("<1%");
    expect(formatFillRate(1)).toBe("100%");
  });
});

describe("stats helpers", () => {
  it("caps top values at 5", () => {
    const values = Array.from({ length: 8 }, (_, i) => ({
      value: `v${i}`,
      count: 8 - i,
    }));
    expect(
      buildFieldStatsView(fieldView("x", { top_values: values }), 43).topValues
    ).toHaveLength(5);
  });

  it("builds the stats view in the run's units", () => {
    const view = fieldView("n_events", {
      type: "integer",
      papers_populating: 43,
      distinct_values: 572,
      top_values: [
        { value: "0", count: 1124 },
        { value: "1", count: 879 },
      ],
    });
    view.fillRate = 0.5476;
    const stats = buildFieldStatsView(view, 43);
    expect(stats.fillRate).toBe("55%");
    expect(stats.papersPopulating).toBe("43 of 43");
    expect(stats.topValues[0]).toEqual({
      value: "0",
      formattedCount: "1,124",
    });
  });
});

describe("concern storage", () => {
  it("keys concerns per run", () => {
    expect(concernStorageKey("run-a")).toBe("metacensus-schema-concerns:run-a");
    expect(concernKey("entity_id:dpyd_c1236g>a", "raw")).toBe(
      JSON.stringify(["entity_id:dpyd_c1236g>a", "raw"])
    );
  });
});
