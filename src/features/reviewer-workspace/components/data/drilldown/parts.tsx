// Small presentational pieces shared by the grouped-findings mock-up.
// Styling stays inside the portal's existing vocabulary: gray text scale,
// indigo only for selection, amber only for review attention, no new palette.

import type { ReactNode } from "react";
import type { Row } from "@/features/reviewer-workspace/types";
import { hasProvenance, isPopulated } from "@/features/reviewer-workspace/model/drilldown/groupedFindings";

/** Literal, case-insensitive match highlighting (same rule as the search). */
export function Highlight({
  text,
  query,
}: {
  text: string;
  query: string;
}): ReactNode {
  const needle = query.trim();
  if (!needle) return text;
  const haystack = text.toLowerCase();
  const lower = needle.toLowerCase();
  const parts: ReactNode[] = [];
  let index = 0;
  let found = haystack.indexOf(lower, index);
  if (found < 0) return text;
  while (found >= 0) {
    if (found > index) parts.push(text.slice(index, found));
    parts.push(
      <mark key={`${found}`} className="rounded-sm bg-yellow-200 px-0.5">
        {text.slice(found, found + needle.length)}
      </mark>
    );
    index = found + needle.length;
    found = haystack.indexOf(lower, index);
  }
  if (index < text.length) parts.push(text.slice(index));
  return <>{parts}</>;
}

export type ValueTone = "identity" | "normal" | "muted" | "number";

/**
 * Any displayed value is a click target that opens its own provenance, so
 * every summary value stays traceable to paper / row / field.
 */
export function ValueButton({
  row,
  field,
  text,
  tone = "normal",
  query = "",
  selected = false,
  title,
  wrap = false,
  onSelect,
}: {
  row: Row;
  field: string;
  text: string;
  tone?: ValueTone;
  query?: string;
  selected?: boolean;
  title?: string;
  wrap?: boolean;
  onSelect: () => void;
}) {
  const populated = isPopulated(row, field);
  const provenance = hasProvenance(row, field);
  // A matched value always shows in full: truncation would clip the highlight
  // and hide the very thing the search found.
  const matched =
    query.trim().length > 0 &&
    text.toLowerCase().includes(query.trim().toLowerCase());
  const wrapValue = wrap || matched;
  const toneClass =
    tone === "identity"
      : tone === "number"
        : tone === "muted"
  return (
    <button
      type="button"
      disabled={!populated && !provenance}
      onClick={onSelect}
      title={
        title ??
        (provenance ? "Inspect provenance" : "No value or provenance was recorded")
      }
      className={`max-w-full rounded-sm border px-1 py-0.5 text-left text-xs ${
        wrapValue ? "whitespace-normal break-words" : "truncate"
      } ${
        selected
          : populated || provenance
      }`}
    >
      <Highlight text={text} query={query} />
    </button>
  );
}

export function ColumnHeading({ children }: { children: ReactNode }) {
  return (
  );
}
