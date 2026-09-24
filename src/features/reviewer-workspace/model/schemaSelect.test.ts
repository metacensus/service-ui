import { beforeAll, describe, expect, it } from "vitest";
import {
  categoriesFor,
  categoryLabel,
  itemLabel,
  rowMatcher,
  selectionOfTermKeys,
  termCount,
  termsOf,
  VARIANT_CATEGORIES,
  type LayerGroup,
  type PaperIndex,
  type SchemaIndex,
  type Term,
} from "./schemaSelect";

const withIndex = (name: string, body: () => void) =>
    { timeout: 60000 },
    body
  );

function paperIndex(over: Partial<PaperIndex> = {}): PaperIndex {
  return {
    paper_id: "p1",
    title: "P1",
    row_count: 10,
    categories: {
      Variants: { dpyd_variant: 4 },
      "Study context": {},
      Outcomes: {},
      Results: {},
    },
    items: {
      Variants: { dpyd_variant: { x: 4 } },
      "Study context": {},
      Outcomes: {},
      Results: {},
    },
    ...over,
  };
}

function indexWith(papers: PaperIndex[]): SchemaIndex {
  return {
    run_id: "run-x",
    layers: {
      Variants: { category_field: "entity_locus_type", item_field: "entity_id" },
      "Study context": { category_field: "study_design_id", item_field: null },
      Outcomes: { category_field: "outcome_category", item_field: "outcome_id" },
      Results: { category_field: "effect_size_type", item_field: null },
    },
    papers,
  };
}

const catalog = (_group: LayerGroup) => VARIANT_CATEGORIES;

describe("termsOf", () => {
  it("a bare category becomes an Any term", () => {
    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatchObject({ group: "Variants", label: "DPYD variants" });
  });

    const terms = termsOf(
      catalog,
    );
    expect(terms).toHaveLength(1);
    expect(terms[0].category.values).toEqual(["dpyd_variant", "dpyd_haplotype_or_variant_group"]);
  });

  it("a Paper pick becomes its own term", () => {
    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatchObject({ group: "Paper", item: "p9", label: "P 9" });
  });
});

describe("termCount", () => {
  it("counts a bare category across its folded values", () => {
    const paper = paperIndex();
    expect(termCount(paper, term)).toBe(4);
  });

  it("a Paper term matches every finding of its paper and none of another", () => {
    const paper = paperIndex({ paper_id: "p1", row_count: 10 });
    const term: Term = { key: "Paper|p1", group: "Paper", category: { key: "paper", label: "Papers", values: [] }, item: "p1", label: "P1" };
    expect(termCount(paper, term)).toBe(10);
    expect(termCount(paper, { ...term, item: "p2", key: "Paper|p2" })).toBe(0);
  });
});

describe("rowMatcher", () => {
  const row = (fields: Record<string, string>) => ({ row_index: 0, fields, provenance: {} }) as never;

  it("ORs items within a group", () => {
    const index = indexWith([paperIndex()]);
    const match = rowMatcher(terms, index, "any", "p1");
    expect(match(row({ entity_locus_type: "dpyd_variant", entity_id: "x" }))).toBe(true);
    expect(match(row({ entity_locus_type: "dpyd_variant", entity_id: "y" }))).toBe(true);
    expect(match(row({ entity_locus_type: "dpyd_variant", entity_id: "z" }))).toBe(false);
  });

  it("any across groups ORs; all across groups ANDs", () => {
    const index = indexWith([paperIndex()]);
    const terms = termsOf(
      { Variants: { dpyd_variant: ["x"] }, Outcomes: { diarrhoea: [] } },
      (group) =>
        group === "Outcomes"
          ? [{ key: "diarrhoea", label: "Diarrhea", values: ["diarrhoea"] }]
          : catalog(group),
      new Map()
    );
    const both = { entity_locus_type: "dpyd_variant", entity_id: "x", outcome_category: "diarrhoea" };
    const variantOnly = { entity_locus_type: "dpyd_variant", entity_id: "x", outcome_category: "other" };
    expect(rowMatcher(terms, index, "any", "p1")(row(variantOnly))).toBe(true);
    expect(rowMatcher(terms, index, "all", "p1")(row(variantOnly))).toBe(false);
    expect(rowMatcher(terms, index, "all", "p1")(row(both))).toBe(true);
  });

  it("a Paper term matches every row of its paper", () => {
    const index = indexWith([paperIndex()]);
    const match = rowMatcher(terms, index, "any", "p1");
    expect(match(row({}))).toBe(true);
    expect(rowMatcher(terms, index, "any", "p2")(row({}))).toBe(false);
  });
});

describe("itemLabel", () => {
  const curated = new Map([["entity_id:known_x", "c.1236G>A"]]);

  it("curated first, with the DPYD c. prefix rule outside the DPYD chip", () => {
  });

  });
});

describe("term keys ↔ selection", () => {

  it("round-trips term keys through the selection, in order", () => {
    const keys = [
      "Outcomes|toxicity_overall_or_global",
      "Paper|p9",
    ];
    const mixed = (group: LayerGroup) =>
      group === "Outcomes"
        ? [{ key: "toxicity_overall_or_global", label: "Overall toxicity", values: ["toxicity_overall_or_global"] }]
        : catalog(group);
    const selection = selectionOfTermKeys(keys, mixed, ["p9"]);
    expect(selection).toEqual({
      Variants: {
      },
      Outcomes: { toxicity_overall_or_global: [] },
      Paper: ["p9"],
    });
    // termsOf orders terms by GROUPS.
    expect(terms.map((term) => term.key)).toEqual([
      "Outcomes|toxicity_overall_or_global",
      "Paper|p9",
    ]);
  });

  it("drops unknown groups, categories, items and papers; dedupes", () => {
    const selection = selectionOfTermKeys(
      [
        "Bogus|a",
        "Variants|bogus_category",
        "Variants|dpyd_variant|x|extra",
        "Variants|dpyd_variant|x",
        "Variants|dpyd_variant|x",
        "Paper|p-missing",
        "Paper|p9",
        "Paper",
      ],
      catalog,
      ["p9"]
    );
    expect(selection).toEqual({
      Variants: { dpyd_variant: ["x"] },
      Paper: ["p9"],
    });
  });
});

describe("categoryLabel", () => {
    expect(
  });
});

withIndex("export-backed HapB3 checks", () => {
  // Read in beforeAll, not here: describe bodies run even when skipped.
  const paperById = (index: SchemaIndex, id: string) =>
    index.papers.find((paper) => paper.paper_id === id)!;

  it("43 papers with the variant chip counts", () => {
    expect(index.papers).toHaveLength(43);
    const count = (label: string) => {
      const chip = VARIANT_CATEGORIES.find((category) => category.label === label)!;
      return index.papers.filter((paper) =>
        chip.values.some((value) => (paper.categories.Variants[value] ?? 0) > 0)
      ).length;
    };
    expect(count("DPYD variants")).toBe(42);
    expect(count("DPYD haplotypes & groups")).toBe(24);
    expect(count("Other genes")).toBe(19);
    expect(count("Phenotype markers")).toBe(13);
    expect(count("Other")).toBe(31);
  });

  it("DPYD variants has 182 items corpus-wide: 29 shown", () => {
    const corpus = new Map<string, number>();
    for (const paper of index.papers) {
      const seen = new Set(Object.keys(paper.items.Variants.dpyd_variant ?? {}));
      for (const item of seen) corpus.set(item, (corpus.get(item) ?? 0) + 1);
    }
    const shown = [...corpus.values()].filter((n) => n > 1).length;
    expect(corpus.size).toBe(182);
    expect(shown).toBe(29);
  });

    const curated = new Map<string, string>();
    const forPapers = (terms: Term[]) => index.papers.filter((paper) => terms.some((term) => termCount(paper, term) > 0));
    const hapb3 = termsOf(
      { Variants: { dpyd_haplotype_or_variant_group: ["dpyd_hapb3"] } },
      curated
    );
    const hapb3Papers = forPapers(hapb3);
    expect(hapb3Papers.map((paper) => paper.paper_id).sort()).toEqual(
      ["etienne_grimaldi_2017_28481884", "Lee_2016_26658227"].sort()
    );
    const withTag = termsOf(
      curated
    );
    const tagged = forPapers(withTag);
    expect(tagged).toHaveLength(8);
    const lee = paperById(index, "Lee_2016_26658227");
    expect(lee.row_count).toBe(191);
    expect(hapb3.reduce((sum, term) => sum + termCount(lee, term), 0)).toBe(12);
    expect(withTag.reduce((sum, term) => sum + termCount(lee, term), 0)).toBe(29);
  });
});
