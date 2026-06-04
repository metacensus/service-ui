import type { SourceLocation } from "../../types/DataExtraction";

export type PdfSelection = {
  text: string;
  sourceLocation: SourceLocation;
};

function findPageElement(
  node: Node | Element | null
): { pageEl: HTMLElement; pageIndex: number } | null {
  let el: Element | null =
    node instanceof Element ? node : node?.parentElement ?? null;
  while (el) {
    if (el instanceof HTMLElement) {
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel) {
        const match = ariaLabel.match(/^Page (\d+)$/);
        if (match) {
          return { pageEl: el, pageIndex: parseInt(match[1], 10) - 1 };
        }
      }
    }
    el = el.parentElement;
  }
  return null;
}

export function capturePdfSelection(
  container: HTMLElement
): PdfSelection | null {
  if (typeof window === "undefined") return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const { anchorNode, focusNode } = selection;
  if (
    !anchorNode ||
    !focusNode ||
    !container.contains(anchorNode) ||
    !container.contains(focusNode)
  ) {
    return null;
  }

  const text = selection.toString();
  if (!text) return null;

  const grouped = new Map<
    number,
    { pageEl: HTMLElement; rects: DOMRect[] }
  >();

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const rects = Array.from(range.getClientRects()).filter(
      (r) => r.width > 0 && r.height > 0
    );
    for (const rect of rects) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const target = document.elementFromPoint(cx, cy);
      const pageInfo = findPageElement(target);
      if (!pageInfo || !container.contains(pageInfo.pageEl)) continue;
      const existing = grouped.get(pageInfo.pageIndex);
      if (existing) {
        existing.rects.push(rect);
      } else {
        grouped.set(pageInfo.pageIndex, {
          pageEl: pageInfo.pageEl,
          rects: [rect],
        });
      }
    }
  }

  if (grouped.size === 0) return null;

  const sourceLocation: SourceLocation = [];
  for (const [pageIndex, { pageEl, rects }] of grouped) {
    const pageRect = pageEl.getBoundingClientRect();
    if (pageRect.width === 0 || pageRect.height === 0) continue;
    sourceLocation.push({
      page: pageIndex + 1,
      rects: rects.map((r) => ({
        x: (r.left - pageRect.left) / pageRect.width,
        y: (r.top - pageRect.top) / pageRect.height,
        w: r.width / pageRect.width,
        h: r.height / pageRect.height,
      })),
    });
  }
  sourceLocation.sort((a, b) => a.page - b.page);
  if (sourceLocation.length === 0) return null;

  return { text, sourceLocation };
}
