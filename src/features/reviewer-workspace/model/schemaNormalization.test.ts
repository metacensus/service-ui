import { describe, expect, it, vi, afterEach } from "vitest";
import {
  fetchNormalizationManifest,
  normalizationAssetUrl,
  parseNormalizationManifest,
} from "./schemaNormalization";

const RUN = "run-fixture";

function validBody() {
  return {
    run_id: RUN,
    groups: [
      {
        diagram_group: "Variants",
        field: "entity_id",
        id: "dpyd_c1236g>a",
        label: "c.1236G>A",
        primary: true,
        forms: [
          {
            raw: "c.1236G>A (rs56038477)",
            papers: [
              {
                paper_id: "z_2022",
                display: "Z 2022, J",
              },
            ],
          },
          {
            raw: "two-paper form",
            papers: [
              {
                paper_id: "a_2020",
                display: "A 2020, J",
              },
              {
                paper_id: "b_2021",
                display: "B 2021, J",
              },
            ],
          },
        ],
      },
      {
        diagram_group: "Study context",
        field: "study_design_id",
        id: "prospective_cohort",
        label: "Prospective cohort",
        primary: false,
        forms: [],
      },
    ],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseNormalizationManifest", () => {
  it("parses a valid manifest", () => {
    const parsed = parseNormalizationManifest(validBody(), RUN);
    expect(parsed?.run_id).toBe(RUN);
    expect(parsed?.groups).toHaveLength(2);
    expect(parsed?.groups[0].forms).toHaveLength(2);
    expect(parsed?.groups[0].forms[1].papers).toEqual([
      { paper_id: "a_2020", display: "A 2020, J" },
      { paper_id: "b_2021", display: "B 2021, J" },
    ]);
  });

  it("rejects a mismatched run_id", () => {
    const body = validBody();
    body.run_id = "another_run";
    expect(parseNormalizationManifest(body, RUN)).toBeNull();
  });

  it("rejects an unknown diagram_group", () => {
    const body = validBody();
    body.groups[0].diagram_group = "Mystery";
    expect(parseNormalizationManifest(body, RUN)).toBeNull();
  });

  it("rejects a malformed form", () => {
    const body = validBody() as Record<string, unknown>;
    const groups = body.groups as Record<string, unknown>[];
    const forms = groups[0].forms as Record<string, unknown>[];
    delete forms[0].raw;
    expect(parseNormalizationManifest(body, RUN)).toBeNull();
  });

  it("rejects a form with a malformed papers entry", () => {
    const body = validBody() as Record<string, unknown>;
    const groups = body.groups as Record<string, unknown>[];
    const forms = groups[0].forms as Record<string, unknown>[];
    const papers = forms[1].papers as Record<string, unknown>[];
    delete papers[0].display;
    expect(parseNormalizationManifest(body, RUN)).toBeNull();
  });

  it("rejects an empty groups array", () => {
    const body = validBody();
    body.groups = [];
    expect(parseNormalizationManifest(body, RUN)).toBeNull();
  });

  it("keeps a group with no forms", () => {
    const parsed = parseNormalizationManifest(validBody(), RUN);
    const forms = parsed?.groups[1].forms;
    expect(forms).toEqual([]);
  });
});

describe("normalization URLs", () => {
  it("encodes the run id and respects the base", () => {
    expect(normalizationAssetUrl("a/b run", "manifest.json")).toBe(
      "/reviewer-snapshots/normalization/a%2Fb%20run/manifest.json"
    );
  });

  it("honors a configured base", () => {
    vi.stubEnv("VITE_REVIEWER_NORMALIZATION_BASE_URL", "/x/");
    expect(normalizationAssetUrl(RUN, "manifest.json")).toBe(
      `/x/${RUN}/manifest.json`
    );
    vi.unstubAllEnvs();
  });
});

describe("fetchNormalizationManifest", () => {
  it("returns null on a 404", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("not found", { status: 404 })
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchNormalizationManifest(RUN)).resolves.toBeNull();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("returns null on a mismatched run_id body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ run_id: "another_run", groups: [] })
      )
    );
    await expect(fetchNormalizationManifest(RUN)).resolves.toBeNull();
  });
});
