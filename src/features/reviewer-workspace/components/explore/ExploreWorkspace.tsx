"use client";

import * as Popover from "@radix-ui/react-popover";
import remarkGfm from "remark-gfm";
import { fetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import EvidencePanel from "../EvidencePanel";
import { resolveRunId } from "../../data/runResolver";
import { useReviewState } from "../../hooks/useReviewState";
import type {
  ExploreEvidence as Evidence,
  ExploreRequest,
  ExploreResponse,
  ProvSource,
} from "../../types";

const prompts = [
  "Compare effect estimates for c.2846A>T across studies.",
  "Where are the weakest extractions that could change a toxicity conclusion?",
];

  evidence: Evidence;
  children: ReactNode;
  onSelect: (evidence: Evidence) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinned = useRef(false);
  const rationale = evidence.reasoning ?? evidence.derivation;

  function keepOpen() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setOpen(true);
  }

  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  function pinOpen() {
    pinned.current = true;
    keepOpen();
  }

    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  return (
      <Popover.Anchor asChild>
        <button
          type="button"
          onMouseEnter={keepOpen}
          onMouseLeave={closeSoon}
          onClick={pinOpen}
        >
          {children}
        </button>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={{ top: 72, right: 16, bottom: 96, left: 16 }}
          sticky="always"
          onMouseEnter={keepOpen}
          onMouseLeave={closeSoon}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          </div>
            )}
          </div>
            {rationale ?? "The extracted value is reported directly in the cited passage."}
          </p>
          {evidence.derivation && evidence.derivation !== rationale && (
          )}
                  <button
                    type="button"
                  >
                  </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function EvidenceAnswer({ response, onSelect }: {
  response: ExploreResponse;
  onSelect: (evidence: Evidence) => void;
}) {
      a: ({ href, children }) => {
        if (href?.startsWith("#evidence=")) {
          const evidence = evidenceById.get(href.slice("#evidence=".length));
          if (!evidence) return <span>{children}</span>;
          return (
              {children}
            </EvidenceProvenanceLink>
          );
        }
        return <a href={href}>{children}</a>;
      },
      {response.answer}
    </ReactMarkdown>
  );
}

const ExploreWorkspace = ({ topicId }: { topicId: string }) => {
  // `resolveRunId` is a synchronous env lookup. Reading the run id off
  // `useRunSnapshot` would start four snapshot queries this view never uses.
  const runId = useMemo(() => resolveRunId(topicId), [topicId]);
  const { actions } = useReviewState(topicId, runId);
  const sourceLensRef = useRef<HTMLElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abandon an in-flight question when the view goes away, so the response
  // never lands on an unmounted tree.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (turns.length === 0 && !loading) return;
  }, [turns.length, loading]);
  const source = useMemo<ProvSource | null>(() => active ? ({
    quote: active.quote ?? "",
    location: active.location ?? "",
    page: active.article_page ?? active.pdf_page ?? 1,
    resolution: active.resolution,
    highlight: active.highlight ?? undefined,
    cell: active.cell ?? undefined,
  }) : null, [active]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion || !runId || loading) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData<ExploreRequest, ExploreResponse>(
        routes.api.exploreQuery,
        "POST",
        {
          session_id: sessionId,
          question: nextQuestion,
          review_overlay: actions,
        }
      );
      if (controller.signal.aborted) return;
      setTurns((current) => [...current, { question: nextQuestion, response: result }]);
      setQuestion("");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Explore could not complete this query.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function selectEvidence(evidence: Evidence) {
    setActive(evidence);
    window.requestAnimationFrame(() => {
        sourceLensRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  return (
      <div className="mt-6">
            <div>
                <Sparkles className="h-4 w-4" /> Agentic evidence search
              </div>
                Ask across the reviewed evidence. Each supported claim opens directly to its source passage.
              </p>
            </div>
              {actions.length} reviewer decision{actions.length === 1 ? "" : "s"} applied
            </div>
          </div>

            <div
              role="log"
              aria-live="polite"
              aria-busy={loading}
            >
              {turns.length === 0 && !loading && (
                <div className="mx-auto max-w-xl py-8">
                  <div className="mt-6 space-y-2">
                    {prompts.map((prompt) => (
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {turns.map((turn, turnIndex) => {
                const revisedQueries = countRevisedQueries(turn.response.steps);
                const paperCount = new Set(turn.response.evidence.map((item) => item.paper_id)).size;
                return (
                    <div className="mb-5 flex justify-end">
                        {turn.question}
                      </div>
                    </div>
                      <EvidenceAnswer response={turn.response} onSelect={selectEvidence} />
                    </div>

                    {turn.response.evidence.length > 0 && (
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                          Supporting passages · {turn.response.evidence.length} from {paperCount} paper{paperCount === 1 ? "" : "s"}
                        </summary>
                          {turn.response.evidence.map((item) => (
                            <button
                              key={item.evidence_id}
                              type="button"
                              onClick={() => selectEvidence(item)}
                            >
                            </button>
                          ))}
                        </div>
                      </details>
                    )}

                      <details className="group mt-3">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                        </summary>
                          {turn.response.steps.map((step, index) => (
                            </li>
                          ))}
                        </ol>
                      </details>
                  </article>
                );
              })}
              {loading && (
                <div className={`mx-auto flex max-w-sm flex-col items-center text-center ${turns.length ? "py-12" : "py-24"}`}>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
            {!runId && (
              <div className="border-t bg-white px-5 py-4">
                  Explore is available for the pinned DPYD reviewer release. No
                  snapshot is configured for this topic, so there is nothing to
                  ask about here.
                </div>
              </div>
            )}
              <label htmlFor="explore-question" className="sr-only">Ask the reviewed evidence</label>
              </div>
            </form>
          </section>

            {runId && active && source ? (
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1"><EvidencePanel runId={runId} paperId={active.paper_id} pdfUrl={pdfUrl(runId, active.pdf_path)} source={source} pdfAvailable={active.pdf_available} /></div>
              </div>
            ) : (
            )}
          </aside>
        </div>
      </div>
  );
};

export default ExploreWorkspace;
