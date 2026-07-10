// Small display helpers for extracted values and row identity.


  if (value === null || value === undefined || value === "") {
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Identity entries worth showing as chips, in stable order, sans document_id. */
export function identityChips(identity: Identity): [string, string][] {
  return Object.entries(identity)
    .filter(([key, value]) => key !== "document_id" && value != null)
    .map(([key, value]) => [key, String(value)]);
}

/** For a normalized `<base>_id` field, find the raw reported label on the row. */
  const raw = row.fields[rawField] ?? row.identity[rawField];
  return raw == null ? null : String(raw);
}
