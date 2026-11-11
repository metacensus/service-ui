// Corpus-wide invariant audit for the tiered study tree, ported verbatim from
// never edit them to make a test pass; a mismatch is a QUESTION: with evidence.

import { describe, expect, it } from "vitest";
import { demoReachable, exportJson } from "../../data/loadExportRows.testutil";
import { NO_LABELS } from "../../data/snapshot";
import type { Manifest, Row, SchemaPresentation } from "../../types";
import { TREE_TABLE_MAX, type TreeOrder } from "./fieldMap";
import {
  buildPaperContext,
  buildTieredTree,
  normalizedOf,
  treeLeaves,
  type TreeNode,
} from "./groupedFindings";

const ORDERS: TreeOrder[] = ["variant_first", "outcome_first"];
// No demo on CI: skip there.
const DEMO_UP = await demoReachable();
const SUITE = DEMO_UP ? "study tree corpus audit" : "study tree corpus audit (skipped: no demo at DEMO_BASE_URL)";

const PYTHON_TABLES: Record<string, Record<TreeOrder, number>> = {
  Boige_2016_26794347: { variant_first: 53, outcome_first: 23 },
  toffoli_2015_26099996: { variant_first: 27, outcome_first: 23 },
  Boige_2010_20385995: { variant_first: 319, outcome_first: 362 },
  Madi_2018_30114658: { variant_first: 543, outcome_first: 383 },
};

describe.skipIf(!DEMO_UP)(SUITE, () => {
  it("reproduces the mock-up audit: 43 papers, 12556 rows, 86 trees, 5289 tables, 0 failures", async () => {
    const manifest = await exportJson<Manifest>("manifest.json");
    const presentation = (await exportJson<{ schema_presentation?: SchemaPresentation }>("demo_config.json"))
      .schema_presentation;
    const failures: string[] = [];
    const parity: string[] = [];
    const stats = {
      papers: 0,
      rows: 0,
      trees: 0,
      tables: 0,
      maxDepth: 0,
      maxTable: 0,
      largeTables: 0,
      printedLeaks: 0,
      repeatedChips: 0,
    };

    for (const paper of manifest.papers) {
      const rows = await exportJson<Row[]>(`rows/${paper.paper_id}.json`);
      stats.papers += 1;
      stats.rows += rows.length;
      // Cross-check against the manifest row_count per paper.
      expect(rows.length, `${paper.paper_id} row count vs manifest`).toBe(paper.row_count);
      const context = buildPaperContext(NO_LABELS, rows, presentation);
      const lifted = new Set<string>([
        ...context.lifted.map((chip) => chip.field),
        ...context.lifted.flatMap((chip) => (chip.partner ? [chip.partner.field] : [])),
        ...context.citation.filter((entry) => entry.populated).map((entry) => entry.field),
      ]);

      for (const order of ORDERS) {
        const tree = buildTieredTree(NO_LABELS, rows, presentation, lifted, order);
        stats.trees += 1;
        const leaves = treeLeaves(tree);
        stats.tables += leaves.length;
        const expected = PYTHON_TABLES[paper.paper_id]?.[order];
        if (expected !== undefined)
          parity.push(`${paper.paper_id} ${order}: TS ${leaves.length} · Python ${expected}${leaves.length === expected ? "" : "  ← differs"}`);

        // 1. every row lands in exactly one findings table
        const seen = new Map<number, number>();
        for (const leaf of leaves) {
          for (const row of leaf.rows) seen.set(row.row_index, (seen.get(row.row_index) ?? 0) + 1);
          stats.maxTable = Math.max(stats.maxTable, leaf.rows.length);
          if (leaf.rows.length > TREE_TABLE_MAX) stats.largeTables += 1;
          const projection = leaf.projection!;
          // 2. the table shows exactly the leaf's rows
          if (projection.rows.length !== leaf.rows.length)
            failures.push(`${paper.paper_id} ${order} ${leaf.key}: projection ${projection.rows.length} ≠ ${leaf.rows.length}`);
          // 3. printed halves never take a column or a chip
          for (const field of [
            ...projection.distinguishingFields,
            ...(projection.identityField ? [projection.identityField] : []),
            ...[...projection.shared, ...projection.sharedOverflow].map((chip) => chip.field),
          ]) {
            if (normalizedOf(field, presentation)) stats.printedLeaks += 1;
          }
        }
        if (seen.size !== rows.length) failures.push(`${paper.paper_id} ${order}: ${seen.size} rows placed of ${rows.length}`);
        for (const [index, count] of seen) if (count !== 1) failures.push(`${paper.paper_id} ${order} row ${index} placed ${count}×`);

        // 4. structure: splits have ≥ 2 children that partition the node; a node's
        //    chips never repeat a field shown on an ancestor
        const walk = (node: TreeNode, above: Set<string>) => {
          stats.maxDepth = Math.max(stats.maxDepth, node.depth);
          if (node.projection) return;
          if (node.children.length < 2) failures.push(`${paper.paper_id} ${order} ${node.key}: split with ${node.children.length} child`);
          const sum = node.children.reduce((total, child) => total + child.rows.length, 0);
          if (sum !== node.rows.length) failures.push(`${paper.paper_id} ${order} ${node.key}: children ${sum} ≠ ${node.rows.length}`);
          const here = new Set(above);
          for (const chip of [...node.lifted, ...node.liftedOverflow]) {
            if (above.has(chip.field)) stats.repeatedChips += 1;
            if (normalizedOf(chip.field, presentation)) stats.printedLeaks += 1;
            here.add(chip.field);
          }
          for (const child of node.children) walk(child, here);
        };
        walk(tree, new Set(lifted));
      }
    }

    expect(failures.slice(0, 10), "audit failures").toEqual([]);
    expect(stats.papers).toBe(43);
    expect(stats.rows).toBe(12556);
    expect(stats.trees).toBe(86);
    expect(stats.tables).toBe(5289);
    expect(stats.maxDepth).toBe(6);
    expect(stats.maxTable).toBe(263);
    expect(stats.largeTables).toBe(290);
    expect(stats.printedLeaks).toBe(0);
    expect(stats.repeatedChips).toBe(0);
    // The 8 Python parity counts.
    expect(parity).toHaveLength(8);
    for (const line of parity) expect(line, "python parity").not.toContain("← differs");
    expect(parity).toContain("Boige_2010_20385995 variant_first: TS 319 · Python 319");
    expect(parity).toContain("Boige_2010_20385995 outcome_first: TS 362 · Python 362");
    expect(parity).toContain("Boige_2016_26794347 variant_first: TS 53 · Python 53");
    expect(parity).toContain("Boige_2016_26794347 outcome_first: TS 23 · Python 23");
    expect(parity).toContain("Madi_2018_30114658 variant_first: TS 543 · Python 543");
    expect(parity).toContain("Madi_2018_30114658 outcome_first: TS 383 · Python 383");
    expect(parity).toContain("toffoli_2015_26099996 variant_first: TS 27 · Python 27");
    expect(parity).toContain("toffoli_2015_26099996 outcome_first: TS 23 · Python 23");
  }, 120000);
});
