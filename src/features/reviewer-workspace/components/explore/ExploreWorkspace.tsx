"use client";

import { FormEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronRight, FileSearch, Loader2, Quote, Sparkles } from "lucide-react";
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
import { chatSessionKey, newChatSession, readChatSession, writeChatSession } from "../../model/chatSession";
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
  "Which papers include any tests for any of the hapb3 variants?",
  "Compare effect estimates for c.2846A>T across studies.",
  "Where are the weakest extractions that could change a toxicity conclusion?",
];

// The API answers in one response, so these stages are paced on the client:
// they show the request is still moving, not which tool is running. The last
// stage holds until the answer lands.
export const PROGRESS_STAGES = [
  "Reading your question",
  "Searching the extraction tables",
  "Cross-checking findings across papers",
  "Locating supporting source passages",
  "Writing the answer",
];
export const PROGRESS_STAGE_MS = 6000;

function ProgressStages() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= PROGRESS_STAGES.length - 1) return;
    const timer = setTimeout(() => setStage((current) => current + 1), PROGRESS_STAGE_MS);
    return () => clearTimeout(timer);
  }, [stage]);
  return (
    <ol className="mt-3 space-y-1.5 text-left text-sm" aria-live="polite">
      {PROGRESS_STAGES.map((label, index) => (
        <li
          key={label}
          className={`flex items-center gap-2 ${index === stage ? "font-medium text-mc-ink-accent" : "text-muted-foreground"}`}
          aria-current={index === stage ? "step" : undefined}
        >
          {index < stage ? <Check className="h-3.5 w-3.5" /> : index === stage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-3.5 w-3.5" />}
          {label}{index === stage ? "…" : ""}
        </li>
      ))}
    </ol>
  );
}

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
  /** Every source of the linked value, in source_index order. */
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
          className="inline cursor-pointer border-b border-dotted border-mc-ink-secondary bg-transparent p-0 font-inherit text-inherit no-underline transition-colors hover:border-mc-ink-accent hover:bg-secondary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          className="z-50 w-[min(390px,calc(100vw-2rem))] overflow-y-auto rounded-lg border bg-card p-4 text-left shadow-[0_14px_40px_-16px_rgba(15,23,42,0.45)] outline-none"
        >
          <div data-hover-block="value" className="text-xs font-semibold leading-5 text-foreground">
            <span className="font-mono font-normal text-muted-foreground">{evidence.field}</span>{" "}
            {displayValue(evidence.value)}
          </div>
          <div data-hover-block="chips" className="mt-2 flex flex-wrap gap-1.5">
            {certainty && (
              <span data-chip="certainty" className={`${CHIP} ${certainty === "clean" ? "bg-mc-tint-grey-fill text-mc-tint-grey-ink" : "bg-amber-100 text-amber-800"}`}>
                {certainty}
              </span>
            )}
            <span data-chip="kind" className={`${CHIP} ${kind === "verbatim" ? "bg-mc-tint-blue-fill text-mc-tint-blue-ink" : "bg-mc-tint-purple-fill text-mc-tint-purple-ink"}`}>
              {kind}
            </span>
          </div>
          <p data-hover-block="reasoning" className="mt-3 text-xs leading-5 text-foreground">
            {rationale ?? "The extracted value is reported directly in the cited passage."}
          </p>
          {evidence.derivation && evidence.derivation !== rationale && (
            <p data-hover-block="derivation" className="mt-2 border-l-2 border-mc-line-accent pl-2 text-[11px] leading-4 text-muted-foreground">{evidence.derivation}</p>
          )}
          <div data-hover-block="sources" className="mt-1">
            {sources.map((item) => {
              const quote = `“${item.quote ?? item.location ?? "Source passage"}”`;
              return (
                <figure key={item.evidence_id} data-source-index={item.source_index} className="mt-3 border-l-2 pl-3">
                  <button
                    type="button"
                    onClick={() => activateQuote(item)}
                    aria-label={`${quote} — ${item.pdf_available ? "opens the PDF at this passage" : "opens the source details"}`}
                    className="block w-full cursor-pointer text-left text-xs italic leading-5 text-muted-foreground decoration-mc-ink-accent hover:text-mc-ink-accent hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {quote}
                    <span aria-hidden="true" className="not-italic text-mc-ink-accent"> ↗</span>
                  </button>
                  <figcaption className="mt-1 text-[11px] leading-4 text-muted-foreground">{sourceCaption(item)}</figcaption>
                  <div className="mt-2">
                    <MembershipBubble paperId={item.paper_id} title={displayTitle(item.title)} onEditorOpenChange={onEditorOpenChange} />
                  </div>
                </figure>
              );
            })}
          </div>
          <Popover.Arrow className="fill-card" />
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

/** Tailwind `xl`: chat and source lens sit side by side in fixed-height panes. */
const isTwoColumn = () => window.matchMedia("(min-width: 1280px)").matches;

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
  const [sessionId, setSessionId] = useState(() => restored?.sessionId ?? crypto.randomUUID());
  const sourceLensRef = useRef<HTMLElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
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

  // Without this a second answer renders below the fold and the screen looks
  // unchanged. Two columns: scroll the transcript pane only, never the page.
  // One column: the transcript grows with the page, so bring its end into view.
  useEffect(() => {
    if (turns.length === 0 && !loading) return;
    const transcript = transcriptRef.current;
    if (!transcript) return;
    if (isTwoColumn()) transcript.scrollTo({ top: transcript.scrollHeight, behavior: "smooth" });
    else transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, loading]);

  // Open on the newest answer: pin the transcript to its end whenever the pane
  // becomes visible (first render, a restored session, or a switch back from
  // Table, since Chat stays mounted behind `hidden`).
  useLayoutEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript || typeof ResizeObserver === "undefined") return;
    let wasVisible = false;
    const observer = new ResizeObserver(() => {
      const visible = transcript.clientHeight > 0;
      if (visible && !wasVisible) transcript.scrollTop = transcript.scrollHeight;
      wasVisible = visible;
    });
    observer.observe(transcript);
    return () => observer.disconnect();
  }, []);
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

  // A fresh session id makes the server start a new SQL session; the storage
  // effect above then overwrites the saved conversation with the empty one.
  function startNewChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    const fresh = newChatSession();
    setSessionId(fresh.sessionId);
    setTurns(fresh.turns);
    setActive(fresh.active);
    setLoading(false);
    setError(null);
    setMembershipStatus(null);
  }

  function selectEvidence(evidence: Evidence) {
    setActive(evidence);
    window.requestAnimationFrame(() => {
      if (!isTwoColumn()) {
        sourceLensRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const activeMember = active ? workingSet.members.get(active.paper_id) : undefined;
  const lensNote = activeMember ? excludedLensNote(activeMember) : null;

  return (
    <MembershipContext.Provider value={membershipContext}>
      <div className="mt-6">
        <div className="border-b pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-mc-ink-accent">
                <Sparkles className="h-4 w-4" /> Agentic evidence search
              </div>
              <h1 className="mt-2 text-2xl font-bold text-foreground">Explore the reviewed evidence</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Ask across the reviewed evidence. Each supported claim opens directly to its source passage.
              </p>
            </div>
            <div className="rounded-md border bg-secondary px-3 py-2 text-xs text-foreground">
              {actions.length} reviewer decision{actions.length === 1 ? "" : "s"} applied
            </div>
          </div>
          <WorkingSetSummary workingSet={workingSet} titleFor={titleFor} status={membershipStatus} />
        </div>

        {/* Two columns: one fixed-height pane pair, so the transcript scrolls
            inside itself and the source lens stays beside it. One column: the
            page scrolls as before. */}
        <div className="mt-5 grid min-h-[680px] grid-cols-1 overflow-hidden rounded-lg border bg-white shadow-sm xl:h-[calc(100vh-2rem)] xl:min-h-[560px] xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
          <section className="flex min-h-[620px] flex-col border-b xl:min-h-0 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-end border-b px-4 py-2">
              <button
                type="button"
                onClick={startNewChat}
                disabled={turns.length === 0 && !loading}
                className="rounded-md border bg-white px-2.5 py-1 text-xs font-semibold text-foreground transition hover:border-mc-line-accent hover:bg-secondary hover:text-mc-ink-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-white disabled:hover:text-foreground"
              >
                Clear chat
              </button>
            </div>
            <div
              ref={transcriptRef}
              className="min-h-0 flex-1 overflow-auto overscroll-contain p-5"
              role="log"
              aria-live="polite"
              aria-busy={loading}
            >
              {turns.length === 0 && !loading && (
                <div className="mx-auto max-w-xl py-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-mc-fill-solid text-mc-ink-on-fill"><FileSearch className="h-5 w-5" /></div>
                  <h2 className="mt-5 text-lg font-bold text-foreground">Start with an evidence question</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Ask about studies, variants, outcomes, effect estimates, or the strength of the extracted evidence.</p>
                  <div className="mt-6 space-y-2">
                    {prompts.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => setQuestion(prompt)} className="group flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm text-foreground transition hover:border-mc-line-accent hover:bg-secondary">
                        <span>{prompt}</span><ArrowRight className="h-4 w-4 shrink-0 text-mc-ink-secondary group-hover:text-mc-ink-accent" />
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
                  <article key={turnIndex} className={turnIndex > 0 ? "mt-10 border-t pt-8" : ""}>
                    <div className="mb-5 flex justify-end">
                      <div className="max-w-[88%] rounded-lg rounded-br-sm bg-secondary px-4 py-3 text-sm leading-6 text-foreground">
                        {turn.question}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Sparkles className="h-3.5 w-3.5" /> Synthesis</div>
                    <div className="prose prose-sm mt-3 max-w-none leading-7 prose-headings:text-foreground prose-table:block prose-table:overflow-x-auto prose-th:bg-secondary/50 prose-th:p-2 prose-td:p-2">
                      <EvidenceAnswer response={turn.response} onSelect={selectEvidence} />
                    </div>
                    {tag && (
                      <span data-revision-tag title={tag.title} className="mt-2 inline-block whitespace-nowrap rounded border border-mc-line-accent bg-secondary px-1.5 py-px text-[11px] text-foreground">
                        {tag.text}
                      </span>
                    )}

                    {turn.response.evidence.length > 0 && (
                      <details className="group mt-6 border-t pt-4">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                          Supporting passages · {turn.response.evidence.length} from {paperCount} paper{paperCount === 1 ? "" : "s"}
                        </summary>
                        <div className="mt-3 divide-y rounded-md border bg-secondary/50">
                          {turn.response.evidence.map((item) => (
                            <button
                              key={item.evidence_id}
                              type="button"
                              onClick={() => selectEvidence(item)}
                              className={`block w-full px-3 py-2.5 text-left transition first:rounded-t-md last:rounded-b-md ${active?.evidence_id === item.evidence_id ? "bg-secondary" : "hover:bg-white"}`}
                            >
                              <span className="block truncate text-xs font-semibold text-foreground">{displayTitle(item.title)}</span>
                              {item.quote && <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">{item.quote}</span>}
                            </button>
                          ))}
                        </div>
                      </details>
                    )}

                    {turn.response.steps.length > 0 && (
                      <details className="group mt-3">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                          Analysis details · {turn.response.steps.length} step{turn.response.steps.length === 1 ? "" : "s"}{revisedQueries ? ` · ${revisedQueries} revised` : ""}
                        </summary>
                        <ol className="mt-3 space-y-1.5 border-l pl-4">
                          {turn.response.steps.map((step, index) => (
                            <li key={index} className={`text-xs leading-5 ${isFailedMembershipUpdate(step) ? "font-semibold text-mc-alert-ink" : "text-muted-foreground"}`}>
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
                  <Loader2 className="h-7 w-7 animate-spin text-mc-ink-accent" />
                  <h2 className="mt-4 font-bold text-foreground">Reviewing the evidence</h2>
                  <ProgressStages />
                </div>
              )}
              {error && <div className="rounded-md border border-mc-alert-border bg-mc-alert-fill p-4 text-sm text-mc-alert-ink">{error}</div>}
              <div ref={transcriptEndRef} />
            </div>
            {!runId && (
              <div className="border-t bg-white px-5 py-4">
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Explore is available for the pinned DPYD reviewer release. No
                  snapshot is configured for this topic, so there is nothing to
                  ask about here.
                </div>
              </div>
            )}
            <form onSubmit={submit} className="border-t bg-secondary/50 p-4">
              <label htmlFor="explore-question" className="sr-only">Ask the reviewed evidence</label>
              <div className="flex items-end gap-2 rounded-md border border-mc-line-input bg-white p-2 shadow-sm focus-within:border-mc-line-accent">
                <textarea id="explore-question" rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder="Ask about variants, outcomes, effect estimates, or extraction quality…" className="min-h-12 flex-1 resize-none px-2 py-2 text-sm focus:outline-none" />
                <button disabled={!question.trim() || !runId || loading} className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Search the evidence"><ArrowRight className="h-4 w-4" /></button>
              </div>
            </form>
          </section>

          <aside ref={sourceLensRef} data-membership-scope="lens" className="min-h-[620px] scroll-mt-4 bg-secondary/50 p-4 xl:min-h-0 xl:overflow-hidden">
            {runId && active && source ? (
              <div className="flex h-full flex-col">
                <div className="mb-3 flex items-center justify-between gap-3 px-1"><div className="min-w-0"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Quote className="h-3.5 w-3.5" /> Source lens</div><div className="mt-1 flex flex-wrap items-center gap-2"><span className="max-w-md truncate text-sm font-bold text-foreground">{displayTitle(active.title)}</span><MembershipBubble paperId={active.paper_id} title={displayTitle(active.title)} /></div></div>{active.pdf_page && <div className="shrink-0 text-xs text-muted-foreground">PDF page {active.pdf_page}</div>}</div>
                {lensNote && <p data-lens-note className="mb-3 rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs text-orange-900">{lensNote}</p>}
                <div className="min-h-0 flex-1"><EvidencePanel runId={runId} paperId={active.paper_id} pdfUrl={pdfUrl(runId, active.pdf_path)} source={source} pdfAvailable={active.pdf_available} /></div>
              </div>
            ) : (
              <div className="flex h-full min-h-[500px] items-center justify-center rounded-md border border-dashed bg-white p-8 text-center"><div><FileSearch className="mx-auto h-8 w-8 text-mc-ink-secondary" /><h2 className="mt-4 font-bold text-foreground">Source evidence appears here</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Select an underlined claim in the answer to open its PDF at the supporting passage.</p></div></div>
            )}
          </aside>
        </div>
      </div>
    </MembershipContext.Provider>
  );
};

export default ExploreWorkspace;
