// Normalized first: a paired field shows only its
// normalized value. Clicking it reveals the printed form(s) the paper used,
// in place; clicking a printed form opens its evidence. Three quantities stay
// separate in the reveal: distinct printed forms, findings carrying each, and
// distinct recorded sources for each.

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Row, RunLabels, SchemaPresentation } from "@/features/reviewer-workspace/types";
import type { Selection } from "./selection";
import {
  cellText,
  displayText,
  fieldLabel,
  isPopulated,
  partnerField,
  printedFormsFor,
} from "@/features/reviewer-workspace/model/drilldown/groupedFindings";
import { Highlight, ValueButton, type ValueTone } from "./parts";

export default function NormalizedValue({
  paperId,
  rows,
  field,
  presentation,
  labels,
  query,
  selectedKey,
  onSelect,
  scopeLabel,
  tone = "normal",
  wrap = false,
}: {
  paperId: string;
  /** one row for a cell; every row the value is shared by for a chip */
  rows: Row[];
  field: string;
  presentation?: SchemaPresentation;
  labels: RunLabels;
  query: string;
  selectedKey: string;
  onSelect: (selection: Selection) => void;
  scopeLabel: string;
  tone?: ValueTone;
  wrap?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchor = rows[0];
  const partner = partnerField(field, presentation);
  if (!anchor) return null;

  const single = rows.length === 1;
  const selectFor = (target: string, rowIndexes: number[], label: string): Selection =>
    rowIndexes.length === 1
      ? { kind: "row", paperId, rowIndex: rowIndexes[0], field: target }
      : { kind: "shared", paperId, field: target, scopeLabel: label, rowIndexes };
  const keyOf = (selection: Selection) =>
    selection.kind === "row"
      ? `row::${paperId}::${selection.rowIndex}::${selection.field}`
      : `shared::${paperId}::${selection.scopeLabel}::${selection.field}`;

  // Not a pair (raw-only or an unpaired field): behave like any value.
  if (!partner || partner.role !== "as printed") {
    const selection = selectFor(field, rows.map((row) => row.row_index), scopeLabel);
    return (
      <ValueButton
        row={anchor}
        field={field}
        text={cellText(anchor, field)}
        tone={tone}
        query={query}
        wrap={wrap}
        selected={selectedKey === keyOf(selection)}
        onSelect={() => onSelect(selection)}
      />
    );
  }

  // Normalized value missing: show the printed value, labelled — never an
  // invented equivalent.
  if (!isPopulated(anchor, field)) {
    if (single && isPopulated(anchor, partner.field)) {
      const selection = selectFor(partner.field, [anchor.row_index], scopeLabel);
      return (
        <span className="inline-flex max-w-full flex-wrap items-baseline gap-1">
          <ValueButton
            row={anchor}
            field={partner.field}
            text={displayText(anchor, partner.field)}
            tone={tone}
            query={query}
            wrap={wrap}
            title={`${partner.field} — no normalized value recorded; inspect provenance`}
            selected={selectedKey === keyOf(selection)}
            onSelect={() => onSelect(selection)}
          />
          <span className="rounded-sm border border-dashed border-mc-ink-secondary px-1 text-[10px] text-foreground">
            no normalized value — as printed
          </span>
        </span>
      );
    }
    const selection = selectFor(field, rows.map((row) => row.row_index), scopeLabel);
    return (
      <ValueButton
        row={anchor}
        field={field}
        text={cellText(anchor, field)}
        tone={tone}
        query={query}
        selected={selectedKey === keyOf(selection)}
        onSelect={() => onSelect(selection)}
      />
    );
  }

  const { forms, rowsWithoutPrinted } = printedFormsFor(rows, field, presentation);
  const normalizedSelection = selectFor(field, rows.map((row) => row.row_index), scopeLabel);
  const anySelected =
    selectedKey === keyOf(normalizedSelection) ||
    forms.some(
      (form) =>
        selectedKey ===
        keyOf(selectFor(partner.field, form.rowIndexes, `${scopeLabel} · printed as “${form.text}”`))
    );
  const hint =
    forms.length === 0
      ? "no printed form"
      : forms.length === 1
        ? "as printed"
        : `${forms.length} printed forms`;
  const toneClass =
    tone === "identity"
      ? "font-bold text-foreground"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-foreground";

  return (
    <span className="inline-flex min-w-0 max-w-full flex-col items-start">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title={`${fieldLabel(labels, field)} (${field}) — normalized value. Click to ${
          open ? "hide" : "show"
        } what the paper printed (${partner.field}).`}
        className={`inline-flex max-w-full items-baseline gap-1 rounded-sm border px-1 py-0.5 text-left text-xs ${
          anySelected || open
            ? "border-mc-line-accent bg-secondary"
            : "border-transparent hover:border-mc-line-accent hover:bg-secondary"
        }`}
      >
        <span className={`min-w-0 ${wrap ? "whitespace-normal break-words" : "truncate"} ${toneClass}`}>
          <Highlight text={displayText(anchor, field)} query={query} />
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-normal text-mc-ink-accent">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {hint}
        </span>
      </button>

      {open && (
        <span className="mt-0.5 ml-1 flex max-w-full flex-col gap-0.5 border-l-2 pl-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Printed in the paper
            {!single && ` · across ${rows.length} findings`}
          </span>
          {forms.map((form) => {
            const selection = selectFor(
              partner.field,
              form.rowIndexes,
              `${scopeLabel} · printed as “${form.text}”`
            );
            const formRow =
              rows.find((row) => row.row_index === form.rowIndexes[0]) ?? anchor;
            return (
              <span key={form.text} className="flex max-w-full flex-wrap items-baseline gap-1">
                <ValueButton
                  row={formRow}
                  field={partner.field}
                  text={`“${form.text}”`}
                  query={query}
                  wrap
                  title={`${partner.field} — open the source quote and PDF`}
                  selected={selectedKey === keyOf(selection)}
                  onSelect={() => onSelect(selection)}
                />
                <span className="text-[10px] text-muted-foreground">
                  {!single &&
                    `${form.rowIndexes.length} ${
                      form.rowIndexes.length === 1 ? "finding" : "findings"
                    } · `}
                  {form.sourceCount} {form.sourceCount === 1 ? "source" : "sources"}
                </span>
              </span>
            );
          })}
          {forms.length === 0 && (
            <span className="text-[11px] italic text-muted-foreground">
              No printed form recorded ({partner.field} is empty).
            </span>
          )}
          {forms.length > 0 && rowsWithoutPrinted.length > 0 && (
            <span className="text-[10px] italic text-muted-foreground">
              {rowsWithoutPrinted.length} of {rows.length} findings record no printed form.
            </span>
          )}
          <button
            type="button"
            className={`self-start text-[10px] font-medium text-mc-ink-accent hover:underline ${selectedKey === keyOf(normalizedSelection) ? "underline" : ""}`}
            onClick={() => onSelect(normalizedSelection)}
          >
            How this was normalized ›
          </button>
        </span>
      )}
    </span>
  );
}
