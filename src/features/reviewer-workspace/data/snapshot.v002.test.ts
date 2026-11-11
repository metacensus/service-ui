import { beforeEach, describe, expect, it, vi } from "vitest";
import manifest from "./__fixtures__/v002-synthetic/manifest.json";
import rowsJson from "./__fixtures__/v002-synthetic/rows.Paper_A.json";
import evidenceJson from "./__fixtures__/v002-synthetic/evidence.Paper_A.json";
import { expandRows, fetchPaperRows, validatePaperRows } from "./snapshot";
import type { Row } from "../types";

const PAPER = "Paper_A";
const RUN = "v002-fixture";
const V001_RUN = "v001-fixture";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function stubFetch(handler: (url: string) => unknown) {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(url);
      const body = handler(url);
      if (body === 404) {
        return { ok: false, status: 404, statusText: "Not Found" };
      }
      return { ok: true, status: 200, json: async () => clone(body) };
    })
  );
  return urls;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("v002 snapshot reader", () => {
  it("expands the fixture's evidence references", async () => {
    const urls = stubFetch((url) => {
      if (url.endsWith("/manifest.json")) return manifest;
      if (url.includes(`/rows/${PAPER}.json`)) return rowsJson;
      if (url.includes(`/evidence/${PAPER}.json`)) return evidenceJson;
      throw new Error(`unexpected fetch: ${url}`);
    });
    const rows = await fetchPaperRows(RUN, PAPER);
    const { sources } = evidenceJson;
    const { total_n, outcome } = rows[0].provenance;
    expect(total_n.sources).toEqual([sources[0], sources[1], sources[0]]);
    expect(outcome.sources).toEqual([sources[2]]);
    expect(outcome.source_components?.[0].sources).toEqual([sources[1]]);
    expect(outcome.reasoning).toBe("reasoning 0");
    expect(outcome.derivation).toBe("derivation 0");
    expect(rows[1].provenance.total_n.sources).toEqual([sources[0]]);
    expect(urls.some((u) => u.includes(`/evidence/${PAPER}.json`))).toBe(true);
  });

  it("fetches no evidence URL for a v001 run", async () => {
    const v1Rows = [
      { row_index: 0, identity: {}, fields: {}, provenance: {} },
    ];
    const urls = stubFetch((url) => {
      if (url.endsWith("/manifest.json")) return { run_id: V001_RUN };
      if (url.includes("/rows/")) return v1Rows;
      throw new Error(`unexpected fetch: ${url}`);
    });
    const rows = await fetchPaperRows(V001_RUN, PAPER);
    expect(rows).toEqual(v1Rows);
    expect(urls.some((u) => u.includes("/evidence/"))).toBe(false);
  });

  it("raises SnapshotNotFoundError for a missing v002 evidence file", async () => {
    stubFetch((url) => {
      if (url.endsWith("/manifest.json")) return manifest;
      if (url.includes(`/rows/${PAPER}.json`)) return rowsJson;
      if (url.includes(`/evidence/${PAPER}.json`)) return 404;
      throw new Error(`unexpected fetch: ${url}`);
    });
    await expect(fetchPaperRows(RUN, PAPER)).rejects.toThrow(
      "Snapshot file not found"
    );
  });

  it("refetches the manifest after a failed fetch instead of caching it", async () => {
    const retryRun = "retry-fixture";
    let calls = 0;
    const urls = stubFetch((url) => {
      if (url.endsWith("/manifest.json")) {
        calls += 1;
        if (calls === 1) throw new Error("boom");
        return { run_id: retryRun };
      }
      if (url.includes("/rows/")) return [{ row_index: 0, identity: {}, fields: {}, provenance: {} }];
      throw new Error(`unexpected fetch: ${url}`);
    });
    await expect(fetchPaperRows(retryRun, PAPER)).rejects.toThrow("boom");
    const rows = await fetchPaperRows(retryRun, PAPER);
    expect(rows).toHaveLength(1);
    expect(calls).toBe(2);
    expect(urls.filter((u) => u.endsWith("/manifest.json"))).toHaveLength(2);
  });

  it("throws on an unknown snapshot version", async () => {
    // A fresh run id: fetchPaperRows memoizes the manifest version per runId,
    // so reusing RUN would serve the v002 manifest cached by the first test.
    const unknownRun = "v003-fixture";
    stubFetch((url) => {
      if (url.endsWith("/manifest.json"))
        return { run_id: unknownRun, snapshot_format_version: "v003" };
      throw new Error(`unexpected fetch: ${url}`);
    });
    await expect(fetchPaperRows(unknownRun, PAPER)).rejects.toThrow(
      "unsupported snapshot_format_version"
    );
  });

  it("throws on bad references in each of the four slot kinds", () => {
    const evidence = {
      sources: [{ quote: "q", location: "l", page: 1 }],
      reasoning: ["r"],
      derivation: ["d"],
    };
    for (const ref of [-1, 1, 1.5, "0", null]) {
      expect(() =>
        expandRows(
          clone([
            { row_index: 0, identity: {}, fields: {}, provenance: { f: { sources: [ref] } } },
          ]) as unknown as Row[],
          evidence,
          PAPER
        )
      ).toThrow(/bad sources ref/);
      expect(() =>
        expandRows(
          clone([
            {
              row_index: 0,
              identity: {},
              fields: {},
              provenance: {
                f: {
                  sources: [],
                  source_components: [{ label: "c", value: 1, sources: [ref] }],
                },
              },
            },
          ]) as unknown as Row[],
          evidence,
          PAPER
        )
      ).toThrow(/bad sources ref/);
      expect(() =>
        expandRows(
          clone([
            { row_index: 0, identity: {}, fields: {}, provenance: { f: { reasoning: ref } } },
          ]) as unknown as Row[],
          evidence,
          PAPER
        )
      ).toThrow(/bad reasoning ref/);
      expect(() =>
        expandRows(
          clone([
            { row_index: 0, identity: {}, fields: {}, provenance: { f: { derivation: ref } } },
          ]) as unknown as Row[],
          evidence,
          PAPER
        )
      ).toThrow(/bad derivation ref/);
    }
  });

  it("throws when expanding already-expanded rows", () => {
    const rows = expandRows(
      clone(rowsJson) as unknown as Row[],
      clone(evidenceJson) as unknown as {
        sources: unknown[];
        reasoning: unknown[];
        derivation: unknown[];
      },
      PAPER
    );
    expect(validatePaperRows(rows, PAPER)).toHaveLength(rows.length);
    expect(() =>
      expandRows(
        rows,
        clone(evidenceJson) as unknown as {
          sources: unknown[];
          reasoning: unknown[];
          derivation: unknown[];
        },
        PAPER
      )
    ).toThrow(/bad (sources|reasoning|derivation) ref/);
  });
});
