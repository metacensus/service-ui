"use client";

import type { ProvSource } from "../types";

type ReviewValueDetailProps = {
  sources: ProvSource[];
  derivation: string;
  reasoning: string;
  activeSource?: ProvSource | null;
  onSourceSelect?: (source: ProvSource) => void;
};

const ReviewValueDetail = ({
  sources,
  derivation,
  reasoning,
  activeSource,
  onSourceSelect,
}: ReviewValueDetailProps) => {
  const shownDerivation = derivation.trim();
  const shownReasoning = reasoning.trim();
  const showDerivation = shownDerivation.length > 0 && shownDerivation !== shownReasoning;

  return (
    <div data-testid="value-detail" className="rounded-lg border bg-white p-4 shadow-sm">
      {sources.length > 0 ? (
        <ol data-testid="value-detail-quotes" className="space-y-3">
          {sources.map((source, index) => (
            <li
              key={`${source.location}:${source.page}:${index}`}
              className={`border-l-2 pl-3 ${
                activeSource === source ? "border-mc-line-accent" : "border-border"
              }`}
            >
              <button
                type="button"
                data-testid={`value-quote-${index}`}
                aria-current={activeSource === source ? "true" : undefined}
                className="block w-full min-w-0 text-left"
                onClick={() => onSourceSelect?.(source)}
              >
                <span className="block text-sm italic text-foreground [overflow-wrap:anywhere]">
                  “{source.quote}”
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Source {index + 1} of {sources.length} · article page {source.page}
                </span>
                <span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  {source.location}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p data-testid="value-detail-quotes-empty" className="text-xs text-muted-foreground">
          No direct source citation for this value.
        </p>
      )}

      {showDerivation && (
        <p
          data-testid="value-detail-derivation"
          className="mt-3 text-sm text-foreground [overflow-wrap:anywhere]"
        >
          <span className="font-bold">Derivation:</span> {derivation}
        </p>
      )}
      <p
        data-testid="value-detail-reasoning"
        className="mt-3 text-sm text-foreground [overflow-wrap:anywhere]"
      >
        <span className="font-bold">Reasoning:</span>{" "}
        {shownReasoning ? reasoning : "none recorded"}
      </p>
    </div>
  );
};

export default ReviewValueDetail;
