import { Vote } from "../../../types/vote";

export type StatementCitation = NonNullable<Vote["citations"]>[number];

/**
 * Against-vote spans over a statement. Ranges are half-open [start, end) and may start at index 0.
 */
export function parseStatementCitation(
  value: unknown
): StatementCitation | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (!("start" in value) || !("end" in value)) return undefined;

  const { start, end } = value;
  if (
    typeof start !== "number" ||
    typeof end !== "number" ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end <= start
  ) {
    return undefined;
  }

  return { start, end };
}

export function citationsFromVotes(votes: Vote[]): StatementCitation[] {
  return votes
    .filter((vote) => vote.position === "Against")
    .flatMap((vote) => vote.citations ?? [])
    .flatMap((citation) => {
      const parsed = parseStatementCitation(citation);
      return parsed ? [parsed] : [];
    });
}

/** Character offsets of the current selection within the element's text content. */
export function selectionOffsetsWithin({
  element,
}: {
  element: HTMLElement;
}): StatementCitation | undefined {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.toString()) {
    return undefined;
  }

  const selectedRange = selection.getRangeAt(0);
  if (!element.contains(selectedRange.commonAncestorContainer)) {
    return undefined;
  }

  const precedingRange = document.createRange();
  precedingRange.selectNodeContents(element);
  precedingRange.setEnd(
    selectedRange.startContainer,
    selectedRange.startOffset
  );
  const start = precedingRange.toString().length;
  const end = start + selectedRange.toString().length;
  return parseStatementCitation({ start, end });
}

export function excerptForCitation({
  statement,
  citation,
}: {
  statement: string;
  citation: StatementCitation | undefined;
}): string {
  if (!citation) return "";
  return statement.substring(citation.start, citation.end);
}
