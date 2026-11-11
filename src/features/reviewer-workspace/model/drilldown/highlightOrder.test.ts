import { beforeAll, describe, expect, it } from "vitest";
import { demoReachable, exportJson, loadExportRows } from "../../data/loadExportRows.testutil";
import { NO_LABELS } from "../../data/snapshot";
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

const DEMO_UP = await demoReachable();
const withExport = (name: string, body: () => void) =>
  describe.skipIf(!DEMO_UP)(
    DEMO_UP ? name : `${name} (skipped: no demo at DEMO_BASE_URL)`,
    { timeout: 120000 },
    body
  );

async function loadPaper(paperId: string): Promise<{ rows: Row[]; presentation?: SchemaPresentation }> {
  const rows = await loadExportRows(paperId);
  const config = await exportJson<{ schema_presentation?: SchemaPresentation }>("demo_config.json");
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

  it("keeps sibling branches in the given order, equal counts included, whatever their row-level shares", () => {
    const levels: FindingLevel[][] = [["table", "table"], ["table"], ["row"]];
    const root = fakeNode({
      rows: [],
      children: levels.map((group, i) => fakeNode({ key: `child-${i}`, rows: group.map((level) => rowAt(level)) })),
    });
    // Shares 0, 0, 1: the equal-count pair child-1, child-2 still keeps its order.
    expect(orderByHighlight(root).children.map((child) => child.key)).toEqual(["child-0", "child-1", "child-2"]);
  });

  it("never mutates the input tree", () => {
    const rows = [rowAt("table"), rowAt("row")];
    const leaf = fakeNode({ key: "leaf", rows, projection: {} as NonNullable<TreeNode["projection"]> });
    const children = [leaf];
    const reordered = orderByHighlight(fakeNode({ rows: [], children }));
    expect(reordered.children[0].rows).toEqual([rows[1], rows[0]]);
    expect(leaf.rows).toBe(rows);
    expect(rows.map((row) => findingLevelOf(row))).toEqual(["table", "row"]);
    expect(children).toEqual([leaf]);
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
  Boige_2016_26794347: { variant_first: [10, 15, 0], outcome_first: [10, 21, 0] },
  Lee_2016_26658227: { variant_first: [10, 25, 0], outcome_first: [10, 25, 0] },
  falvella_2015_25782327: { variant_first: [9, 22, 0], outcome_first: [9, 21, 0] },
  Jennings_2013_24167597: { variant_first: [10, 23, 0], outcome_first: [2, 8, 0] },
  Schwab_2008_18299612: { variant_first: [9, 22, 0], outcome_first: [10, 24, 0] },
  Amstutz_2009_19530960: { variant_first: [9, 21, 0], outcome_first: [0, 0, 136] },
  Kleibl_2009_19473056: { variant_first: [0, 0, 46], outcome_first: [0, 0, 46] },
  froehlich_2015_24923815: { variant_first: [0, 0, 58], outcome_first: [2, 4, 0] },
  Loganayagam_2013_23736036: { variant_first: [0, 13, 10], outcome_first: [0, 13, 10] },
  Rosmarin_2015_24647007: { variant_first: [1, 3, 0], outcome_first: [1, 2, 0] },
};

const D949V = [53, 55, 57, 59, 61, 63, 65];
const V732I = [52, 54, 56, 58, 60, 62, 64];
const BOIGE_VARIANT_FIRST12 = [54, 56, 58, 60, 62, 64, 66, 69, 72, 52, 76, 99];
const BOIGE_VARIANT_D949V_POS = [22, 12, 13, 14, 15, 16, 17];
const BOIGE_OUTCOME_FIRST12 = [62, 154, 156, 157, 158, 159, 160, 161, 162, 163, 155, 63];
const BOIGE_OUTCOME_D949V_POS = [146, 47, 65, 101, 83, 11, 29];

withExport("highlight order export-backed", () => {
  // Read in beforeAll, not here: describe bodies run even when skipped.
  const cache = new Map<string, { rows: Row[]; presentation?: SchemaPresentation }>();
  beforeAll(async () => {
    for (const paperId of PAPERS) cache.set(paperId, await loadPaper(paperId));
  }, 120000);
  const paper = (paperId: string) => cache.get(paperId)!;

  function reorderedSequence(paperId: string, order: TreeOrder): number[] {
    const { rows, presentation } = paper(paperId);
    const tree = orderByHighlight(buildPaperTree(NO_LABELS, rows, presentation, order));
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

  it("orders every node's sibling branches by finding count, largest first", () => {
    const visit = (node: TreeNode, label: string) => {
      const counts = node.children.map((child) => child.rows.length);
      for (let i = 1; i < counts.length; i += 1) {
        expect(counts[i], `${label} ${node.key} ${counts.join(",")}`).toBeLessThanOrEqual(counts[i - 1]);
      }
      for (const child of node.children) visit(child, label);
    };
    for (const paperId of PAPERS) {
      for (const order of ["variant_first", "outcome_first"] as const) {
        const { rows, presentation } = paper(paperId);
        visit(orderByHighlight(buildPaperTree(NO_LABELS, rows, presentation, order)), `${paperId} ${order}`);
      }
    }
  });

  it("Lee by variant: the FOLFOX branch precedes its No drug given sibling", () => {
    const { rows, presentation } = paper("Lee_2016_26658227");
    const regimens = orderByHighlight(buildPaperTree(NO_LABELS, rows, presentation, "variant_first")).children;
    expect(regimens.map((child) => [child.field, child.valueText, child.rows.length])).toEqual([
      ["fp_exposure_id", "folfox", 242],
      ["fp_exposure_id", "no drug exposure", 4],
    ]);
  });

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
