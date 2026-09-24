"use client";

import * as Popover from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import EvidencePanel from "../EvidencePanel";
import { fetchManifest, pdfUrl } from "../../data/snapshot";
import { resolveRunId } from "../../data/runResolver";
import { useReviewState } from "../../hooks/useReviewState";
import { reviewerWorkspaceQueryKeys } from "../../hooks/useRunSnapshot";
import { useWorkingSet } from "../../hooks/useWorkingSet";
import { displayValue } from "../../model/display";
import {
  countRevisedQueries,
  displayTitle,
  evidenceKind,
  hasMembershipUpdate,
  isFailedMembershipUpdate,
  stepLabel,
  valueSources,
} from "../../model/exploreView";
import { excludedLensNote, revisionTag } from "../../model/membership";
import { MembershipBubble } from "./MembershipBubble";
import { MembershipContext } from "./membershipContext";
import { WorkingSetSummary } from "./WorkingSetSummary";
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

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]';

function focusablesIn(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // Not getClientRects(): a closed <details> keeps boxes for content that can't take focus.
    (node) => node.tabIndex >= 0 && node.checkVisibility()
  );
}

/** The next page control after `anchor`, skipping portaled pop-ups. */
function nextFocusableAfter(anchor: HTMLElement): HTMLElement | null {
  return (
    focusablesIn(document).find(
      (node) =>
        !node.closest("[data-radix-popper-content-wrapper]") &&
        !anchor.contains(node) &&
        Boolean(anchor.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)
    ) ?? null
  );
}

const CHIP = "rounded-md px-2 py-0.5 text-xs font-bold";

function sourceCaption(item: Evidence): string {
  return [
    displayTitle(item.title),
    item.location,
    item.article_page != null ? `article page ${item.article_page}` : null,
    item.pdf_available ? null : "no PDF",
  ]
    .filter(Boolean)
    .join(" · ");
}

function EvidenceProvenanceLink({ evidence, sources, children, onSelect }: {
  evidence: Evidence;
  sources: Evidence[];
  children: ReactNode;
  onSelect: (evidence: Evidence) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Opening a bubble's editor pins the pop-up, so pinned also covers "editor open".
  const pinned = useRef(false);
  const suppressFocusOpen = useRef(false);
  const claimRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rationale = evidence.reasoning ?? evidence.derivation;
  const certainty = evidence.extraction_certainty;
  const kind = evidenceKind(evidence);

  function keepOpen() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setOpen(true);
  }

  function closeSoon() {
    if (pinned.current) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  function pinOpen() {
    pinned.current = true;
    keepOpen();
  }

  function close() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    pinned.current = false;
    setOpen(false);
  }

  function focusIsInside() {
    return Boolean(contentRef.current?.contains(document.activeElement));
  }

  // Return focus to the claim without reopening the pop-up from its focus handler.
  function focusClaim() {
    const claim = claimRef.current;
    if (!claim) return;
    if (document.activeElement !== claim) suppressFocusOpen.current = true;
    claim.focus({ preventScroll: true });
  }

  function onClaimFocus() {
    if (suppressFocusOpen.current) {
      suppressFocusOpen.current = false;
      return;
    }
    keepOpen();
  }

  function activateQuote(item: Evidence) {
    const refocus = pinned.current || focusIsInside();
    close();
    onSelect(item);
    if (refocus) focusClaim();
  }

  // The content is portaled, so Tab is bridged: claim → first quote, and past
  // the last bubble on to the next page control after the claim.
  function onClaimKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Tab" || event.shiftKey || !open || !contentRef.current) return;
    const first = focusablesIn(contentRef.current)[0];
    if (!first) return;
    event.preventDefault();
    first.focus();
  }

  function onContentKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const content = contentRef.current;
    // Keys from the nested editor bubble up the React tree; they are not ours.
    if (event.key !== "Tab" || !content || !content.contains(event.target as Node)) return;
    const items = focusablesIn(content);
    const index = items.indexOf(event.target as HTMLElement);
    if (event.shiftKey && index === 0) {
      event.preventDefault();
      focusClaim();
    } else if (!event.shiftKey && index === items.length - 1) {
      event.preventDefault();
      const claim = claimRef.current;
      const next = claim ? nextFocusableAfter(claim) : null;
      close();
      if (next) next.focus();
      else focusClaim();
    }
  }

  function onEditorOpenChange(next: boolean) {
    if (next) pinOpen();
  }

  return (
    <Popover.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) pinned.current = false; setOpen(nextOpen); }}>
      <Popover.Anchor asChild>
        <button
          ref={claimRef}
          type="button"
          data-claim-evidence={evidence.evidence_id}
          onMouseEnter={keepOpen}
          onMouseLeave={closeSoon}
          onFocus={onClaimFocus}
          onClick={pinOpen}
          onKeyDown={onClaimKeyDown}
        >
          {children}
        </button>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={{ top: 72, right: 16, bottom: 96, left: 16 }}
          sticky="always"
          onMouseEnter={keepOpen}
          onMouseLeave={closeSoon}
          onKeyDown={onContentKeyDown}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={() => {
            if (pinned.current || focusIsInside()) focusClaim();
          }}
          // The claim is the anchor, not a trigger: pressing or refocusing it is not "outside".
          onInteractOutside={(event) => {
            if (event.target instanceof Node && claimRef.current?.contains(event.target)) event.preventDefault();
          }}
          aria-label="Value and sources"
          style={{ maxHeight: "var(--radix-popover-content-available-height)" }}
        >
            {displayValue(evidence.value)}
          </div>
          <div data-hover-block="chips" className="mt-2 flex flex-wrap gap-1.5">
            {certainty && (
                {certainty}
              </span>
            )}
              {kind}
            </span>
          </div>
            {rationale ?? "The extracted value is reported directly in the cited passage."}
          </p>
          {evidence.derivation && evidence.derivation !== rationale && (
          )}
          <div data-hover-block="sources" className="mt-1">
            {sources.map((item) => {
              const quote = `“${item.quote ?? item.location ?? "Source passage"}”`;
              return (
                  <button
                    type="button"
                    onClick={() => activateQuote(item)}
                    aria-label={`${quote} — ${item.pdf_available ? "opens the PDF at this passage" : "opens the source details"}`}
                  >
                    {quote}
                  </button>
                  <div className="mt-2">
                    <MembershipBubble paperId={item.paper_id} title={displayTitle(item.title)} onEditorOpenChange={onEditorOpenChange} />
                  </div>
                </figure>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function EvidenceAnswer({ response, onSelect }: {
  response: ExploreResponse;
  onSelect: (evidence: Evidence) => void;
}) {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // A new `components.a` each render would be a new element type, remounting
  // every claim link (and closing an open pop-up) on any parent re-render,
  // such as a working-set refresh.
  const components = useMemo<Components>(() => {
    const evidenceById = new Map(response.evidence.map((item) => [item.evidence_id, item]));
    const select = (evidence: Evidence) => onSelectRef.current(evidence);
    return {
      a: ({ href, children }) => {
        if (href?.startsWith("#evidence=")) {
          const evidence = evidenceById.get(href.slice("#evidence=".length));
          if (!evidence) return <span>{children}</span>;
          return (
            <EvidenceProvenanceLink evidence={evidence} sources={valueSources(response.evidence, evidence)} onSelect={select}>
              {children}
            </EvidenceProvenanceLink>
          );
        }
        return <a href={href}>{children}</a>;
      },
    };
  }, [response.evidence]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {response.answer}
    </ReactMarkdown>
  );
}

const browserSessionStorage = () => window.sessionStorage;

const ExploreWorkspace = ({ topicId }: { topicId: string }) => {
  // `resolveRunId` is a synchronous env lookup. Reading the run id off
  // `useRunSnapshot` would start four snapshot queries this view never uses.
  const runId = useMemo(() => resolveRunId(topicId), [topicId]);
  const { actions } = useReviewState(topicId, runId);
  // Same query key as Data → Table, so both views read and update one cache.
  const workingSet = useWorkingSet(topicId, runId);
  const manifestQuery = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.manifest(runId ?? "unresolved"),
    queryFn: () => fetchManifest(runId!),
    enabled: Boolean(runId),
  });
  const titles = useMemo(
    () => new Map((manifestQuery.data?.papers ?? []).map((paper) => [paper.paper_id, displayTitle(paper.title)])),
    [manifestQuery.data]
  );
  const titleFor = useCallback((paperId: string) => titles.get(paperId) ?? paperId, [titles]);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const membershipContext = useMemo(
    () => ({ workingSet, onSaved: setMembershipStatus }),
    [workingSet]
  );
  // A trip to Review unmounts this view; coming back restores the same
  // conversation, Explore session and open source for this topic and run.
  const storageKey = runId ? chatSessionKey(topicId, runId) : null;
  const [restored] = useState(() => (storageKey ? readChatSession(browserSessionStorage, storageKey) : null));
  const sourceLensRef = useRef<HTMLElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState(() => restored?.turns ?? []);
  const [active, setActive] = useState<Evidence | null>(() => restored?.active ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abandon an in-flight question when the view goes away, so the response
  // never lands on an unmounted tree.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (storageKey) writeChatSession(browserSessionStorage, storageKey, { sessionId, turns, active });
  }, [storageKey, sessionId, turns, active]);

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
    // The last "Done" describes an earlier save; the answer may change the set.
    setMembershipStatus(null);
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
      // Re-read after any agent change, so bubbles and counts follow the server.
      if (hasMembershipUpdate(result.steps)) void workingSet.refresh();
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Explore could not complete this query.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

    setMembershipStatus(null);
  function selectEvidence(evidence: Evidence) {
    setActive(evidence);
    window.requestAnimationFrame(() => {
        sourceLensRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const activeMember = active ? workingSet.members.get(active.paper_id) : undefined;
  const lensNote = activeMember ? excludedLensNote(activeMember) : null;

  return (
    <MembershipContext.Provider value={membershipContext}>
      <div className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <Sparkles className="h-4 w-4" /> Agentic evidence search
              </div>
                Ask across the reviewed evidence. Each supported claim opens directly to its source passage.
              </p>
            </div>
              {actions.length} reviewer decision{actions.length === 1 ? "" : "s"} applied
            </div>
          </div>
          <WorkingSetSummary workingSet={workingSet} titleFor={titleFor} status={membershipStatus} />
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
                const tag = revisionTag(turn.response.set_revision, workingSet.revision);
                return (
                    <div className="mb-5 flex justify-end">
                        {turn.question}
                      </div>
                    </div>
                      <EvidenceAnswer response={turn.response} onSelect={selectEvidence} />
                    </div>
                    {tag && (
                        {tag.text}
                      </span>
                    )}

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

                    {turn.response.steps.length > 0 && (
                      <details className="group mt-3">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                          Analysis details · {turn.response.steps.length} step{turn.response.steps.length === 1 ? "" : "s"}{revisedQueries ? ` · ${revisedQueries} revised` : ""}
                        </summary>
                          {turn.response.steps.map((step, index) => (
                              {stepLabel(step)}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
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
                {lensNote && <p data-lens-note className="mb-3 rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs text-orange-900">{lensNote}</p>}
                <div className="min-h-0 flex-1"><EvidencePanel runId={runId} paperId={active.paper_id} pdfUrl={pdfUrl(runId, active.pdf_path)} source={source} pdfAvailable={active.pdf_available} /></div>
              </div>
            ) : (
            )}
          </aside>
        </div>
      </div>
    </MembershipContext.Provider>
  );
};

export default ExploreWorkspace;
