import { describe, expect, it } from "vitest";
import type { ProvenanceEntry, Row, SchemaPresentation } from "../types";
import { displayValue, rawLabelFor } from "./display";

const abstained: ProvenanceEntry = {
  extraction_certainty: "abstained",
  reasoning: "The required supplement was unavailable.",
  sources: [],
};

describe("reviewer value display", () => {
  it("distinguishes ordinary nulls, abstentions, schema tokens, and zero", () => {
    expect(displayValue(null)).toBe("No value in extraction");
    expect(displayValue(null, abstained)).toBe(
      "not recoverable from the available source (abstained)"
    );
    expect(displayValue("not_applicable")).toBe("not applicable");
    expect(displayValue("not_stated")).toBe("not stated");
    expect(displayValue(0)).toBe("0");
  });

  it.each([null, undefined, ""])("labels an empty extraction value %s without inferring source absence", (value) => {
    expect(displayValue(value)).toBe("No value in extraction");
    expect(displayValue(value, abstained)).toBe(
      "not recoverable from the available source (abstained)"
    );
    expect(abstained.reasoning).toBe("The required supplement was unavailable.");
  });

  it("preserves nonempty values, including false and direction semantics", () => {
    expect(displayValue(false)).toBe("false");
    expect(displayValue("increased_risk_in_variant_group")).toBe("increased_risk_in_variant_group");
  });

  it("uses the explicit reported/standardized map without suffix inference", () => {
    const row: Row = {
      row_index: 0,
      identity: {},
      fields: {
        outcome_raw: "5FU-AEs",
        outcome_category: "fluoropyrimidine_attributed_toxicity_composite",
        unmapped_id: "opaque-token",
        unmapped_raw: "reported text",
      },
      provenance: {},
    };
    const presentation: SchemaPresentation = {
      reported_value_fields: { outcome_category: "outcome_raw" },
    };

    expect(rawLabelFor(row, "outcome_category", presentation)).toBe("5FU-AEs");
    expect(rawLabelFor(row, "unmapped_id", presentation)).toBeNull();
  });
});
