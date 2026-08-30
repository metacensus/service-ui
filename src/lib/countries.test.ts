import { describe, expect, it } from "vitest";
import {
  countryCodes,
  countryName,
  countryOptions,
  isCountryCode,
} from "./countries";

describe("countryCodes", () => {
  it("covers the 249 officially assigned codes plus XK", () => {
    expect(countryCodes).toHaveLength(250);
    expect(countryCodes).toContain("XK");
  });

  it("omits the exceptionally reserved codes countries-list ships", () => {
    expect(countryCodes).not.toContain("AC");
    expect(countryCodes).not.toContain("TA");
  });

  it("resolves every code to a name, with none falling back to the code", () => {
    const unresolved = countryCodes.filter(
      (code) => countryName(code) === code
    );
    expect(unresolved).toEqual([]);
  });
});

describe("isCountryCode", () => {
  it("accepts assigned codes", () => {
    expect(isCountryCode("US")).toBe(true);
    expect(isCountryCode("BS")).toBe(true);
  });

  it("rejects names, the empty string, and unassigned codes", () => {
    // The regression this file exists for: the old validator matched on the
    // ISO official name, so these were the only strings that passed.
    expect(isCountryCode("United States of America")).toBe(false);
    expect(isCountryCode("Bahamas (the)")).toBe(false);
    expect(isCountryCode("")).toBe(false);
    expect(isCountryCode("ZZ")).toBe(false);
    expect(isCountryCode(undefined)).toBe(false);
  });
});

describe("countryName", () => {
  it("renders current common names rather than ISO official forms", () => {
    expect(countryName("BS")).toBe("Bahamas");
    expect(countryName("US")).toBe("United States");
    expect(countryName("TR")).toBe("Türkiye");
    expect(countryName("SZ")).toBe("Eswatini");
  });

  it("localises", () => {
    expect(countryName("DE", "de")).toBe("Deutschland");
    expect(countryName("ES", "fr")).toBe("Espagne");
  });
});

describe("countryOptions", () => {
  it("sorts by display name in the requested locale", () => {
    const names = countryOptions().map((option) => option.name);
    expect(names).toEqual([...names].sort(new Intl.Collator("en").compare));
  });

  it("returns one option per code", () => {
    expect(countryOptions()).toHaveLength(countryCodes.length);
  });
});
