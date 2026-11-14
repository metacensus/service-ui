"use client";

import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SourceLocation } from "../../../types/DataExtraction";

// The worker is vendored in public/ and must match the installed pdfjs-dist.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

type ViewPDFProps = {
  fileLocation: string;
  highlight?: SourceLocation | null;
  citedPage?: number | null;
};

type PageSize = { width: number; height: number };

// A page is a canvas with a transparent text layer over it, so the browser can
// select text, and an overlay for highlights. The wrapper's `aria-label` is how
// capturePdfSelection finds the page a selection falls on. Pages draw once they
// scroll near the viewport and are released when they leave it.
function PdfPage({
  pdf,
  pageNumber,
  size,
  scale,
  rects,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  size: PageSize;
  scale: number;
  rects: SourceLocation[number]["rects"] | undefined;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setNear(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const textLayer = textRef.current;
    if (!canvas || !textLayer) return;
    if (!near) {
      canvas.width = 0;
      textLayer.replaceChildren();
      void pdf.getPage(pageNumber).then((page) => page.cleanup());
      return;
    }
    if (scale <= 0) return;
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    let textTask: { cancel: () => void } | null = null;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      const task = page.render({
        canvasContext: context,
        viewport,
        transform: [ratio, 0, 0, ratio, 0, 0],
      });
      renderTask = task;
      textLayer.replaceChildren();
      const text = pdfjs.renderTextLayer({
        textContentStream: page.streamTextContent(),
        container: textLayer,
        viewport,
      });
      textTask = text;
      await Promise.all([task.promise, text.promise]);
    })().catch(() => {
      // A cancelled render rejects; anything else leaves the page blank.
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textTask?.cancel();
    };
  }, [near, pdf, pageNumber, scale]);

  return (
    <div
      ref={wrapperRef}
      aria-label={`Page ${pageNumber}`}
      className="relative mb-2 bg-white shadow"
      style={{ width: size.width * scale, height: size.height * scale }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
      <div
        ref={textRef}
        className="absolute inset-0 overflow-hidden leading-none [&_span]:absolute [&_span]:origin-top-left [&_span]:cursor-text [&_span]:whitespace-pre [&_span]:text-transparent"
      />
      {rects && rects.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {rects.map((r, i) => (
            <div
              key={i}
              className="absolute rounded-sm border"
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
                backgroundColor: "rgba(255, 215, 0, 0.4)",
                borderColor: "rgba(218, 165, 32, 0.8)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

export default function ViewPDF({
  fileLocation,
  highlight,
  citedPage,
}: ViewPDFProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const jumpedTo = useRef<string | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [width, setWidth] = useState(0);
  // 1 fits a page to the viewer's width.
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const task = pdfjs.getDocument(fileLocation);
    setPdf(null);
    setSizes([]);
    setZoom(1);
    setCurrentPage(1);
    task.promise
      .then(async (doc) => {
        const pages = await Promise.all(
          Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1))
        );
        if (cancelled) return;
        setPdf(doc);
        setSizes(
          pages.map((page) => {
            const { width, height } = page.getViewport({ scale: 1 });
            return { width, height };
          })
        );
      })
      .catch(() => {
        // An unreadable document renders as an empty viewer.
      });
    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [fileLocation]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const highlightByPage = useMemo(() => {
    const map = new Map<number, SourceLocation[number]["rects"]>();
    if (!highlight) return map;
    for (const entry of highlight) {
      map.set(entry.page, entry.rects);
    }
    return map;
  }, [highlight]);

  const targetPage = useMemo(() => {
    const highlightedPage =
      highlight?.find((entry) => entry.rects.length > 0)?.page ??
      highlight?.[0]?.page ??
      null;
    const page = highlightedPage ?? citedPage ?? null;
    return Number.isInteger(page) && page !== null && page > 0 ? page : null;
  }, [citedPage, highlight]);

  const numPages = sizes.length;

  const goToPage = (page: number) =>
    rootRef.current
      ?.querySelector(`[aria-label="Page ${page}"]`)
      ?.scrollIntoView({ block: "start" });

  // Jump once per document and target, so resizing or zooming never snaps the
  // reader back to the cited page.
  useEffect(() => {
    if (numPages === 0 || width === 0 || targetPage === null) return;
    const key = `${fileLocation}|${targetPage}`;
    if (jumpedTo.current === key) return;
    jumpedTo.current = key;
    goToPage(Math.min(targetPage, numPages));
  }, [fileLocation, numPages, width, targetPage]);

  // The current page is the one under the middle of the viewport.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || numPages === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = entry.target
            .getAttribute("aria-label")
            ?.match(/^Page (\d+)$/);
          if (match) setCurrentPage(Number(match[1]));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    root
      .querySelectorAll('[aria-label^="Page "]')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, width, zoom]);

  const setClampedZoom = (next: number) =>
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)));

  return (
    <div ref={rootRef} className="w-full bg-muted">
      {numPages > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-center gap-1 border-b bg-background p-1">
          <Button
            variant="ghost"
            size="xs"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-16 text-center text-xs">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="xs"
            aria-label="Next page"
            disabled={currentPage >= numPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label="Zoom out"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => setClampedZoom(zoom - ZOOM_STEP)}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-xs">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="xs"
            aria-label="Zoom in"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => setClampedZoom(zoom + ZOOM_STEP)}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label="Fit width"
            disabled={zoom === 1}
            onClick={() => setZoom(1)}
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="mx-auto w-fit p-2">
          {pdf &&
            width > 0 &&
            sizes.map((size, i) => (
              <PdfPage
                key={i}
                pdf={pdf}
                pageNumber={i + 1}
                size={size}
                scale={((width - 16) / size.width) * zoom}
                rects={highlightByPage.get(i + 1)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
