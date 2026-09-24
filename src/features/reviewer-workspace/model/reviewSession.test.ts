import { describe, expect, it } from "vitest";
import {
  readReviewExpansion,
  readReviewSessionFlag,
  REVIEW_EXPANSION_KEY,
  REVIEW_SESSION_KEYS,
  writeReviewExpansion,
  writeReviewSessionFlag,
} from "./reviewSession";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe("the landing's session toggles", () => {
  it("a new session starts with the working set on and non-ambiguous extractions off", () => {
    const storage = memoryStorage();
    expect(readReviewSessionFlag(storage, "useWorkingSet")).toBe(true);
    expect(readReviewSessionFlag(storage, "includeNonAmbiguous")).toBe(false);
    expect(readReviewSessionFlag(null, "useWorkingSet")).toBe(true);
  });

  it("a written value is read back, each under its own key", () => {
    const storage = memoryStorage();
    writeReviewSessionFlag(storage, "useWorkingSet", false);
    writeReviewSessionFlag(storage, "includeNonAmbiguous", true);
    expect(readReviewSessionFlag(storage, "useWorkingSet")).toBe(false);
    expect(readReviewSessionFlag(storage, "includeNonAmbiguous")).toBe(true);
    expect(storage.items).toEqual(
      new Map([
        [REVIEW_SESSION_KEYS.useWorkingSet, "false"],
        [REVIEW_SESSION_KEYS.includeNonAmbiguous, "true"],
      ])
    );
    writeReviewSessionFlag(storage, "useWorkingSet", true);
    expect(readReviewSessionFlag(storage, "useWorkingSet")).toBe(true);
  });

  it("an unreadable, unwritable or unknown stored value falls back to the default", () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(readReviewSessionFlag(throwing, "includeNonAmbiguous")).toBe(false);
    expect(() => writeReviewSessionFlag(throwing, "includeNonAmbiguous", true)).not.toThrow();
    const storage = memoryStorage();
    storage.items.set(REVIEW_SESSION_KEYS.useWorkingSet, "yes");
    expect(readReviewSessionFlag(storage, "useWorkingSet")).toBe(true);
  });
});

describe("the landing's open sections", () => {
  it("start closed, and read back what was written", () => {
    const storage = memoryStorage();
    expect(readReviewExpansion(storage)).toEqual({ sections: {}, confident: {} });
    writeReviewExpansion(storage, { sections: { derived: true }, confident: { derived: true, inferred: false } });
    expect(readReviewExpansion(storage)).toEqual({
      sections: { derived: true },
      confident: { derived: true, inferred: false },
    });
    expect([...storage.items.keys()]).toEqual([REVIEW_EXPANSION_KEY]);
  });

  it("an unreadable or malformed stored value reads as all closed", () => {
    const storage = memoryStorage();
    storage.items.set(REVIEW_EXPANSION_KEY, "{not json");
    expect(readReviewExpansion(storage)).toEqual({ sections: {}, confident: {} });
    storage.items.set(REVIEW_EXPANSION_KEY, JSON.stringify({ sections: ["derived"], confident: { derived: "yes", verbatim: true } }));
    expect(readReviewExpansion(storage)).toEqual({ sections: {}, confident: { verbatim: true } });
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(readReviewExpansion(throwing)).toEqual({ sections: {}, confident: {} });
    expect(() => writeReviewExpansion(throwing, { sections: {}, confident: {} })).not.toThrow();
    expect(readReviewExpansion(null)).toEqual({ sections: {}, confident: {} });
  });
});
