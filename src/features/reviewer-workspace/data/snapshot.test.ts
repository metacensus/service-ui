
function rowWith(provenance: Record<string, unknown>) {
  return [{ row_index: 0, identity: {}, fields: {}, provenance }];
}

describe("reviewer snapshot provenance contract", () => {
  it("accepts the frozen abstention shape with an omitted provenance type", () => {
    expect(
      validatePaperRows(
        rowWith({
          hwe_p_value: {
            extraction_certainty: "abstained",
            reasoning: "The supplement is unavailable.",
            sources: [],
          },
        }),
        "Lee"
      )
    ).toHaveLength(1);
  });

  it("rejects unsupported vocabulary instead of flattening it", () => {
    expect(() =>
      validatePaperRows(
        rowWith({
          n_events: {
            type: "calculated",
            derivation_kind: "computed",
            sources: [],
          },
        }),
        "Amstutz"
      )
    ).toThrow("unsupported provenance type");
  });

  it("requires every source component to retain its source array", () => {
    expect(() =>
      validatePaperRows(
        rowWith({
          n_events: {
            type: "derived",
            derivation_kind: "derived",
            sources: [],
            source_components: [{ label: "carrier_count", value: 4 }],
          },
        }),
        "Amstutz"
      )
    ).toThrow("malformed source component");
  });
});
