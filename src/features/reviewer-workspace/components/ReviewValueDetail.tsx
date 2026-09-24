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
              }`}
            >
              <button
                type="button"
                data-testid={`value-quote-${index}`}
                aria-current={activeSource === source ? "true" : undefined}
                className="block w-full min-w-0 text-left"
                onClick={() => onSourceSelect?.(source)}
              >
                  “{source.quote}”
                </span>
                  Source {index + 1} of {sources.length} · article page {source.page}
                </span>
                  {source.location}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
          No direct source citation for this value.
        </p>
      )}

      {showDerivation && (
        <p
          data-testid="value-detail-derivation"
        >
          <span className="font-bold">Derivation:</span> {derivation}
        </p>
      )}
      <p
        data-testid="value-detail-reasoning"
      >
        <span className="font-bold">Reasoning:</span>{" "}
        {shownReasoning ? reasoning : "none recorded"}
      </p>
    </div>
  );
};

export default ReviewValueDetail;
