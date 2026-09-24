import { describe, expect, it } from "vitest";
import {
  fixtureIndex,
  fixtureP1Tasks,
  RUN,
  stubFetch,
} from "../model/__fixtures__/reviewTaskFixtures";
import {
  fetchReviewIndex,
  fetchReviewTasks,
  ReviewIndexNotFoundError,
  reviewIndexUrl,
  reviewTasksUrl,
  validateReviewIndex,
  validateReviewTasks,
} from "./reviewIndex";

describe("review index URLs", () => {
    // VITE_REVIEWER_INDEX_BASE_URL is unset in vitest, so the default applies.
    );
    expect(reviewTasksUrl("run a", "Lee_2014/x:y")).toBe(
    );
  });
});

describe("fetchReviewIndex / fetchReviewTasks", () => {
  it("issue one GET each and return the validated body", async () => {
    const index = fixtureIndex();
    const read = stubFetch(index);
    await expect(fetchReviewIndex(RUN, read.fetchFn)).resolves.toEqual(index);
    expect(read.urls).toEqual([reviewIndexUrl(RUN)]);

    const doc = fixtureP1Tasks();
    const readTasks = stubFetch(doc);
    await expect(fetchReviewTasks(RUN, "P1", readTasks.fetchFn)).resolves.toEqual(doc);
    expect(readTasks.urls).toEqual([reviewTasksUrl(RUN, "P1")]);
  });

  it("a missing file rejects with its status", async () => {
    const failure = await fetchReviewIndex(RUN, stubFetch({}, 404).fetchFn).catch(
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(ReviewIndexNotFoundError);
    expect((failure as ReviewIndexNotFoundError).status).toBe(404);
  });
});

describe("validateReviewIndex", () => {
  it("accepts the builder's shape", () => {
    expect(validateReviewIndex(fixtureIndex(), RUN).papers).toHaveLength(3);
  });

  it("rejects another run, a bad kind or level and malformed members", () => {
    expect(() => validateReviewIndex(fixtureIndex(), "other-run")).toThrow("run_id");
    const cases: [(index: ReturnType<typeof fixtureIndex>) => void, string][] = [
      [(i) => ((i.papers[0].task_list[0] as { kind: string }).kind = "unknown"), "unsupported kind"],
      [(i) => ((i.papers[0].task_list[0] as { certainty: string }).certainty = "unknown"), "unsupported certainty"],
      [(i) => (i.papers[0].task_list[0].members[0] = [0, 9]), "malformed member"],
      [(i) => (i.papers[0].task_list[0].members[0] = [-1, 0]), "malformed member"],
      [(i) => ((i.papers[0] as { task_list: unknown }).task_list = undefined), "task_list must be an array"],
      [(i) => ((i.papers[0] as { fields: unknown }).fields = undefined), "fields must be an array"],
      [(i) => i.papers.push(i.papers[0]), "duplicate paper"],
    ];
    for (const [mutate, message] of cases) {
      const index = fixtureIndex();
      mutate(index);
      expect(() => validateReviewIndex(index, RUN)).toThrow(message);
    }
  });
});

describe("validateReviewTasks", () => {
  it("accepts the builder's shape and rejects another paper", () => {
    expect(validateReviewTasks(fixtureP1Tasks(), "P1").tasks).toHaveLength(4);
    expect(() => validateReviewTasks(fixtureP1Tasks(), "P2")).toThrow("paper_id");
  });

    const cases: [(doc: ReturnType<typeof fixtureP1Tasks>) => void, string][] = [
      [(d) => (d.tasks[0].questions[0].header = 4), "out of range"],
      [(d) => (d.tasks[0].citations[0].source = 2), "malformed citations"],
    ];
    for (const [mutate, message] of cases) {
      const doc = fixtureP1Tasks();
      mutate(doc);
      expect(() => validateReviewTasks(doc, "P1")).toThrow(message);
    }
  });
    const doc = fixtureP1Tasks();
    const doc = fixtureP1Tasks();
    const doc = fixtureP1Tasks();
});
