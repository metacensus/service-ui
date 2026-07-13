import { describe, expect, it } from "vitest";
import type { Row, SchemaField, SchemaPresentation } from "../types";
import {
  buildDataWorkspaceFieldOptionGroups,
  dataWorkspaceFieldValue,
} from "./dataWorkspace";

const presentation: SchemaPresentation = {
  groups: [
    {
      id: "context",
      label: "Context",
      fields: ["variant", "outcome", "treatment", "empty_context"],
    },
    {
      id: "results",
      label: "Results",
      fields: ["n_events", "effect_size"],
    },
  ],
  field_roles: {
    variant: ["subgroup", "reported_value"],
    outcome: ["outcome", "reported_value"],
    treatment: ["exposure", "reported_value"],
    n_events: ["count"],
    effect_size: ["effect_estimate"],
  },
};

const row: Row = {
  row_index: 0,
  identity: { variant: "DPYD*2A" },
  fields: {
    outcome: "toxicity",
    treatment: "fluorouracil",
    n_events: 4,
    effect_size: 2.1,
    empty_context: null,
    note: "reported subgroup",
  },
  provenance: {},
};

function schemaField(
  name: string,
  identityDimension = false
): SchemaField {
  return {
    name,
    type: "string",
    required: false,
    identity_dimension: identityDimension,
    description: null,
    non_null_count: 1,
    total_count: 1,
    fill_rate: 1,
    papers_populating: 1,
    distinct_values: 1,
  };
}

describe("data workspace schema presentation", () => {
  it("reads identity values even when they are not duplicated in fields", () => {
    expect(dataWorkspaceFieldValue(row, "variant")).toBe("DPYD*2A");
  });

  it("groups field filters using identity flags and explicit semantic roles", () => {
    const groups = buildDataWorkspaceFieldOptionGroups(
      [
        schemaField("variant", true),
        schemaField("effect_size"),
        schemaField("outcome"),
        schemaField("unmapped"),
      ],
      presentation
    );
    expect(groups.map((group) => [group.id, group.options.map((o) => o.value)])).toEqual([
      ["key", ["variant"]],
      ["results", ["effect_size"]],
      ["context", ["outcome"]],
      ["other", ["unmapped"]],
    ]);
  });
});
