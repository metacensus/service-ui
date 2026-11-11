import { beforeAll, describe, expect, it } from "vitest";
import { demoJson, demoReachable, EXPORT_RUN, exportJson, loadExportRows } from "../../data/loadExportRows.testutil";
import { schemaIndexUrl } from "../../data/schemaIndex";
import { NO_LABELS } from "../../data/snapshot";
import type { Manifest, Row, SchemaPresentation } from "../../types";
import { hasTextHighlight } from "../highlight";
import type { LayerGroup, SchemaIndex } from "../schemaSelect";
import { buildPaperTree, isPopulated, type TreeNode } from "./groupedFindings";
import { clickableResultFields } from "./highlightOrder";
import {
  hiddenResultFields,
  hideUnhighlightedValues,
  RESULT_VALUE_FIELDS,
} from "./textHighlight";

const DEMO_UP = await demoReachable();
const withExport = (name: string, body: () => void) =>
  describe.skipIf(!DEMO_UP)(
    DEMO_UP ? name : `${name} (skipped: no demo at DEMO_BASE_URL)`,
    { timeout: 120000 },
    body
  );

const rect = { x: 0.1, y: 0.4, w: 0.5, h: 0.01 };
const source = (over: Record<string, unknown> = {}) => ({
  quote: "q",
  location: "tables/table_1.md",
  page: 3,
  resolution: "exact",
  highlight: [{ page: 3, rects: [rect] }],
  ...over,
});
const pageOnly = () => source({ resolution: "page_only", highlight: [{ page: 3, rects: [] }] });

function rowWith(
  fields: Record<string, unknown>,
  provenance: Record<string, { sources: unknown[] }>,
  identity: Record<string, unknown> = {}
): Row {
  return { row_index: 0, identity, fields, provenance: provenance as Row["provenance"] };
}

describe("hasTextHighlight", () => {
  it("an exact source with rects has a highlight", () => {
    expect(hasTextHighlight(source())).toBe(true);
  });

  it("a page_only source with empty rects has none", () => {
    expect(hasTextHighlight(pageOnly())).toBe(false);
  });

  it("rects on an entry without a numeric page do not count", () => {
    expect(hasTextHighlight(source({ highlight: [{ rects: [rect] }] }))).toBe(false);
    expect(hasTextHighlight(source({ highlight: [{ page: null, rects: [rect] }] }))).toBe(false);
    expect(hasTextHighlight(source({ highlight: [{ page: "3", rects: [rect] }] }))).toBe(false);
  });

  it("table_region and figure_region sources with rects have a highlight", () => {
    expect(hasTextHighlight(source({ resolution: "table_region" }))).toBe(true);
    expect(hasTextHighlight(source({ resolution: "figure_region" }))).toBe(true);
  });

  it("a missing, null or empty highlight has none", () => {
    expect(hasTextHighlight(source({ highlight: undefined }))).toBe(false);
    expect(hasTextHighlight(source({ highlight: null }))).toBe(false);
    expect(hasTextHighlight(source({ highlight: [] }))).toBe(false);
    expect(hasTextHighlight(null)).toBe(false);
    expect(hasTextHighlight(undefined)).toBe(false);
  });

  it("any one entry with a page and rects is enough", () => {
    expect(hasTextHighlight(source({ highlight: [{ page: 2, rects: [] }, { page: 3, rects: [rect] }] }))).toBe(true);
  });

  it("reads only highlight geometry: resolution and the source page do not decide", () => {
    expect(hasTextHighlight(source({ resolution: "page_only" }))).toBe(true);
    expect(hasTextHighlight(source({ page: 0 }))).toBe(true);
    expect(hasTextHighlight(source({ resolution: "exact", highlight: [{ page: 3, rects: [] }] }))).toBe(false);
  });
});

describe("hideUnhighlightedValues", () => {
  it("keeps a mixed value, its highlighted sources first and each group in order", () => {
    const a = pageOnly();
    const b = source({ quote: "b" });
    const c = pageOnly();
    const d = source({ resolution: "table_region", quote: "d" });
    const sources = [a, b, c, d];
    const row = rowWith({ effect_size: 1.2 }, { effect_size: { sources } });
    const [shown] = hideUnhighlightedValues([row]);
    expect(shown.fields.effect_size).toBe(1.2);
    const after = shown.provenance.effect_size.sources as unknown[];
    expect(after).toHaveLength(4);
    [b, d, a, c].forEach((expected, index) => expect(after[index]).toBe(expected));
    expect(sources).toEqual([a, b, c, d]);
    expect(row.provenance.effect_size.sources).toBe(sources);
  });

  it("returns the row itself when its highlighted sources already come first", () => {
    const row = rowWith({ effect_size: 1.2 }, { effect_size: { sources: [source(), pageOnly()] } });
    expect(hideUnhighlightedValues([row])[0]).toBe(row);
  });

  it("reorders only result fields' sources", () => {
    const outcomeSources = [pageOnly(), source()];
    const row = rowWith(
      { effect_size: 1.2, outcome_raw: "nausea" },
      { effect_size: { sources: [pageOnly(), source()] }, outcome_raw: { sources: outcomeSources } }
    );
    const [shown] = hideUnhighlightedValues([row]);
    expect(hasTextHighlight(shown.provenance.effect_size.sources[0])).toBe(true);
    expect(shown.provenance.outcome_raw.sources).toBe(outcomeSources);
  });

  it("hides a finding whose only result values have no highlighted source", () => {
    const row = rowWith(
      { effect_size: 6.1, p_value: 0.007, outcome_raw: "diarrhoea" },
      { effect_size: { sources: [pageOnly()] }, p_value: { sources: [pageOnly(), pageOnly()] } }
    );
    expect(hideUnhighlightedValues([row])).toEqual([]);
  });

  it("hides a value with no sources at all", () => {
    const row = rowWith({ effect_size: 2, n_total: 82 }, { n_total: { sources: [source()] } });
    const [shown] = hideUnhighlightedValues([row]);
    expect(clickableResultFields(shown)).toEqual(["n_total"]);
  });

  it("hides only the unhighlighted values, from fields, identity and provenance", () => {
    const row = rowWith(
      { effect_size: 1.66, n_total: 82 },
      {
        effect_size: { sources: [pageOnly()] },
        p_value: { sources: [pageOnly()] },
        n_total: { sources: [source()] },
      },
      { p_value: 0.04 }
    );
    const [shown] = hideUnhighlightedValues([row]);
    expect(clickableResultFields(shown)).toEqual(["n_total"]);
    expect("effect_size" in shown.fields).toBe(false);
    expect("p_value" in shown.identity).toBe(false);
    expect(Object.keys(shown.provenance)).toEqual(["n_total"]);
    expect(shown.fields.n_total).toBe(82);
  });

  it("hides a finding whose effect is hidden even when its CI is highlighted", () => {
    const row = rowWith(
      { effect_size: 1.5, effect_size_ci_lower: 1.1, effect_size_ci_upper: 2 },
      {
        effect_size: { sources: [pageOnly()] },
        effect_size_ci_lower: { sources: [source()] },
        effect_size_ci_upper: { sources: [source()] },
      }
    );
    expect(hideUnhighlightedValues([row])).toEqual([]);
  });

  it("keeps a result-less finding unchanged", () => {
    const row = rowWith({ outcome_raw: "x", effect_size: "" }, { outcome_raw: { sources: [pageOnly()] } });
    const [shown] = hideUnhighlightedValues([row]);
    expect(shown).toBe(row);
  });

  it("leaves non-result fields alone, highlighted or not", () => {
    const row = rowWith(
      { effect_size: 1.2, outcome_raw: "nausea", pmid: "1" },
      { effect_size: { sources: [source()] }, outcome_raw: { sources: [pageOnly()] }, pmid: { sources: [] } }
    );
    const [shown] = hideUnhighlightedValues([row]);
    expect(shown).toBe(row);
    expect(shown.fields.outcome_raw).toBe("nausea");
  });

  it("never mutates the input rows", () => {
    const row = rowWith(
      { effect_size: 1.66, n_total: 82 },
      { effect_size: { sources: [pageOnly()] }, n_total: { sources: [source()] } },
      { effect_size: 1.66 }
    );
    const before = JSON.stringify(row);
    const [shown] = hideUnhighlightedValues([row]);
    expect(JSON.stringify(row)).toBe(before);
    expect(shown).not.toBe(row);
    expect(shown.fields).not.toBe(row.fields);
    expect(shown.provenance).not.toBe(row.provenance);
  });

  it("hides an unhighlighted printed estimate, highlighted-first sorts a kept one", () => {
    const hiddenPrinted = rowWith(
      { effect_size: 1.2, effect_estimate_as_printed_raw: "1.2 (0.3-3.3)" },
      { effect_size: { sources: [source()] }, effect_estimate_as_printed_raw: { sources: [pageOnly()] } }
    );
    const [shown] = hideUnhighlightedValues([hiddenPrinted]);
    expect("effect_estimate_as_printed_raw" in shown.fields).toBe(false);
    expect("effect_estimate_as_printed_raw" in shown.provenance).toBe(false);
    expect(shown.fields.effect_size).toBe(1.2);

    const b = source({ quote: "b" });
    const keptPrinted = rowWith(
      { effect_size: 1.2, effect_estimate_as_printed_raw: "1.2" },
      { effect_size: { sources: [source()] }, effect_estimate_as_printed_raw: { sources: [pageOnly(), b] } }
    );
    const [kept] = hideUnhighlightedValues([keptPrinted]);
    expect(kept.fields.effect_estimate_as_printed_raw).toBe("1.2");
    expect(kept.provenance.effect_estimate_as_printed_raw.sources[0]).toBe(b);
  });

  it("the printed estimate never decides whether a finding shows", () => {
    const resultLess = rowWith(
      { outcome_raw: "x", effect_estimate_as_printed_raw: "1.66-fold" },
      { effect_estimate_as_printed_raw: { sources: [pageOnly()] } }
    );
    const [kept] = hideUnhighlightedValues([resultLess]);
    expect(kept.fields.outcome_raw).toBe("x");
    expect("effect_estimate_as_printed_raw" in kept.fields).toBe(false);

    const onlyPrintedHighlighted = rowWith(
      { effect_size: 1.66, effect_estimate_as_printed_raw: "1.66-fold" },
      { effect_size: { sources: [pageOnly()] }, effect_estimate_as_printed_raw: { sources: [source()] } }
    );
    expect(hideUnhighlightedValues([onlyPrintedHighlighted])).toEqual([]);
  });

  it("keeps the order of the shown findings", () => {
    const keep = (index: number) => ({ ...rowWith({ n_total: 1 }, { n_total: { sources: [source()] } }), row_index: index });
    const drop = (index: number) => ({ ...rowWith({ n_total: 1 }, { n_total: { sources: [pageOnly()] } }), row_index: index });
    expect(hideUnhighlightedValues([keep(3), drop(1), keep(2), drop(0)]).map((row) => row.row_index)).toEqual([3, 2]);
  });
});

describe("hiddenResultFields", () => {
  it("lists populated result fields and the printed estimate without a highlighted source, in field order", () => {
    const row = rowWith(
      { effect_estimate_as_printed_raw: "1.66-fold", effect_size: 1.66, n_total: 82, outcome_raw: "x" },
      {
        effect_size: { sources: [pageOnly()] },
        n_total: { sources: [source()] },
        effect_estimate_as_printed_raw: { sources: [pageOnly()] },
        outcome_raw: { sources: [pageOnly()] },
      },
      { p_value: 0.04 }
    );
    expect(hiddenResultFields(row)).toEqual(["effect_size", "p_value", "effect_estimate_as_printed_raw"]);
  });

  it("is empty for a fully highlighted or a result-less finding", () => {
    expect(hiddenResultFields(rowWith({ effect_size: 1 }, { effect_size: { sources: [pageOnly(), source()] } }))).toEqual([]);
    expect(hiddenResultFields(rowWith({ outcome_raw: "x" }, { outcome_raw: { sources: [pageOnly()] } }))).toEqual([]);
  });
});

// [before, shown after, findings hidden, values hidden inside shown findings, result-less findings kept]
const EXPECTED: Record<string, [number, number, number, number, number]> = {
  Boige_2016_26794347: [207, 184, 23, 0, 0],
  Lee_2016_26658227: [246, 191, 55, 0, 0],
  falvella_2015_25782327: [78, 77, 1, 2, 4],
  Jennings_2013_24167597: [351, 351, 0, 0, 0],
  Schwab_2008_18299612: [172, 152, 20, 8, 10],
  Amstutz_2009_19530960: [396, 396, 0, 0, 0],
  Kleibl_2009_19473056: [407, 405, 2, 56, 3],
  froehlich_2015_24923815: [326, 300, 26, 74, 5],
  Loganayagam_2013_23736036: [277, 274, 3, 0, 4],
  Rosmarin_2015_24647007: [847, 783, 64, 6, 3],
};
const PAPERS = Object.keys(EXPECTED);
const ORDERS = ["variant_first", "outcome_first"] as const;

withExport("text highlight export-backed", () => {
  // Read in beforeAll, not here: describe bodies run even when skipped.
  let presentation: SchemaPresentation | undefined;
  const cache = new Map<string, Row[]>();
  beforeAll(async () => {
    presentation = (await exportJson<{ schema_presentation?: SchemaPresentation }>("demo_config.json"))
      .schema_presentation;
    for (const { paper_id } of (await exportJson<Manifest>("manifest.json")).papers) {
      cache.set(paper_id, await loadExportRows(paper_id));
    }
  }, 120000);
  const rowsOf = (paperId: string) => cache.get(paperId)!;

  const statsOf = (paperId: string): [number, number, number, number, number] => {
    const rows = rowsOf(paperId);
    const shown = hideUnhighlightedValues(rows);
    const byIndex = new Map(shown.map((row) => [row.row_index, row]));
    let valuesHidden = 0;
    let resultLess = 0;
    for (const row of rows) {
      if (!RESULT_VALUE_FIELDS.some((field) => isPopulated(row, field))) resultLess += 1;
      const after = byIndex.get(row.row_index);
      if (!after) continue;
      const kept = new Set(clickableResultFields(after));
      valuesHidden += clickableResultFields(row).filter((field) => !kept.has(field)).length;
    }
    return [rows.length, shown.length, rows.length - shown.length, valuesHidden, resultLess];
  };

  it("reproduces the per-paper before/after counts for the 10 demo papers", () => {
    for (const paperId of PAPERS) expect(statsOf(paperId), paperId).toEqual(EXPECTED[paperId]);
  });

  it("shows 11,967 of 12,556 findings across the 43 papers, and leaves no paper empty", () => {
    let before = 0;
    let after = 0;
    for (const paperId of cache.keys()) {
      const shown = hideUnhighlightedValues(rowsOf(paperId)).length;
      expect(shown, paperId).toBeGreaterThan(0);
      before += rowsOf(paperId).length;
      after += shown;
    }
    expect([before, after]).toEqual([12556, 11967]);
  });

  it("every shown result value and printed estimate has a highlighted source", () => {
    for (const paperId of PAPERS) {
      for (const row of hideUnhighlightedValues(rowsOf(paperId))) {
        const printed = isPopulated(row, "effect_estimate_as_printed_raw") ? ["effect_estimate_as_printed_raw"] : [];
        for (const field of [...clickableResultFields(row), ...printed]) {
          expect(
            row.provenance[field]?.sources?.some(hasTextHighlight),
            `${paperId} row ${row.row_index} ${field}`
          ).toBe(true);
        }
      }
    }
  });

  it("leaves the fetched rows unchanged", () => {
    const rows = rowsOf("froehlich_2015_24923815");
    const before = JSON.stringify(rows);
    hideUnhighlightedValues(rows);
    expect(JSON.stringify(rows)).toBe(before);
  });

  it("Boige row 125 (every result source page_only) is hidden", () => {
    const shown = hideUnhighlightedValues(rowsOf("Boige_2016_26794347"));
    expect(shown.some((row) => row.row_index === 125)).toBe(false);
  });

  it("Boige row 140 (mixed) stays and opens its highlighted source, on page 14", () => {
    const raw = rowsOf("Boige_2016_26794347").find((row) => row.row_index === 140)!;
    const row = hideUnhighlightedValues(rowsOf("Boige_2016_26794347")).find((r) => r.row_index === 140)!;
    expect(row).toBeDefined();
    const sources = row.provenance.effect_size.sources;
    expect(sources).toHaveLength(2);
    expect(hasTextHighlight(sources[0])).toBe(true);
    expect(sources[0].highlight?.find((entry) => entry.rects.length > 0)?.page).toBe(14);
    expect(sources[1].resolution).toBe("page_only");
    expect(sources).toEqual([...raw.provenance.effect_size.sources].reverse());
    expect(raw.provenance.effect_size.sources[0].resolution).toBe("page_only");
  });

  // Shown result values whose sources[0] has no text highlight: [on the fetched sources, after the rule].
  const FIRST_UNHIGHLIGHTED: Record<string, [number, number]> = {
    Boige_2016_26794347: [1, 0],
    Lee_2016_26658227: [1, 0],
    falvella_2015_25782327: [0, 0],
    Jennings_2013_24167597: [0, 0],
    Schwab_2008_18299612: [0, 0],
    Amstutz_2009_19530960: [0, 0],
    Kleibl_2009_19473056: [13, 0],
    froehlich_2015_24923815: [5, 0],
    Loganayagam_2013_23736036: [0, 0],
    Rosmarin_2015_24647007: [0, 0],
  };
  const FIRST_SOURCE_MOVED: Record<string, number[]> = {
    Boige_2016_26794347: [140],
    Lee_2016_26658227: [235],
    Kleibl_2009_19473056: [348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360],
    froehlich_2015_24923815: [52, 57, 62, 72, 77],
  };

  it("no shown result value opens on a source without a text highlight (20 → 0)", () => {
    const firstUnhighlighted = (sources: Row["provenance"][string]["sources"] | undefined) =>
      Boolean(sources && sources.length > 0 && !hasTextHighlight(sources[0]));
    for (const paperId of PAPERS) {
      const raw = new Map(rowsOf(paperId).map((row) => [row.row_index, row]));
      let before = 0;
      let after = 0;
      const moved: number[] = [];
      for (const row of hideUnhighlightedValues(rowsOf(paperId))) {
        const fetched = raw.get(row.row_index)!;
        let changed = false;
        for (const field of clickableResultFields(row)) {
          const sources = row.provenance[field]?.sources;
          if (firstUnhighlighted(fetched.provenance[field]?.sources)) before += 1;
          if (firstUnhighlighted(sources)) after += 1;
          if (sources?.[0] !== fetched.provenance[field]?.sources?.[0]) changed = true;
        }
        if (changed) moved.push(row.row_index);
      }
      expect([before, after], paperId).toEqual(FIRST_UNHIGHLIGHTED[paperId]);
      expect(moved, paperId).toEqual(FIRST_SOURCE_MOVED[paperId] ?? []);
    }
  });

  // Printed estimates hidden in shown findings (the finding stays; only the printed value goes).
  const PRINTED_HIDDEN: Record<string, number[]> = {
    Schwab_2008_18299612: [139, 140],
    Kleibl_2009_19473056: [320, 321, 328, 329, 389],
    froehlich_2015_24923815: [29, 65, 280],
  };

  it("hides 10 unhighlighted printed estimates in shown findings, without changing which findings show", () => {
    let total = 0;
    for (const paperId of PAPERS) {
      const shown = new Set(hideUnhighlightedValues(rowsOf(paperId)).map((row) => row.row_index));
      const hidden = rowsOf(paperId)
        .filter((row) => shown.has(row.row_index) && hiddenResultFields(row).includes("effect_estimate_as_printed_raw"))
        .map((row) => row.row_index);
      expect(hidden, paperId).toEqual(PRINTED_HIDDEN[paperId] ?? []);
      expect(shown.size, paperId).toBe(EXPECTED[paperId][1]);
      total += hidden.length;
    }
    expect(total).toBe(10);
  });

  it("hiddenResultFields names the values a selection must not open", () => {
    const fetched = (paperId: string, index: number) => rowsOf(paperId).find((row) => row.row_index === index)!;
    const sorted = (fields: string[]) => [...fields].sort();
    expect(sorted(hiddenResultFields(fetched("Schwab_2008_18299612", 139)))).toEqual(
      sorted(["effect_size", "p_value", "n_events", "effect_estimate_as_printed_raw"])
    );
    expect(hiddenResultFields(fetched("Boige_2016_26794347", 140))).toEqual([]);
    expect(sorted(hiddenResultFields(fetched("Boige_2016_26794347", 125)))).toEqual(
      sorted([
        "effect_size",
        "effect_size_ci_lower",
        "effect_size_ci_upper",
        "p_value",
        "n_events",
        "n_total",
        "count_as_printed_raw",
        "effect_estimate_as_printed_raw",
      ])
    );
    expect(hiddenResultFields(fetched("Kleibl_2009_19473056", 308))).toEqual(["n_total"]);
  });

  it("Schwab row 139 stays, showing only its n_total", () => {
    const row = hideUnhighlightedValues(rowsOf("Schwab_2008_18299612")).find((r) => r.row_index === 139)!;
    expect(clickableResultFields(row)).toEqual(["n_total"]);
    expect(row.fields.n_total).toBe(82);
    expect(isPopulated(row, "effect_estimate_as_printed_raw")).toBe(false);
  });

  it("no tree node is left without findings, for the 10 papers in both orders", () => {
    const visit = (node: TreeNode, label: string) => {
      expect(node.rows.length, `${label} ${node.key}`).toBeGreaterThan(0);
      for (const child of node.children) visit(child, label);
    };
    for (const paperId of PAPERS) {
      for (const order of ORDERS) {
        visit(buildPaperTree(NO_LABELS, hideUnhighlightedValues(rowsOf(paperId)), presentation, order), `${paperId} ${order}`);
      }
    }
  });
});

withExport("text highlight index cross-check", () => {
  it("the index counts only shown findings for the 10 demo papers", async () => {
    const index = await demoJson<SchemaIndex>(schemaIndexUrl(EXPORT_RUN));
    for (const paperId of PAPERS) {
      const entry = index.papers.find((paper) => paper.paper_id === paperId)!;
      const shown = hideUnhighlightedValues(await loadExportRows(paperId));
      expect(entry.row_count, paperId).toBe(shown.length);
      for (const [group, layer] of Object.entries(index.layers) as [LayerGroup, SchemaIndex["layers"][LayerGroup]][]) {
        const categories: Record<string, number> = {};
        const items: Record<string, Record<string, number>> = {};
        for (const row of shown) {
          const category = row.fields[layer.category_field];
          if (category === undefined || category === null || category === "") continue;
          const key = String(category);
          categories[key] = (categories[key] ?? 0) + 1;
          if (!layer.item_field) continue;
          const item = row.fields[layer.item_field];
          if (item === undefined || item === null || item === "") continue;
          items[key] ??= {};
          items[key][String(item)] = (items[key][String(item)] ?? 0) + 1;
        }
        const label = `${paperId} ${group}`;
        expect(entry.categories[group], label).toEqual(categories);
        expect(entry.items[group], label).toEqual(items);
      }
    }
  });
});
