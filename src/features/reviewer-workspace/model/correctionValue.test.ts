import { describe, expect, it } from "vitest";
import { parseCorrectionValue } from "./correctionValue";

describe("parseCorrectionValue", () => {
  it("preserves strings and parses declared scalar types", () => {
    expect(parseCorrectionValue("  CYP2D6  ", "string", "")).toEqual({
      ok: true,
      value: "CYP2D6",
    });
    expect(parseCorrectionValue("null", "string", "")).toEqual({
      ok: true,
      value: "null",
    });
    expect(parseCorrectionValue("42", "integer", 0)).toEqual({
      ok: true,
      value: 42,
    });
    expect(parseCorrectionValue("0.25", "number", 0)).toEqual({
      ok: true,
      value: 0.25,
    });
    expect(parseCorrectionValue("false", "boolean", true)).toEqual({
      ok: true,
      value: false,
    });
  });

  it("parses structured values and rejects the wrong JSON shape", () => {
    expect(parseCorrectionValue('["A", "B"]', "array", [])).toEqual({
      ok: true,
      value: ["A", "B"],
    });
    expect(parseCorrectionValue('{"unit":"mg"}', "object", {})).toEqual({
      ok: true,
      value: { unit: "mg" },
    });
    expect(parseCorrectionValue('{"not":"an array"}', "array", []).ok).toBe(
      false
    );
  });

  it("uses the original value type when schema metadata is absent", () => {
    expect(parseCorrectionValue("7", null, 3)).toEqual({
      ok: true,
      value: 7,
    });
    expect(parseCorrectionValue("true", null, false)).toEqual({
      ok: true,
      value: true,
    });
  });

  it("rejects invalid values instead of silently changing their type", () => {
    expect(parseCorrectionValue("2.5", "integer", 0).ok).toBe(false);
    expect(parseCorrectionValue("yes", "boolean", false).ok).toBe(false);
    expect(parseCorrectionValue(" ", "string", "").ok).toBe(false);
  });
});
