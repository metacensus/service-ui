// Search over displayed raw and normalized field values, the printed wording
// and the displayed label, composed with the Field and Review-status filters.
// mismatch needs investigating with evidence.

import { beforeAll, describe, expect, it } from "vitest";
import {
  dataWorkspaceRowMatchesField,
  dataWorkspaceValueText,
} from "../dataWorkspace";
import { rawLabelFor } from "../display";
import type { RowReviewState } from "../rowStatus";
import {
  allFieldNames,
  buildPaperContext,
  buildTieredTree,
  isPopulated,
  matchedRowIndexes,
  rowMatchesQuery,
  treeLeaves,
} from "./groupedFindings";

const withExport = (name: string, body: () => void) =>
    { timeout: 60000 },
    body
  );

  return { rows, presentation: config.schema_presentation };
}

/** The mock-up's stored-plus-printed matcher, before the displayed-label addition. */
function storedOnlySet(rows: Row[], query: string, presentation?: SchemaPresentation): Set<number> {
  const needle = query.trim().toLowerCase();
  const matched = new Set<number>();
  if (!needle) {
    for (const row of rows) matched.add(row.row_index);
    return matched;
  }
  for (const row of rows) {
    let hit = false;
    for (const value of Object.values(row.identity)) {
      const text = dataWorkspaceValueText(value);
      if (text && text.toLowerCase().includes(needle)) {
        hit = true;
        break;
      }
    }
    if (!hit) {
      for (const [field, value] of Object.entries(row.fields)) {
        if (!isPopulated(row, field)) continue;
        const text = dataWorkspaceValueText(value, row.provenance[field]);
        if (text && text.toLowerCase().includes(needle)) {
          hit = true;
          break;
        }
        const raw = rawLabelFor(row, field, presentation);
        if (raw && raw.toLowerCase().includes(needle)) {
          hit = true;
          break;
        }
      }
    }
    if (hit) matched.add(row.row_index);
  }
  return matched;
}

function matchedSet(rows: Row[], query: string, presentation?: SchemaPresentation): Set<number> {
  const matched = new Set<number>();
  for (const row of rows) {
  }
  return matched;
}

withExport("search over displayed values", () => {
  let rows: Row[] = [];
  let presentation: SchemaPresentation | undefined;
  });

  it("finds the same 63 rows for every case/whitespace form of diarrhea", () => {
    expect(rows).toHaveLength(207);
    const expected = matchedSet(rows, "diarrhea", presentation);
    expect(expected.size).toBe(63);
    for (const query of ["DIARRHEA", "dIaRrHeA", "  diarrhea  "]) {
      expect(matchedSet(rows, query, presentation)).toEqual(expected);
    }
  });

  it("finds 34 rows for neutropenia in either case", () => {
    expect(matchedSet(rows, "neutropenia", presentation).size).toBe(34);
    expect(matchedSet(rows, "NEUTROPENIA", presentation)).toEqual(
      matchedSet(rows, "neutropenia", presentation)
    );
  });

  it("restores all 207 rows on empty query and has a no-match state", () => {
    expect(matchedSet(rows, "", presentation).size).toBe(207);
    expect(matchedSet(rows, "grade 3 diarrhea", presentation).size).toBe(0);
  });

    expect(lee.rows).toHaveLength(246);
    expect(matchedSet(lee.rows, "diarrhea", lee.presentation).size).toBe(89);
    expect(matchedSet(lee.rows, "neutropenia", lee.presentation).size).toBe(89);
    expect(jennings.rows).toHaveLength(351);
    expect(matchedSet(jennings.rows, "diarrhea", jennings.presentation).size).toBe(0);
    expect(matchedSet(jennings.rows, "neutropenia", jennings.presentation).size).toBe(0);
  });
});

withExport("literal matching", () => {
  let rows: Row[] = [];
  let presentation: SchemaPresentation | undefined;
  });

  it("does not search field names and does not expand synonyms", () => {
    expect(matchedSet(rows, "outcome_raw", presentation).size).toBe(0);
    expect(matchedSet(rows, "low neutrophils", presentation).size).toBe(0);
  });

  it("finds 18 rows for Diarrhoea, a different set from diarrhea's 63", () => {
    const latin = matchedSet(rows, "Diarrhoea", presentation);
    expect(latin.size).toBe(18);
    expect(latin).not.toEqual(matchedSet(rows, "diarrhea", presentation));
  });
});

withExport("displayed labels", () => {
    expect(rows).toHaveLength(277);
    const diarrhea = matchedSet(rows, "diarrhea", presentation);
    expect(diarrhea.size).toBe(181);
    // Label breakdown: 175 composite_dmn_severe_toxicity + 6 diarrhoea.
    const composite = rows.filter(
      (row) => row.fields.outcome_id === "composite_dmn_severe_toxicity"
    );
    expect(composite).toHaveLength(175);
    for (const row of composite) expect(diarrhea).toContain(row.row_index);
    const diarrhoea = rows.filter((row) => row.fields.outcome_id === "diarrhoea");
    expect(diarrhoea).toHaveLength(6);
    for (const row of diarrhoea) expect(diarrhea).toContain(row.row_index);
    const neutropenia = matchedSet(rows, "neutropenia", presentation);
    expect(neutropenia.size).toBe(180);
    // Label-only rows: matched by the displayed-label rule but not by the stored/printed matcher.
    const storedOnly = storedOnlySet(rows, "neutropenia", presentation);
    expect(storedOnly.size).toBe(147);
    const labelOnly = [...neutropenia].filter((index) => !storedOnly.has(index));
    expect(labelOnly).toHaveLength(33);
    for (const index of labelOnly) {
      expect(rows.find((row) => row.row_index === index)?.fields.outcome_id).toBe(
        "composite_dmn_severe_toxicity"
      );
      // Already inside the diarrhea set.
      expect(diarrhea).toContain(index);
    }
  });

    // Every Loganayagam diarrhea match is label-only, so this exercises the label path.
    expect(storedOnlySet(logan.rows, "Diarrhea", logan.presentation).size).toBe(0);
    const diarrhea = matchedSet(logan.rows, "diarrhea", logan.presentation);
    for (const query of ["Diarrhea", "DIARRHEA"]) {
      const found = matchedSet(logan.rows, query, logan.presentation);
      expect(found.size, query).toBe(181);
      expect(found, query).toEqual(diarrhea);
    }
    const neutropenia = matchedSet(logan.rows, "NEUTROPENIA", logan.presentation);
    expect(neutropenia.size).toBe(180);
    expect(neutropenia).toEqual(matchedSet(logan.rows, "neutropenia", logan.presentation));
    const boigeDiarrhea = matchedSet(boige.rows, "Diarrhea", boige.presentation);
    expect(boigeDiarrhea.size).toBe(63);
    expect(boigeDiarrhea).toEqual(matchedSet(boige.rows, "diarrhea", boige.presentation));
  });

    expect(matchedSet(madi.rows, "diarrhea", madi.presentation).size).toBe(158);
    expect(matchedSet(rosmarin.rows, "diarrhea", rosmarin.presentation).size).toBe(94);
  });

    const expected: Array<[string, number]> = [
      ["falvella_2015_25782327", 3],
      ["Kristensen_2010_20819423", 10],
      ["bozina_2022_34780066", 5],
      ["Ribelles_2008_18473752", 3],
      ["Boisdron-Celle_2007_17064846", 1],
      ["Iachetta_2019_30858516", 1],
    ];
    for (const [paperId, total] of expected) {
      expect(matchedSet(rows, "diarrhea", presentation).size, paperId).toBe(total);
    }
  });

    expect(matchedSet(rows, "neutropenia", presentation).size).toBe(89);
    expect(matchedSet(rows, "Diarrhoea", presentation).size).toBe(12);
  });
});

withExport("search composed with filters", () => {
  let rows: Row[] = [];
  let presentation: SchemaPresentation | undefined;
  });
  const querySet = () => matchedSet(rows, "diarrhea", presentation);

  it("composes with the Field filter as an intersection", () => {
    const query = querySet();
    // Two different fields: one non-empty, one empty intersection.
    const fields = allFieldNames(rows);
    const nonEmpty = fields.find((field) => {
      const byField = rows
        .filter((row) => dataWorkspaceRowMatchesField(row, field))
        .map((row) => row.row_index);
      const intersection = byField.filter((index) => query.has(index));
      return intersection.length > 0 && intersection.length < query.size;
    });
    expect(nonEmpty, "a field with a non-empty intersection").toBeDefined();
    const expected = new Set(
      rows
        .filter((row) => query.has(row.row_index) && dataWorkspaceRowMatchesField(row, nonEmpty!))
        .map((row) => row.row_index)
    );
    expect(
      matchedRowIndexes(
        rows,
        { query: "diarrhea", fieldFilter: nonEmpty!, statusFilter: "all" },
        presentation,
        () => "open"
      )
    ).toEqual(expected);
    const emptyField = fields.find(
      (field) =>
        rows.some((row) => dataWorkspaceRowMatchesField(row, field)) &&
        !rows.some(
          (row) => query.has(row.row_index) && dataWorkspaceRowMatchesField(row, field)
        )
    );
    expect(emptyField, "a field with an empty intersection").toBeDefined();
    expect(
      matchedRowIndexes(
        rows,
        { query: "diarrhea", fieldFilter: emptyField!, statusFilter: "all" },
        presentation,
        () => "open"
      )
    ).toEqual(new Set());
  });

  it("composes with the Review-status filter through the stub", () => {
    const query = querySet();
    // Three chosen rows: two inside the query set, one outside it.
    const inQuery = [...query].slice(0, 2);
    const outside = rows.map((row) => row.row_index).find((index) => !query.has(index));
    expect(outside, "a row outside the query set").toBeDefined();
    const approved = new Set<number>([...inQuery, outside!]);
    const reviewStateOf = (rowIndex: number): RowReviewState =>
      approved.has(rowIndex) ? "approved" : "open";
    expect(
      matchedRowIndexes(
        rows,
        { query: "diarrhea", fieldFilter: "all", statusFilter: "approved" },
        presentation,
        reviewStateOf
      )
    ).toEqual(new Set(inQuery));
  });

  it("never rebuilds the tree from filtered rows", () => {
    // The tree is built once from the complete row set; any query sees the
    // same structure. Rebuilding twice from the same rows proves the build is
    // query-independent; matching against each query then proves the filters
    // narrow within it without redefining membership.
    const lifted = new Set<string>([
      ...context.lifted.map((chip) => chip.field),
      ...context.lifted.flatMap((chip) => (chip.partner ? [chip.partner.field] : [])),
      ...context.citation.filter((entry) => entry.populated).map((entry) => entry.field),
    ]);
    // buildTieredTree takes no query argument: the same call serves every
    // query. Prove the structure is query-independent (deterministic across
    // rebuilds) and that each query's matches sit strictly inside the
    // full-set leaves — filters narrow within the tree, never reshape it.
    const structureOf = (order: "variant_first" | "outcome_first") =>
        (leaf) => `${leaf.key}:${leaf.rows.length}`
      );
    const variant = structureOf("variant_first");
    expect(structureOf("variant_first"), "variant_first is deterministic").toEqual(variant);
    const outcome = structureOf("outcome_first");
    expect(structureOf("outcome_first"), "outcome_first is deterministic").toEqual(outcome);
    const leafRows = new Set(
        leaf.rows.map((row) => row.row_index)
      )
    );
    expect(leafRows.size, "full-set tree covers every row").toBe(rows.length);
    for (const query of ["diarrhea", "neutropenia", "zzz-no-match"]) {
      const narrowed = matchedRowIndexes(
        rows,
        { query, fieldFilter: "all", statusFilter: "all" },
        presentation,
        () => "open"
      );
      for (const index of narrowed) expect(leafRows, `query ${query}`).toContain(index);
    }
  }, 30000);
});
