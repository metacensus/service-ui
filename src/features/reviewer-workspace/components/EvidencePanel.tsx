"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { bundleAssetUrl, fetchBundleFile } from "../data/snapshot";
import {
  isImageLocation,
  parseBundleTable,
  resolveCitedCell,
  splitOnQuote,
} from "../model/bundleView";
import type { ProvSource } from "../types";

const ViewPDF = lazy(() => import("@/components/pdf/ViewPDF"));

type EvidencePanelProps = {
  runId: string;
  paperId: string;
  pdfUrl: string;
  source: ProvSource | null;
  pdfAvailable?: boolean;
};

type Tab = "pdf" | "source";

// The provenance side of the two-pane review: the PDF with the cited region
// highlighted, and the extracted source file (section text or table) with the
// quote or cited cell marked. Every value under review keeps this one click
// away — the reviewer decides while looking at the evidence.
const EvidencePanel = ({
  runId,
  paperId,
  pdfUrl,
  source,
  pdfAvailable,
}: EvidencePanelProps) => {
  const [tab, setTab] = useState<Tab>("pdf");
  const [pdfState, setPdfState] = useState<
    "checking" | "available" | "missing"
  >(pdfAvailable === false ? "missing" : "checking");
  const isPageOnly =
    source?.resolution === "page_only" ||
    source?.resolution === "not_resolved_for_demo";
  const pdfHighlightPage =
    source?.highlight?.find((entry) => entry.rects.length > 0)?.page ??
    source?.highlight?.[0]?.page ??
    null;

  useEffect(() => {
    let alive = true;
    if (pdfAvailable !== undefined) {
      setPdfState(pdfAvailable ? "available" : "missing");
      return () => {
        alive = false;
      };
    }
    setPdfState("checking");
    fetch(pdfUrl, { method: "HEAD" })
      .then((response) => {
        if (!alive) return;
        const contentType = response.headers.get("content-type") ?? "";
        setPdfState(
          response.ok && contentType.toLowerCase().includes("application/pdf")
            ? "available"
            : "missing"
        );
      })
      .catch(() => alive && setPdfState("missing"));
    return () => {
      alive = false;
    };
  }, [pdfAvailable, pdfUrl]);

  return (
    <div className="flex h-full flex-col rounded-lg border bg-white shadow-sm">
      <div className="flex items-center gap-1 border-b p-2">
        <TabButton active={tab === "pdf"} onClick={() => setTab("pdf")}>
          PDF
        </TabButton>
        <TabButton active={tab === "source"} onClick={() => setTab("source")}>
          Source text
        </TabButton>
        {/*
          Page-only evidence keeps the plain "page N" label it has always shown
          in the Review and Data workspaces. Only resolved highlights, where the
          PDF page and the printed article page can genuinely differ, spell out
          which is which — and the article page is only worth naming when it is
          a real page number (some rows carry page 0).
        */}
        {pdfHighlightPage != null && !isPageOnly ? (
          <span className="ml-auto text-xs text-muted-foreground">
            PDF page {pdfHighlightPage}
            {source?.page != null &&
            source.page > 0 &&
            source.page !== pdfHighlightPage
              ? ` · article page ${source.page}`
              : ""}
          </span>
        ) : source?.page != null ? (
          <span className="ml-auto text-xs text-muted-foreground">
            page {source.page}
          </span>
        ) : null}
      </div>

      {tab === "pdf" && (
        <div className="relative flex-1 overflow-auto">
          {pdfState === "available" && isPageOnly && (
            <div className="border-b bg-secondary px-3 py-2 text-xs text-foreground">
              {source?.resolution === "not_resolved_for_demo"
                ? "This paper was not pre-highlighted for the demo. Showing the cited page; the quote remains available in Source text."
                : "An exact highlight could not be resolved for this value. Showing the cited page; the quote remains available in Source text."}
            </div>
          )}
          {pdfState === "checking" && (
            <div className="p-6 text-sm text-muted-foreground">Checking PDF…</div>
          )}
          {pdfState === "missing" && (
            <div className="p-6">
              <p className="text-sm font-medium text-foreground">
                PDF is not available in this snapshot.
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                The extracted source file and citation remain available in the
                Source text tab. No PDF viewer was opened for the missing asset.
              </p>
            </div>
          )}
          {pdfState === "available" && (
            <Suspense
              fallback={
                <div className="p-6 text-sm text-muted-foreground">Loading PDF…</div>
              }
            >
              <ViewPDF
                fileLocation={pdfUrl}
                highlight={isPageOnly ? null : source?.highlight ?? null}
                citedPage={pdfHighlightPage}
              />
            </Suspense>
          )}
        </div>
      )}

      {tab === "source" && (
        <div className="flex-1 overflow-auto p-4">
          <BundleView
            runId={runId}
            paperId={paperId}
            location={source?.location}
            quote={source?.quote ?? ""}
            cell={source?.cell}
          />
        </div>
      )}
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-sm px-3 py-1 text-xs font-bold ${
      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-mc-ink-accent"
    }`}
  >
    {children}
  </button>
);

// --- Source-text (bundle) rendering ------------------------------------------

const BundleView = ({
  runId,
  paperId,
  location,
  quote,
  cell,
}: {
  runId: string;
  paperId: string;
  location?: string;
  quote: string;
  cell?: { row: string; column: string };
}) => {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageSource = location
    ? isImageLocation(location)
      ? bundleAssetUrl(runId, paperId, location)
      : null
    : null;

  useEffect(() => {
    let alive = true;
    setText(null);
    setError(null);
    if (!location || isImageLocation(location)) return;
    fetchBundleFile(runId, paperId, location)
      .then((t) => alive && setText(t))
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [runId, paperId, location]);

  if (!location) {
    return (
      <p className="text-sm text-muted-foreground">
        This value has no cited source location.
      </p>
    );
  }
  if (imageSource) {
    return (
      <BundleImage
        src={imageSource}
        location={location}
        quote={quote}
      />
    );
  }
  if (error) {
    return (
      <p className="text-sm text-muted-foreground">Could not load {location}.</p>
    );
  }
  if (text === null) {
    return <p className="text-sm text-muted-foreground">Loading source…</p>;
  }

  const table = parseBundleTable(text);
  if (table) return <BundleTable table={table} cell={cell} />;
  return <BundleMarkdown text={text} quote={quote} />;
};

const BundleImage = ({
  src,
  location,
  quote,
}: {
  src: string;
  location: string;
  quote: string;
}) => {
  const alt = quote.trim()
    ? `Cited image source for quote: ${quote.trim()}`
    : `Cited image source: ${location}`;

  return (
    <figure>
      <div className="overflow-auto rounded-md border bg-secondary p-2">
        <img
          src={src}
          alt={alt}
          className="max-h-[70vh] max-w-full rounded-sm object-contain"
        />
      </div>
      <figcaption className="mt-2 break-all font-mono text-xs text-muted-foreground">
        {location}
      </figcaption>
    </figure>
  );
};

const BundleMarkdown = ({ text, quote }: { text: string; quote: string }) => {
  const segments = useMemo(() => splitOnQuote(text, quote), [text, quote]);
  const missingQuote =
    quote.trim().length > 0 && !segments.some((segment) => segment.mark);

  return (
    <>
      {missingQuote && (
        <div className="mb-3 rounded-md border bg-secondary px-3 py-2 text-xs text-foreground">
          Cited quote was not found in this source file. Showing the full
          source text without a highlight.
        </div>
      )}
      {!missingQuote && quote.trim() && (
        <div className="border-l-4 border-yellow-400 bg-yellow-50 px-4 py-3">
          <div className="text-xs font-bold uppercase text-yellow-900">
            Cited passage
          </div>
          <mark className="mt-2 block bg-yellow-200 text-sm leading-6 text-foreground">
            {quote.trim()}
          </mark>
        </div>
      )}
      <details open={missingQuote || !quote.trim()} className="mt-4">
        <summary className="cursor-pointer text-sm font-bold text-foreground">
          Surrounding source text
        </summary>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
          {segments.map((segment, i) =>
            segment.mark ? (
              <mark key={i} className="rounded-sm bg-yellow-200 px-0.5">
                {segment.text}
              </mark>
            ) : (
              <span key={i}>{readableBundleText(segment.text)}</span>
            )
          )}
        </div>
      </details>
    </>
  );
};

function readableBundleText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

const BundleTable = ({
  table,
  cell,
}: {
  table: ReturnType<typeof parseBundleTable> & object;
  cell?: { row: string; column: string };
}) => {
  const cited = resolveCitedCell(table, cell);
  const headers = table.headers ?? [];
  const rows = table.rows ?? [];

  return (
    <div className="overflow-x-auto">
      {table.title && (
        <div className="mb-2 text-xs font-bold text-foreground">{table.title}</div>
      )}
      <table className="w-full border-collapse text-xs">
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="border-b bg-secondary px-2 py-1 text-left font-bold text-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, ri) => {
            const rowHit = ri === cited.rowIndex;
            return (
              <tr key={ri} className={rowHit && cited.colIndex < 0 ? "bg-yellow-50" : ""}>
                {row.map((value, ci) => {
                  const cellHit = rowHit && ci === cited.colIndex;
                  return (
                    <td key={ci} className="border-b px-2 py-1 text-foreground">
                      {cellHit ? (
                        <mark className="rounded-sm bg-yellow-200 px-0.5">
                          {value}
                        </mark>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EvidencePanel;
