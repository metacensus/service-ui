import type { Row, SchemaPresentation } from "../../types";
import type { TreeOrder } from "./fieldMap";
import { buildPaperTree, treeLeaves, type TreeNode } from "./groupedFindings";
import {
  classifySource,
  clickableResultFields,
  findingLevel,
  findingLevelOf,
  levelRank,
  MULTI_ROW_SPAN,
  orderByHighlight,
  type FindingLevel,
} from "./highlightOrder";

const withExport = (name: string, body: () => void) =>
    { timeout: 120000 },
    body
  );

  return { rows, presentation: config.schema_presentation };
}

/** A row with the given populated result fields and provenance sources. */
function rowWith(
  fields: Record<string, unknown>,
  provenance: Record<string, { sources: unknown[] }>
): Row {
  return {
    row_index: 0,
    identity: {},
    fields,
    provenance: provenance as Row["provenance"],
  };
}

const rect = (y: number, h: number) => ({ x: 0.1, y, w: 0.5, h });
const source = (over: Record<string, unknown> = {}) => ({
  quote: "q",
  location: "tables/table_1.md",
  page: 3,
  resolution: "exact",
  highlight: [{ page: 3, rects: [rect(0.4, 0.01)] }],
  ...over,
});

describe("classifySource", () => {
  it("classifies a table_region source as table", () => {
    expect(classifySource(source({ resolution: "table_region" }))).toBe("table");
  });

  it("classifies a figure_region source as figure", () => {
    expect(classifySource(source({ resolution: "figure_region" }))).toBe("figure");
  });

  it("classifies page_only as page_only, even with rects", () => {
    expect(classifySource(source({ resolution: "page_only" }))).toBe("page_only");
  });

  it("classifies a sourceless field as none", () => {
    expect(classifySource(null)).toBe("none");
    expect(classifySource(undefined)).toBe("none");
    expect(
      classifySource(source({ resolution: "exact", highlight: [{ page: 3, rects: [] }] }))
    ).toBe("none");
  });

  it("classifies a partial_quote source as partial_sentence", () => {
    expect(
      classifySource(source({ resolution: "partial_quote", location: "sections/intro.md" }))
    ).toBe("partial_sentence");
  });

  it("classifies an exact in-tables one-row source as row", () => {
    expect(classifySource(source())).toBe("row");
  });

  it(`classifies an exact in-tables span over ${MULTI_ROW_SPAN} as multi_row`, () => {
    expect(
      classifySource(source({ highlight: [{ page: 3, rects: [rect(0.4, MULTI_ROW_SPAN + 0.01)] }] }))
    ).toBe("multi_row");
  });

  it("classifies an exact in-tables source on two pages as multi_row", () => {
    expect(
      classifySource(
        source({
          highlight: [
            { page: 3, rects: [rect(0.4, 0.01)] },
            { page: 4, rects: [rect(0.4, 0.01)] },
          ],
        })
      )
    ).toBe("multi_row");
  });

  it("classifies an exact in-figures source as caption", () => {
    expect(classifySource(source({ location: "figures/fig_1.md" }))).toBe("caption");
  });

  it("classifies an exact in-sections source as sentence", () => {
    expect(classifySource(source({ location: "sections/results.md" }))).toBe("sentence");
  });

  it("classifies an unknown resolution as other:<resolution>", () => {
    expect(classifySource(source({ resolution: "fuzzy_match" }))).toBe("other:fuzzy_match");
  });
});

describe("findingLevel", () => {
  it("is other with no kinds", () => {
    expect(findingLevel([])).toBe("other");
  });

  it("is table when any kind is table or figure", () => {
    expect(findingLevel(["row", "table"])).toBe("table");
    expect(findingLevel(["sentence", "figure"])).toBe("table");
  });

  it("is row when every kind is rowish", () => {
    expect(findingLevel(["row", "sentence", "caption", "partial_sentence"])).toBe("row");
  });

  it("is other when no table box but some field is page_only, multi_row or none", () => {
    expect(findingLevel(["row", "page_only"])).toBe("other");
    expect(findingLevel(["row", "multi_row"])).toBe("other");
    expect(findingLevel(["row", "none"])).toBe("other");
  });
});

describe("findingLevelOf", () => {
  it("uses sources[0] of the populated clickable result fields", () => {
    const row = rowWith({ effect_size: 1.5, p_value: 0.01 }, {
      effect_size: { sources: [source()] },
      p_value: { sources: [source({ resolution: "table_region" })] },
    });
    expect(clickableResultFields(row)).toEqual(["effect_size", "p_value"]);
    expect(findingLevelOf(row)).toBe("table");
  });

  it("is other when the finding has no result fields", () => {
    expect(findingLevelOf(rowWith({ outcome_raw: "x" }, {}))).toBe("other");
  });
});

describe("levelRank", () => {
  it("ranks row 0, other 1, table 2", () => {
    expect(levelRank("row")).toBe(0);
    expect(levelRank("other")).toBe(1);
    expect(levelRank("table")).toBe(2);
  });
});

function fakeNode(over: Partial<TreeNode> & { rows: Row[]; children?: TreeNode[] }): TreeNode {
  return {
    key: "k",
    depth: 0,
    field: null,
    tier: null,
    valueText: "",
    populated: true,
    path: [],
    lifted: [],
    liftedOverflow: [],
    split: null,
    projection: null,
    children: [],
    ...over,
  };
}

const SOURCE_OF = { row: source(), table: source({ resolution: "table_region" }), other: source({ resolution: "page_only" }) };
const rowAt = (level: FindingLevel) => rowWith({ effect_size: 1 }, { effect_size: { sources: [SOURCE_OF[level]] } });

describe("orderByHighlight", () => {
  it("sorts findings-table rows stably by rank", () => {
    const before = [rowAt("table"), rowAt("other"), rowAt("row"), rowAt("other")];
    const node = fakeNode({ rows: before, projection: {} as NonNullable<TreeNode["projection"]> });
    const after = orderByHighlight(node).rows;
    expect(after.map((row) => findingLevelOf(row))).toEqual(["row", "other", "other", "table"]);
    expect(after[1]).toBe(before[1]);
    expect(after[2]).toBe(before[3]);
  });

    const root = fakeNode({
      rows: [],
      children: levels.map((group, i) => fakeNode({ key: `child-${i}`, rows: group.map((level) => rowAt(level)) })),
    });
  });

  it("never mutates the input tree", () => {
  });
});

const EXPECTED_LEVELS: Record<string, { row: number; table: number; other: number }> = {
  Boige_2016_26794347: { row: 148, table: 31, other: 28 },
  Lee_2016_26658227: { row: 128, table: 62, other: 56 },
  falvella_2015_25782327: { row: 59, table: 12, other: 7 },
  Jennings_2013_24167597: { row: 261, table: 86, other: 4 },
  Schwab_2008_18299612: { row: 119, table: 16, other: 37 },
  Amstutz_2009_19530960: { row: 151, table: 245, other: 0 },
  Kleibl_2009_19473056: { row: 136, table: 215, other: 56 },
  froehlich_2015_24923815: { row: 114, table: 134, other: 78 },
  Loganayagam_2013_23736036: { row: 202, table: 68, other: 7 },
  Rosmarin_2015_24647007: { row: 337, table: 431, other: 79 },
};
const PAPERS = Object.keys(EXPECTED_LEVELS);

// Reading the fully expanded, unfiltered reordered tree top to bottom
// (`treeLeaves` in order, concatenating each leaf's `rows`): row-level
// findings among the first 10, among the first 25, and the position of the
// first row-level finding — for By variant and By outcome.
const EXPECTED_STATS: Record<string, Record<TreeOrder, [number, number, number]>> = {
};

const D949V = [53, 55, 57, 59, 61, 63, 65];
const V732I = [52, 54, 56, 58, 60, 62, 64];

withExport("highlight order export-backed", () => {
  const cache = new Map<string, { rows: Row[]; presentation?: SchemaPresentation }>();

  function reorderedSequence(paperId: string, order: TreeOrder): number[] {
    const { rows, presentation } = paper(paperId);
    return treeLeaves(tree).flatMap((leaf) => leaf.rows.map((row) => row.row_index));
  }

  const levelsOf = (paperId: string) => {
    const { rows } = paper(paperId);
    const counts = { row: 0, table: 0, other: 0 };
    for (const row of rows) counts[findingLevelOf(row)] += 1;
    return counts;
  };

  const statsOf = (paperId: string, order: TreeOrder): [number, number, number] => {
    const { rows } = paper(paperId);
    const level = new Map(rows.map((row) => [row.row_index, findingLevelOf(row)]));
    const seq = reorderedSequence(paperId, order);
    const first10 = seq.slice(0, 10).filter((index) => level.get(index) === "row").length;
    const first25 = seq.slice(0, 25).filter((index) => level.get(index) === "row").length;
    const first = seq.findIndex((index) => level.get(index) === "row");
    return [first10, first25, first];
  };

  it("reproduces the per-paper finding levels", () => {
    for (const paperId of PAPERS) {
      expect(levelsOf(paperId), paperId).toEqual(EXPECTED_LEVELS[paperId]);
    }
  });

  it("reproduces the 10 × 2 reordered-tree stats table", () => {
    for (const paperId of PAPERS) {
      for (const order of ["variant_first", "outcome_first"] as const) {
        expect(statsOf(paperId, order), `${paperId} ${order}`).toEqual(
          EXPECTED_STATS[paperId][order]
        );
      }
    }
  });

    for (const paperId of PAPERS) {
      for (const order of ["variant_first", "outcome_first"] as const) {
        const { rows, presentation } = paper(paperId);
  it("Boige Table 3: V732I rows are row-level, D949V rows are table-level", () => {
    const { rows } = paper("Boige_2016_26794347");
    const byIndex = new Map(rows.map((row) => [row.row_index, row]));
    for (const index of V732I) expect(findingLevelOf(byIndex.get(index)!), `V732I ${index}`).toBe("row");
    for (const index of D949V) expect(findingLevelOf(byIndex.get(index)!), `D949V ${index}`).toBe("table");
  });

  it("Boige by variant: first 12 and D949V positions", () => {
    const seq = reorderedSequence("Boige_2016_26794347", "variant_first");
    expect(seq.slice(0, 12)).toEqual(BOIGE_VARIANT_FIRST12);
    for (const [i, index] of D949V.entries()) {
      expect(seq.indexOf(index), `D949V ${index}`).toBe(BOIGE_VARIANT_D949V_POS[i]);
    }
  });

  it("Boige by outcome: first 12 and D949V positions", () => {
    const seq = reorderedSequence("Boige_2016_26794347", "outcome_first");
    expect(seq.slice(0, 12)).toEqual(BOIGE_OUTCOME_FIRST12);
    for (const [i, index] of D949V.entries()) {
      expect(seq.indexOf(index), `D949V ${index}`).toBe(BOIGE_OUTCOME_D949V_POS[i]);
    }
  });
});
