export type CorrectionValueResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

const JSON_TYPES = new Set(["array", "list", "object", "map"]);

function parseJsonValue(
  input: string,
  expected: "array" | "object"
): CorrectionValueResult {
  try {
    const value = JSON.parse(input) as unknown;
    const matches =
      expected === "array"
        ? Array.isArray(value)
        : typeof value === "object" && value !== null && !Array.isArray(value);

    return matches
      ? { ok: true, value }
      : { ok: false, error: `Enter a valid JSON ${expected}.` };
  } catch {
    return { ok: false, error: `Enter a valid JSON ${expected}.` };
  }
}

export function parseCorrectionValue(
  input: string,
  schemaType: string | null | undefined,
  originalValue: unknown
): CorrectionValueResult {
  const value = input.trim();
  if (!value) return { ok: false, error: "Enter a corrected value." };

  const declaredType = schemaType?.trim().toLowerCase();
  const inferredType =
    declaredType ||
    (Array.isArray(originalValue)
      ? "array"
      : originalValue === null
        ? "string"
        : typeof originalValue);

  if (inferredType === "integer" || inferredType === "int") {
    if (!/^[+-]?\d+$/.test(value)) {
      return { ok: false, error: "Enter a whole number." };
    }
    const parsed = Number(value);
    return Number.isSafeInteger(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, error: "Enter a whole number within the supported range." };
  }

  if (["number", "float", "double", "decimal"].includes(inferredType)) {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, error: "Enter a valid number." };
  }

  if (inferredType === "boolean" || inferredType === "bool") {
    if (value === "true") return { ok: true, value: true };
    if (value === "false") return { ok: true, value: false };
    return { ok: false, error: 'Enter either "true" or "false".' };
  }

  if (JSON_TYPES.has(inferredType)) {
    return parseJsonValue(
      value,
      inferredType === "array" || inferredType === "list" ? "array" : "object"
    );
  }

  return { ok: true, value };
}
