//
// Everything that explains provenance is shown, open, in labelled sections:
// derivation kind, certainty, every source (with location quality and table
// cell), how the value was derived, the reasoning, derivation inputs, and why a
// value is missing. For a shared value it also says which findings cite which
// source and whether the explanation differs between them. Only page chrome is
// dropped: the "Evidence inspection" kicker, field code, paper title (already
// the page title), row_index, and "Show in evidence panel" links (the quote is
// the button).

import type { ReactNode } from "react";
import { X } from "lucide-react";
import EvidencePanel from "@/features/reviewer-workspace/components/EvidencePanel";
import { pdfUrl } from "@/features/reviewer-workspace/data/snapshot";
import {
  dataWorkspaceFieldValue,
  dataWorkspaceValueText,
  humanizeDataWorkspaceField,
} from "@/features/reviewer-workspace/model/dataWorkspace";
import { firstSourceFor, type Selection } from "./selection";
import { displayText, fieldLabel, isPopulated, partnerField, sharedSourcesFor } from "@/features/reviewer-workspace/model/drilldown/groupedFindings";
import { prettyValue } from "@/features/reviewer-workspace/model/drilldown/displayLabel";

/** Location quality, in words. */
const RESOLUTION_WORDS: Record<string, string> = {
  exact: "exact quote match",
  partial_quote: "partial quote match",
  table_region: "table region",
  figure_region: "figure region",
  page_only: "page only — quote not located on the page",
  not_resolved_for_demo: "location not resolved",
};

/** How the value relates to the paper. Glosses are authored presentation text. */
const KIND: Record<string, { label: string; gloss: string; tone: string }> = {
  derived: {
    label: "Derived",
    gloss: "computed or converted from printed values",
  },
  inferred: {
    label: "Inferred",
    gloss: "interpreted by the extractor, not printed as such",
    tone: "bg-amber-50 text-amber-800",
  },
};

const CERTAINTY: Record<string, { label: string; tone: string }> = {
  ambiguous: { label: "Ambiguous", tone: "bg-amber-50 text-amber-800" },
};

type Provenance = ProvenanceEntry & { missing_reason?: string };

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-5">
    </section>
  );
}

function Tag({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${tone}`}>{children}</span>;
}

/** "4 verbatim, 2 derived" when a shared value's findings disagree. */
function spread(values: (string | undefined)[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value ?? "not recorded", (counts.get(value ?? "not recorded") ?? 0) + 1);
  if (counts.size < 2) return null;
  return [...counts.entries()].map(([value, count]) => `${count} ${value}`).join(", ");
}

const sameSource = (a: ProvSource | null, b: ProvSource) =>
  Boolean(a) && a!.location === b.location && a!.page === b.page && a!.quote === b.quote;

/** A quote copied from a markdown table row ("| a | b | c |") reads as cells, not pipes. */
function Quote({ text }: { text: string }) {
  const trimmed = text.trim();
  if (trimmed.startsWith("|")) {
    const cells = trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    return (
      <span className="flex flex-wrap gap-1">
        {cells.map((cell, index) => (
            {cell}
          </span>
        ))}
      </span>
    );
  }
  return <span>“{trimmed}”</span>;
}

function SourceCard({
  source,
  index,
  total,
  active,
  note,
  onSelect,
}: {
  source: ProvSource;
  index: number;
  total: number;
  active: boolean;
  note?: string;
  onSelect: () => void;
}) {
  // (`Source i of N · {location} · article page {page}`); a single source
  // keeps the mock-up's caption. The rest (resolution words, cell, note) is
  // unchanged.
  const where = [
    total > 1
      ? `Source ${index + 1} of ${total} · ${source.location} · article page ${source.page}`
      : `Page ${source.page}`,
    RESOLUTION_WORDS[source.resolution ?? ""] ?? source.resolution,
    source.cell ? `cell ${source.cell.row} × ${source.cell.column}` : null,
    note,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title="Show this source in the PDF"
        active
      }`}
    >
      <Quote text={source.quote ?? ""} />
      <span
      >
        {where}
      </span>
    </button>
  );
}

export default function CleanEvidence({
  runId,
  paper,
  selection,
  rowsByIndex,
  presentation,
  activeSource,
  onSourceSelect,
  onClose,
}: {
  runId: string;
  paper: PaperMeta;
  selection: Selection;
  rowsByIndex: Map<number, Row>;
  presentation?: SchemaPresentation;
  activeSource: ProvSource | null;
  onSourceSelect: (source: ProvSource) => void;
  onClose: () => void;
}) {
  const scopeRows = (selection.kind === "row" ? [selection.rowIndex] : selection.rowIndexes)
    .map((index) => rowsByIndex.get(index))
    .filter((row): row is Row => Boolean(row));
  const anchor = scopeRows[0] ?? null;
  const field = selection.field;
  const provenance = (anchor?.provenance[field] ?? null) as Provenance | null;
  const shown = activeSource ?? firstSourceFor(selection, rowsByIndex);

  const value = anchor
    ? dataWorkspaceValueText(dataWorkspaceFieldValue(anchor, field), provenance ?? undefined)
    : "No value extracted";

  // The other half of a printed/normalized pair, in one line.
  const partner = partnerField(field, presentation);
  let partnerLine: string | null = null;
  if (partner && anchor) {
    const populated = scopeRows.filter((row) => isPopulated(row, partner.field));
    const forms = [...new Set(populated.map((row) => displayText(row, partner.field)))];
    const other =
      forms.length === 0 ? null : forms.length === 1 ? forms[0] : `${forms.length} different forms`;
    if (other)
      partnerLine =
        partner.role === "as printed"
          ? `Printed as “${other}”`
          : forms.length === 1
  }

  // Which finding this is, in the tree's own words.
  const findingContext =
    selection.kind === "row" && anchor
      ? ["entity_id", "outcome_id"]
          .filter((name) => name !== field && name !== partner?.field && isPopulated(anchor, name))
          .join(" · ")
      : null;

  const shared = selection.kind === "shared" ? sharedSourcesFor(scopeRows, field) : null;
  const sources = provenance?.sources ?? [];
  const kind = KIND[provenance?.derivation_kind ?? ""];
  const certainty = CERTAINTY[provenance?.extraction_certainty ?? ""];
  // A shared value covers several findings, each with its own provenance record.
  const scopeProv = scopeRows.map((row) => row.provenance[field] as Provenance | undefined);
  const kindSpread = selection.kind === "shared" ? spread(scopeProv.map((entry) => entry?.derivation_kind)) : null;
  const certaintySpread =
    selection.kind === "shared" ? spread(scopeProv.map((entry) => entry?.extraction_certainty)) : null;
  const differing = (pick: (entry?: Provenance) => string | undefined) =>
    new Set(scopeProv.map((entry) => pick(entry) ?? "")).size > 1;
  // Identical sources can be listed twice; highlight only the first match.
  const listed = shared ? shared.sources.map((entry) => entry.source) : sources;
  const activeIndex = listed.findIndex((entry) => sameSource(shown, entry));
  const explainedFor =
    selection.kind === "shared" && anchor
      ? differing((entry) => entry?.derivation) || differing((entry) => entry?.reasoning)
        ? ` · finding ${anchor.row_index + 1}; differs on other findings`
        : ` · same on all ${scopeRows.length} findings`
      : "";

  return (
    <div className="flex flex-col gap-4 xl:sticky xl:top-4">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
            </div>
            </div>
            {selection.kind === "shared" && (
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close evidence"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {provenance && (kind || certainty || kindSpread) && (
            {kind && <Tag tone={kind.tone}>{kind.label}</Tag>}
            {kind && <span>{kind.gloss}</span>}
            {certainty && <Tag tone={certainty.tone}>{certainty.label}</Tag>}
            {kindSpread && <span className="basis-full text-xs text-amber-800">Across these findings: {kindSpread}</span>}
            {certaintySpread && (
              <span className="basis-full text-xs text-amber-800">Certainty across these findings: {certaintySpread}</span>
            )}
          </div>
        )}

        <Section
          label={`Sources${
            shared ? ` (${shared.sources.length})` : sources.length > 1 ? ` (${sources.length})` : ""
          }`}
        >
          <div className="space-y-2">
            {shared
              ? shared.sources.map((entry, index) => (
                  <SourceCard
                    key={`${entry.location}:${entry.page}:${index}`}
                    source={entry.source}
                    index={index}
                    total={shared.sources.length}
                    active={index === activeIndex}
                    note={`cited by ${entry.rowIndexes.length} of ${scopeRows.length} findings`}
                    onSelect={() => onSourceSelect(entry.source)}
                  />
                ))
              : sources.map((entry, index) => (
                  <SourceCard
                    key={`${entry.location}:${entry.page}:${index}`}
                    source={entry}
                    index={index}
                    total={sources.length}
                    active={index === activeIndex}
                    onSelect={() => onSourceSelect(entry)}
                  />
                ))}
            {((shared && shared.sources.length === 0) || (!shared && sources.length === 0)) && (
            )}
            {shared && shared.rowsWithoutSource.length > 0 && shared.sources.length > 0 && (
              <p className="text-xs text-amber-800">
                {shared.rowsWithoutSource.length} of {scopeRows.length} findings cite no source for this value.
              </p>
            )}
          </div>
        </Section>

        {provenance?.derivation && (
          <Section label={`How it was derived${explainedFor}`}>{provenance.derivation}</Section>
        )}
        {provenance?.reasoning && <Section label={`Reasoning${explainedFor}`}>{provenance.reasoning}</Section>}
        {provenance?.source_components?.length ? (
          <Section label="Derivation inputs">
            <ul className="space-y-1">
              {provenance.source_components.map((component, index) => (
                <li key={`${component.label}:${index}`} className="flex flex-wrap items-baseline gap-x-2">
                  {component.sources.map((entry, sourceIndex) => (
                    <button
                      key={`${entry.location}:${entry.page}:${sourceIndex}`}
                      type="button"
                      onClick={() => onSourceSelect(entry)}
                    >
                      p. {entry.page}
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        {provenance?.missing_reason && <Section label="Why there is no value">{provenance.missing_reason}</Section>}
      </section>

      <div className="min-h-[620px] xl:h-[calc(100vh-8rem)]">
        <EvidencePanel
          runId={runId}
          paperId={paper.paper_id}
          pdfUrl={pdfUrl(runId, paper.pdf)}
          source={shown}
          pdfAvailable={paper.pdf_available}
        />
      </div>
    </div>
  );
}
