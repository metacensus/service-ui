import { beforeEach, describe, expect, it, vi } from "vitest";

const indexedDb = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/lib/indexdb", () => indexedDb);

import { createLocalReviewerPersistence } from "./persistence";

describe("local reviewer persistence", () => {
  beforeEach(() => {
    indexedDb.get.mockReset();
    indexedDb.set.mockReset();
    indexedDb.del.mockReset();
  });

  it("reports persistent storage when IndexedDB is available", async () => {
    indexedDb.get.mockResolvedValue(undefined);
    indexedDb.set.mockResolvedValue(undefined);
    const adapter = createLocalReviewerPersistence("topic-persistent", "run-1");

    expect(await adapter.getStorageMode()).toBe("persistent");
    await adapter.setReviewerName("Reviewer");
    expect(indexedDb.set).toHaveBeenCalledOnce();
    expect(await adapter.getStorageMode()).toBe("persistent");
  });

  it("keeps state in memory and reports the fallback after a write failure", async () => {
    indexedDb.get.mockResolvedValue(undefined);
    indexedDb.set.mockRejectedValue(new Error("storage unavailable"));
    const adapter = createLocalReviewerPersistence("topic-memory", "run-1");

    await adapter.setReviewerName("Session reviewer");

    expect(await adapter.getStorageMode()).toBe("memory");
    expect(await adapter.getReviewerName()).toBe("Session reviewer");
  });
});
