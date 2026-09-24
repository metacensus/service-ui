import { useMemo, useState } from "react";
import type {
  PaperMeta,
  Row,
  SchemaPresentation,
} from "@/features/reviewer-workspace/types";
import { DETAIL_GROUPS } from "@/features/reviewer-workspace/model/drilldown/fieldMap";
import {
  allFieldNames,
  fieldLabel,
  isPopulated,
  normalizedOf,
} from "@/features/reviewer-workspace/model/drilldown/groupedFindings";
import { ColumnHeading } from "./parts";
import NormalizedValue from "./NormalizedValue";
import type { Selection } from "./selection";

type SelectHandler = (selection: Selection) => void;

export default function RowDetail({
  paper,
  row,
  query,
  selectedKey,
  onSelect,
  groupVaryingCount,
  presentation,
  compact = false,
  hiddenFields,
}: {
  paper: PaperMeta;
  row: Row;
  query: string;
  selectedKey: string;
  onSelect: SelectHandler;
  groupVaryingCount: number;
  presentation?: SchemaPresentation;
  /** Narrow container (phone, or evidence pane open): one column, narrower labels. */
  compact?: boolean;
  /** Fields the text-highlight rule hid: left out of the list and of the empty-field count. */
  hiddenFields?: readonly string[];
}) {
  const [showEmpty, setShowEmpty] = useState(false);
  const detail = useMemo(() => {
    const consumed = new Set<string>();
    const groups = DETAIL_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      fields: group.fields.filter((field) => {
        if (consumed.has(field)) return false;
        consumed.add(field);
        return true;
      }),
    }));
    const rest = allFieldNames([row]).filter((field) => !consumed.has(field));
    if (rest.length > 0) {
      groups.push({ id: "other", label: "Other extracted fields", fields: rest });
    }
    return groups;
  }, [row]);

  // Normalized first: the printed half of a pair is not its own line; it is
  // revealed from the normalized value (or shown, labelled, when the
  // normalized value is missing).
  const printedOf = (field: string) =>
    presentation?.reported_value_fields?.[field] ?? null;
  const shownAsOwnLine = (field: string) =>
    !normalizedOf(field, presentation) && !hiddenFields?.includes(field);
  const presentOne = (field: string) =>
    isPopulated(row, field) || Boolean(row.provenance[field]?.extraction_certainty);
  const present = (field: string) => {
    const printed = printedOf(field);
    return presentOne(field) || (printed ? presentOne(printed) : false);
  };
  const emptyCount = detail
    .flatMap((group) => group.fields)
    .filter((field) => shownAsOwnLine(field) && !present(field)).length;

  return (
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <ColumnHeading>All extracted fields for this finding</ColumnHeading>
          {paper.paper_id} · row_index {row.row_index} · {groupVaryingCount} fields vary
          across this group
        </span>
      </div>
      <div className={`mt-2 grid grid-cols-1 gap-x-6 gap-y-3 ${compact ? "" : "lg:grid-cols-2"}`}>
        {detail.map((group) => {
          const fields = group.fields.filter(
            (field) => shownAsOwnLine(field) && (showEmpty || present(field))
          );
          if (fields.length === 0) return null;
          return (
            <section key={group.id}>
                {group.label}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {fields.map((field) => (
                  <div key={field} className="flex min-w-0 items-baseline gap-2">
                    <span
                      title={field}
                    >
                    </span>
                    <NormalizedValue
                      paperId={paper.paper_id}
                      rows={[row]}
                      field={field}
                      presentation={presentation}
                      query={query}
                      wrap
                      selectedKey={selectedKey}
                      onSelect={onSelect}
                      scopeLabel={`Finding ${row.row_index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {emptyCount > 0 && (
        <button
          type="button"
          onClick={() => setShowEmpty((value) => !value)}
        >
          {showEmpty
            ? `Hide ${emptyCount} fields with no recorded value`
            : `Show ${emptyCount} fields with no recorded value`}
        </button>
      )}
    </div>
  );
}
