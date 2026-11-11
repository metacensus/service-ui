import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchReviewSeed, reviewSeedQuery, reviewSeedUrl } from "./reviewSeed";

const seed = {
  runId: "run-a",
  reviewer: "Reviewer",
  action: "approve",
  reviewedAt: "2026-01-01T00:00:00.000Z",
  paperIds: ["paper-a", "paper-b"],
};

const respond = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

describe("fetchReviewSeed", () => {
  it("reads the run's seed from the demo route", async () => {
    let requested = "";
    const fetchFn = (async (url: string) => {
      requested = url;
      return new Response(JSON.stringify(seed));
    }) as unknown as typeof fetch;
    expect(await fetchReviewSeed("run-a", fetchFn)).toEqual(seed);
    expect(requested).toBe("/metacensus/demo/review-seed/run-a.json");
    expect(reviewSeedUrl("a/b")).toBe("/metacensus/demo/review-seed/a%2Fb.json");
  });

  it("is null when the demo has no seed for the run", async () => {
    expect(await fetchReviewSeed("run-a", respond("Not found", 404))).toBeNull();
  });

  it("rejects other failures and a seed for another run or of the wrong shape", async () => {
    await expect(fetchReviewSeed("run-a", respond("", 500))).rejects.toThrow("500");
    await expect(fetchReviewSeed("run-b", respond(seed))).rejects.toThrow("not a review seed");
    await expect(fetchReviewSeed("run-a", respond({ ...seed, paperIds: [1] }))).rejects.toThrow(
      "not a review seed"
    );
  });
});

// The loading gates read isPending of this query: it must settle, not retry, when the demo is down.
describe("reviewSeedQuery", () => {
  afterEach(() => vi.unstubAllGlobals());

  async function settle(fetchFn: typeof fetch) {
    vi.stubGlobal("fetch", fetchFn);
    const observer = new QueryObserver(new QueryClient(), reviewSeedQuery("run-a"));
    expect(observer.getCurrentResult().isPending).toBe(true);
    await new Promise<void>((done) => {
      const stop = observer.subscribe((result) => {
        if (!result.isPending) {
          stop();
          done();
        }
      });
    });
    return observer.getCurrentResult();
  }

  it("settles to no seed at once when the demo is unreachable", async () => {
    const result = await settle((async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch);
    expect(result).toMatchObject({ isPending: false, isError: true, data: undefined });
  });

  it("settles to the seed when the demo answers", async () => {
    expect((await settle(respond(seed))).data).toEqual(seed);
  });
});
