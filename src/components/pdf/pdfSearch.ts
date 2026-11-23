import * as pdfjs from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { SourceRect } from "../../../types/DataExtraction";

export type TextRun = SourceRect & { str: string; hasEOL: boolean };

export type SearchMatch = { page: number; rects: SourceRect[] };

export type PageMatch = { rects: SourceRect[]; current: boolean };

export async function pageText(page: PDFPageProxy): Promise<TextRun[]> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  return content.items
    .filter((item): item is TextItem => "str" in item)
    .map((item) => {
      const [, , c, d, x, baseline] = pdfjs.Util.transform(
        viewport.transform,
        item.transform
      );
      const height = Math.hypot(c, d);
      return {
        str: item.str,
        hasEOL: item.hasEOL,
        x: x / viewport.width,
        y: (baseline - height) / viewport.height,
        w: item.width / viewport.width,
        h: height / viewport.height,
      };
    });
}

export function findMatches(pages: TextRun[][], query: string): SearchMatch[] {
  const needle = query.toLowerCase();
  if (!needle.trim()) return [];
  const matches: SearchMatch[] = [];
  pages.forEach((runs, i) => {
    const starts: number[] = [];
    let text = "";
    for (const run of runs) {
      starts.push(text.length);
      text += run.str + (run.hasEOL ? " " : "");
    }
    const haystack = text.toLowerCase();
    for (
      let at = haystack.indexOf(needle);
      at !== -1;
      at = haystack.indexOf(needle, at + needle.length)
    ) {
      const end = at + needle.length;
      const rects = runs.flatMap((run, r) => {
        const from = Math.max(at, starts[r]) - starts[r];
        const to = Math.min(end, starts[r] + run.str.length) - starts[r];
        if (to <= from) return [];
        const perChar = run.w / run.str.length;
        return [{ x: run.x + from * perChar, y: run.y, w: (to - from) * perChar, h: run.h }];
      });
      matches.push({ page: i + 1, rects });
    }
  });
  return matches;
}

export function stepMatch(current: number, count: number, delta: 1 | -1): number {
  return count === 0 ? 0 : (current + delta + count) % count;
}

export function marksByPage(
  matches: SearchMatch[],
  current: number
): Map<number, PageMatch[]> {
  const map = new Map<number, PageMatch[]>();
  matches.forEach((match, i) => {
    const page = map.get(match.page) ?? [];
    page.push({ rects: match.rects, current: i === current });
    map.set(match.page, page);
  });
  return map;
}
