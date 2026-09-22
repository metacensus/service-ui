import { describe, expect, it } from "vitest";
import {
  parseDataMode,
  readLastDataMode,
  resolveDataMode,
  writeLastDataMode,
} from "./dataMode";

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe("resolveDataMode", () => {
  it("prefers the URL mode over the stored mode", () => {
    expect(resolveDataMode("table", "chat")).toBe("table");
    expect(resolveDataMode("chat", "table")).toBe("chat");
  });

  it("falls back to the stored mode when the URL has none", () => {
    expect(resolveDataMode(null, "chat")).toBe("chat");
  });

});

describe("last-mode storage", () => {
  it("round-trips the remembered mode", () => {
    const storage = memoryStorage();
    writeLastDataMode(storage, "table");
    expect(readLastDataMode(storage)).toBe("table");
  });

  it("rejects corrupt stored values", () => {
    expect(
      readLastDataMode(memoryStorage({ "metacensus:data-last-mode": "bogus" }))
    ).toBe(null);
    expect(parseDataMode("explore")).toBe(null);
  });
});
