import { describe, expect, it, vi } from "vitest";


function stubFetch(body: unknown, opts: { ok?: boolean; status?: number; jsonThrows?: boolean } = {}) {
  const { ok = true, status = 200, jsonThrows = false } = opts;
  return vi.fn(async () =>
    ({
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      json: async () => {
        if (jsonThrows) throw new SyntaxError("Unexpected token");
        return body;
      },
    }) as Response
  );
}

const INDEX = {
  run_id: RUN,
  layers: {
    Variants: { category_field: "entity_locus_type", item_field: "entity_id" },
    "Study context": { category_field: "study_design_id", item_field: null },
    Outcomes: { category_field: "outcome_category", item_field: "outcome_id" },
    Results: { category_field: "effect_size_type", item_field: null },
  },
  papers: [],
};

describe("schema index URL", () => {
  });
});

describe("fetchSchemaIndex", () => {
  it("returns the index when run_id matches and papers is an array", async () => {
    const fetchFn = stubFetch(INDEX);
    expect(await fetchSchemaIndex(RUN, fetchFn)).toEqual(INDEX);
  });

  it.each([
    ["a non-ok response", stubFetch({}, { ok: false, status: 404 })],
    ["a non-JSON body (Vite SPA fallback), never an empty index", stubFetch("<html>", { jsonThrows: true })],
    ["a run_id mismatch", stubFetch({ ...INDEX, run_id: "other" })],
    ["papers that is not an array", stubFetch({ ...INDEX, papers: {} })],
  ])("throws on %s", async (_name, fetchFn) => {
    await expect(fetchSchemaIndex(RUN, fetchFn)).rejects.toThrow("Could not load the paper index for this run.");
  });
});
