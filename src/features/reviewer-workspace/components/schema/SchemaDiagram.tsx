"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import useIsomorphicLayoutEffect from "@/hooks/useIsomorphicLayoutEffect";
import { useQuery } from "@tanstack/react-query";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchNormalizationManifest,
  SCHEMA_DIAGRAM_GROUPS,
  type NormalizationManifest,
  type SchemaDiagramGroup,
} from "../../model/schemaNormalization";
import { reviewerWorkspaceQueryKeys } from "../../hooks/useRunSnapshot";
import {
  buildDiagramSections,
  buildFieldStatsView,
  concernKey,
  readConcerns,
  writeConcerns,
  type SchemaDiagramNode,
} from "../../model/schemaDiagram";
import {
  spaceSchemaFieldName,
  type SchemaExplorerModel,
} from "../../model/schemaView";

export function SchemaDiagram({
  model,
  runId,
}: {
  model: SchemaExplorerModel;
  runId: string | null;
}) {
  const queryRunId = runId ?? "unresolved";
  const { data: manifest } = useQuery({
    queryKey: reviewerWorkspaceQueryKeys.normalizationManifest(queryRunId),
    queryFn: () => fetchNormalizationManifest(queryRunId),
    enabled: runId !== null,
  });
  if (!runId) return null;
  return (
    <SchemaDiagramBody key={runId} manifest={manifest} model={model} runId={runId} />
  );
}

function SchemaDiagramBody({
  manifest,
  model,
  runId,
}: {
  manifest: NormalizationManifest | null | undefined;
  model: SchemaExplorerModel;
  runId: string;
}) {
  const [group, setGroup] = useState<SchemaDiagramGroup | null>(null);
  const [nodeKey, setNodeKey] = useState<string | null>(null);
  const [form, setForm] = useState<string | null>(null);
  const [papersRaw, setPapersRaw] = useState<string | null>(null);
  const [openFlag, setOpenFlag] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [concerns, setConcerns] = useState<Record<string, string>>(() =>
    readConcerns(runId)
  );
  const [top, setTop] = useState<number | null>(null);
  const editorId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const papersCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const papersPinnedRaw = useRef<string | null>(null);

  const { sections, labelsAvailable } = group
    ? buildDiagramSections(model, manifest ?? null, group)
    : { sections: [], labelsAvailable: true };
  const nodes = sections.flatMap((section) => section.nodes);
  const node = nodes.find((entry) => entry.key === nodeKey) ?? null;
  const labelEntry = node?.kind === "label" ? node.entry : null;
  const fieldView = node?.kind === "field" ? node.view : null;
  const fieldStats = fieldView
    ? buildFieldStatsView(fieldView, model.totals.papers)
    : null;

  const selectNode = (key: string | null) => {
    setNodeKey(key);
    setForm(null);
    closePapers();
    setOpenFlag(null);
  };

  const pickGroup = (next: SchemaDiagramGroup) => {
    setGroup(next === group ? null : next);
    selectNode(null);
  };

  const pickNode = (next: SchemaDiagramNode) =>
    selectNode(next.key === nodeKey ? null : next.key);

  const selectForm = (raw: string) => {
    setForm((prev) => (prev === raw ? null : raw));
  };

  const openPapers = (raw: string) => {
    if (papersCloseTimer.current) clearTimeout(papersCloseTimer.current);
    papersCloseTimer.current = null;
    if (papersPinnedRaw.current !== raw) papersPinnedRaw.current = null;
    setPapersRaw(raw);
  };

  const closePapersSoon = (raw: string) => {
    if (papersPinnedRaw.current === raw) return;
    if (papersCloseTimer.current) clearTimeout(papersCloseTimer.current);
    papersCloseTimer.current = setTimeout(() => setPapersRaw(null), 140);
  };

  const pinPapersOpen = (raw: string) => {
    papersPinnedRaw.current = raw;
    openPapers(raw);
  };

  const closePapers = () => {
    papersPinnedRaw.current = null;
    setPapersRaw(null);
  };

  const flagKey = (raw: string) => concernKey(nodeKey ?? "", raw);

  const openEditor = (raw: string) => {
    setForm(raw);
    if (openFlag === raw) {
      setOpenFlag(null);
      return;
    }
    setOpenFlag(raw);
    setDraft(concerns[flagKey(raw)] ?? "");
  };

  const saveConcern = () => {
    if (!openFlag) return;
    const value = draft.trim();
    if (!value) return;
    const next = { ...concerns, [flagKey(openFlag)]: value };
    writeConcerns(runId, next);
    setConcerns(next);
    setOpenFlag(null);
  };

  const removeConcern = () => {
    if (!openFlag) return;
    const next = { ...concerns };
    delete next[flagKey(openFlag)];
    writeConcerns(runId, next);
    setConcerns(next);
    setOpenFlag(null);
  };

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      setTop(Math.round(el.getBoundingClientRect().top + window.scrollY));
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const target = detailRef.current;
    if (!target) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    target.scrollIntoView({ block: "nearest" });
  }, [nodeKey, form]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openFlag) setOpenFlag(null);
      else if (form) setForm(null);
      else if (nodeKey) selectNode(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [form, nodeKey, openFlag]);

  useEffect(() => {
    const redraw = () =>
      drawDiagramLinks(diagramRef.current, svgRef.current);
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  });

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const buttons = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button[data-raw]"
      ),
    ];
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    const next: number | undefined = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: buttons.length - 1,
    }[event.key];
    if (index < 0 || next === undefined) return;
    event.preventDefault();
    buttons[Math.max(0, Math.min(buttons.length - 1, next))].focus();
  };

  return (
    <section
      aria-label="Schema diagram"
      className="mt-6 flex flex-col rounded-[10px] border border-border bg-white shadow-sm"
      data-testid="schema-diagram"
      ref={sectionRef}
      style={
        top === null ? undefined : { minHeight: `calc(100dvh - ${top}px)` }
      }
    >
      <div
        className="relative isolate grid flex-1 content-start grid-cols-1 items-start gap-4 px-[18px] py-5 md:grid-cols-[minmax(0,140px)_minmax(0,320px)_minmax(0,1fr)] md:gap-[26px] md:p-6 min-[1051px]:grid-cols-[minmax(0,154px)_minmax(0,390px)_minmax(0,1fr)] min-[1051px]:gap-[50px] min-[1051px]:py-[35px] min-[1051px]:pl-[34px] min-[1051px]:pr-[30px]"
        data-testid="schema-diagram-grid"
        ref={diagramRef}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
          data-testid="normalization-links"
          ref={svgRef}
        />
        <div className="relative z-10 flex flex-row flex-wrap gap-2.5 md:flex-col md:gap-[13px] md:pt-1.5">
          {SCHEMA_DIAGRAM_GROUPS.map((name) => (
            <button
              aria-pressed={group === name}
              className={cn(
                "flex min-h-[60px] items-center justify-center rounded-[10px] border px-2 py-2.5 text-center text-sm font-semibold leading-[1.5] text-foreground shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:whitespace-nowrap md:px-4 md:py-3",
                group === name
                  ? "border-current bg-mc-tint-blue-fill text-mc-tint-blue-ink"
                  : "border-border bg-white hover:border-mc-blue-mid"
              )}
              data-group={name}
              key={name}
              type="button"
              onClick={() => pickGroup(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="relative z-10 md:pt-1.5">
          {!group ? null : (
            <>
              {!labelsAvailable && (
                <>
                  <h3 className="mt-0 text-[11px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-muted-foreground">
                    Standardized labels
                  </h3>
                  <p
                    className="mt-2 text-sm text-foreground"
                    data-testid="schema-diagram-labels-unavailable"
                  >
                    Standardized labels are not available for this run.
                  </p>
                </>
              )}
              {sections.map((section, sectionIndex) => (
              <div key={section.title}>
                <h3
                  className={cn(
                    "text-[11px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-muted-foreground",
                    sectionIndex === 0 ? "mt-0" : "mt-[15px] md:mt-5"
                  )}
                >
                  {section.title}
                </h3>
                <div className="mt-[5px] grid grid-cols-2 gap-2 md:mt-2.5 md:gap-[13px]">
                  {section.nodes.map((entry) =>
                    entry.kind === "label" ? (
                      <button
                        aria-pressed={entry.key === nodeKey}
                        className={cn(
                          "flex min-h-[60px] w-full items-center justify-center rounded-[10px] border px-2 py-2.5 text-center font-mono text-[13px] font-semibold leading-[1.5] shadow-sm transition-colors [overflow-wrap:anywhere] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-4 md:py-3",
                          !entry.entry.primary && "text-[11px] leading-[1.35]",
                          entry.key === nodeKey
                            ? "border-current bg-mc-tint-blue-fill text-mc-tint-blue-ink"
                            : "border-border bg-white text-foreground hover:border-mc-blue-mid"
                        )}
                        data-label={entry.key}
                        key={entry.key}
                        type="button"
                        onClick={() => pickNode(entry)}
                      >
                        {entry.entry.label}
                      </button>
                    ) : (
                      <button
                        aria-label={spaceSchemaFieldName(entry.view.name)}
                        aria-pressed={entry.key === nodeKey}
                        className={cn(
                          "flex min-h-[60px] w-full items-center justify-center rounded-[10px] border px-2 py-2.5 text-center font-mono text-[11px] font-medium leading-[1.35] shadow-sm transition-colors [overflow-wrap:normal] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-4 md:py-3",
                          entry.key === nodeKey
                            ? "border-current bg-mc-tint-blue-fill text-mc-tint-blue-ink"
                            : "border-border bg-white text-foreground hover:border-mc-blue-mid"
                        )}
                        data-field={entry.view.name}
                        key={entry.key}
                        type="button"
                        onClick={() => pickNode(entry)}
                      >
                        {spaceSchemaFieldName(entry.view.name)}
                      </button>
                    )
                  )}
                </div>
              </div>
              ))}
            </>
          )}
        </div>
        <div className="relative z-10 scroll-mb-32 md:pl-1.5" ref={detailRef}>
          {labelEntry && (
            <div>
              <ul
                className="space-y-[7px]"
                onKeyDown={onListKeyDown}
              >
                {labelEntry.forms.map((entry) => {
                  const saved = Boolean(concerns[flagKey(entry.raw)]);
                  const open = openFlag === entry.raw;
                  const multi = entry.papers.length > 1;
                  const papersOpen = papersRaw === entry.raw;
                  return (
                    <li key={entry.raw}>
                      <div className="flex items-stretch gap-1.5">
                        <div
                          className={cn(
                            "flex min-h-[38px] w-full min-w-0 flex-col items-stretch gap-0.5 rounded-lg border bg-white px-3 py-2 transition-colors hover:border-mc-ink-secondary sm:flex-row sm:items-baseline sm:gap-2.5",
                            entry.raw === form
                              ? "border-mc-tint-blue-ink bg-mc-tint-blue-fill"
                              : "border-border"
                          )}
                        >
                          <button
                            aria-pressed={entry.raw === form}
                            className={cn(
                              "line-clamp-2 min-w-0 flex-1 text-left font-mono text-[12.5px] font-normal leading-[1.5] [overflow-wrap:anywhere] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              entry.raw === form &&
                                "text-mc-tint-blue-ink"
                            )}
                            data-raw={entry.raw}
                            type="button"
                            title={entry.raw}
                            onClick={() => selectForm(entry.raw)}
                          >
                            {entry.raw}
                          </button>
                          {multi ? (
                            <Popover.Root
                              open={papersOpen}
                              onOpenChange={(nextOpen) => {
                                if (!nextOpen) closePapers();
                              }}
                            >
                              <Popover.Anchor asChild>
                                <button
                                  aria-expanded={papersOpen}
                                  className={cn(
                                    "shrink-0 cursor-pointer self-start border-b border-dotted border-mc-ink-secondary bg-transparent p-0 text-left text-[11.5px] no-underline transition-colors hover:border-mc-blue-mid hover:text-mc-tint-blue-ink focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto",
                                    entry.raw === form &&
                                      "text-mc-tint-blue-ink"
                                  )}
                                  data-papers={entry.raw}
                                  type="button"
                                  onMouseEnter={() => openPapers(entry.raw)}
                                  onMouseLeave={() =>
                                    closePapersSoon(entry.raw)
                                  }
                                  onFocus={() => openPapers(entry.raw)}
                                  onBlur={() => closePapersSoon(entry.raw)}
                                  onClick={() => pinPapersOpen(entry.raw)}
                                >
                                  {`${entry.papers.length} papers`}
                                </button>
                              </Popover.Anchor>
                              <Popover.Portal>
                                <Popover.Content
                                  side="bottom"
                                  align="start"
                                  sideOffset={8}
                                  collisionPadding={{
                                    top: 72,
                                    right: 16,
                                    bottom: 96,
                                    left: 16,
                                  }}
                                  onMouseEnter={() => openPapers(entry.raw)}
                                  onMouseLeave={() =>
                                    closePapersSoon(entry.raw)
                                  }
                                  onOpenAutoFocus={(event) =>
                                    event.preventDefault()
                                  }
                                  onEscapeKeyDown={(event) => {
                                    event.stopPropagation();
                                    closePapers();
                                  }}
                                  className="z-50 flex max-h-[var(--radix-popper-available-height)] w-[min(390px,calc(100vw-2rem))] flex-col rounded-lg border border-border bg-white p-4 text-left shadow-md outline-none"
                                >
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mc-tint-blue-ink">
                                    Reported in {entry.papers.length} papers
                                  </p>
                                  <div
                                    className="mt-2 min-h-0 overflow-y-auto"
                                    data-testid="form-papers"
                                  >
                                    <ul className="space-y-1">
                                      {entry.papers.map((paper) => (
                                        <li
                                          className="text-xs text-foreground"
                                          data-paper-id={paper.paper_id}
                                          key={paper.paper_id}
                                        >
                                          {paper.display}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </Popover.Content>
                              </Popover.Portal>
                            </Popover.Root>
                          ) : (
                            <span
                              className={cn(
                                "shrink-0 truncate text-[11.5px] sm:ml-auto sm:max-w-[44%]",
                                entry.raw === form &&
                                  "text-mc-tint-blue-ink"
                              )}
                            >
                              {entry.papers[0]?.display}
                            </span>
                          )}
                        </div>
                        <button
                          aria-expanded={open}
                          aria-label={`${saved ? "Edit concern for" : "Flag concern about"} ${entry.raw}`}
                          className={cn(
                            "grid w-[38px] min-w-[38px] shrink-0 place-items-center self-stretch rounded-lg border bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            saved
                              ? "border-mc-line-accent bg-mc-fill-emphasis text-mc-ink-accent"
                              : "border-border text-muted-foreground hover:border-mc-blue-mid hover:text-mc-tint-blue-ink aria-expanded:border-mc-blue-mid aria-expanded:text-mc-tint-blue-ink"
                          )}
                          data-flag={entry.raw}
                          type="button"
                          onClick={() => openEditor(entry.raw)}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-[17px] w-[17px]"
                            style={{ fill: saved ? "currentColor" : "none" }}
                            stroke="currentColor"
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 21V4m0 1c2.5-2 4.5-2 7 0s4.5 2 7 0v11c-2.5 2-4.5 2-7 0s-4.5-2-7 0" />
                          </svg>
                        </button>
                      </div>
                      {open && (
                        <div className="mt-1.5 rounded-lg border border-border bg-white px-3 py-2">
                          <label
                            className="text-xs font-bold text-foreground"
                            htmlFor={editorId}
                          >
                            Concern about this standardized mapping
                          </label>
                          <textarea
                            className="mc-control mt-1.5 h-20 text-sm"
                            id={editorId}
                            placeholder="What should be checked?"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                          />
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            <Button
                              size="xs"
                              variant="primary"
                              type="button"
                              onClick={saveConcern}
                            >
                              Save concern
                            </Button>
                            <Button
                              size="xs"
                              variant="secondary"
                              type="button"
                              onClick={() => setOpenFlag(null)}
                            >
                              Cancel
                            </Button>
                            {saved && (
                              <Button
                                size="xs"
                                variant="secondary"
                                type="button"
                                onClick={removeConcern}
                              >
                                Remove flag
                              </Button>
                            )}
                          </div>
                          <p
                            className="mt-1.5 text-xs text-muted-foreground"
                            data-testid="concern-local-note"
                          >
                            Flags and concern notes stay in this browser and do
                            not change the schema or review state.
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {fieldStats && (
            <div
              className="max-w-[600px] rounded-[10px] border border-border bg-white px-5 py-[17px] shadow-sm"
              data-testid="schema-field-stats"
            >
              <p className="text-[11px] font-normal uppercase tracking-[0.06em] text-muted-foreground">
                {`Schema field · ${fieldStats.type}`}
              </p>
              <p className="mt-2 font-mono text-[15px] font-bold text-foreground [overflow-wrap:anywhere]">
                {fieldView ? spaceSchemaFieldName(fieldView.name) : null}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                {([
                  ["Fill rate", fieldStats.fillRate],
                  ["Papers populating", fieldStats.papersPopulating],
                  ["Distinct values", fieldStats.distinctValues],
                ] as const).map(([term, value]) => (
                  <div key={term}>
                    <dt className="text-xs font-bold uppercase text-muted-foreground">
                      {term}
                    </dt>
                    <dd className="text-foreground">{value}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs font-bold uppercase text-muted-foreground">
                    Top values
                  </dt>
                  <dd>
                    <ul className="mt-1 space-y-1">
                      {fieldStats.topValues.map(
                        (value) => (
                          <li
                            className="flex items-baseline justify-between gap-2 text-xs"
                            key={value.value}
                          >
                            <span className="truncate font-mono text-foreground" title={value.value}>
                              {value.value}
                            </span>
                            <span className="shrink-0 text-muted-foreground">
                              {value.formattedCount}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function drawDiagramLinks(
  diagram: HTMLDivElement | null,
  svg: SVGSVGElement | null
): void {
  if (!diagram || !svg) return;
  svg.replaceChildren();
  const box = diagram.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.setAttribute("width", String(box.width));
  svg.setAttribute("height", String(box.height));
  const groupButton = diagram.querySelector(
    'button[data-group][aria-pressed="true"]'
  );
  if (!groupButton) return;
  const visible = (selector: string) =>
    [...diagram.querySelectorAll<HTMLElement>(selector)].filter(
      (el) => el.offsetParent !== null
    );
  const paths: SVGPathElement[] = [];
  const link = (
    from: Element,
    to: { left: number; top: number; height: number },
    state: LinkState
  ) => paths.push(makePath(box, from.getBoundingClientRect(), to, state));

  const selectedNode = diagram.querySelector(
    'button[data-label][aria-pressed="true"], button[data-field][aria-pressed="true"]'
  );
  for (const node of visible("button[data-label], button[data-field]")) {
    link(
      groupButton,
      node.getBoundingClientRect(),
      linkState(node, selectedNode)
    );
  }
  const statsCard = diagram.querySelector("[data-testid=schema-field-stats]");
  if (selectedNode?.hasAttribute("data-label")) {
    const selectedForm = diagram.querySelector(
      'button[data-raw][aria-pressed="true"]'
    );
    for (const form of visible("button[data-raw]")) {
      link(
        selectedNode,
        form.getBoundingClientRect(),
        linkState(form, selectedForm)
      );
    }
  } else if (selectedNode && statsCard) {
    const card = statsCard.getBoundingClientRect();
    const title = statsCard.querySelector("p")?.getBoundingClientRect() ?? card;
    link(
      selectedNode,
      { left: card.left, top: title.top, height: title.height },
      "active"
    );
  }
  paths.sort(
    (a, b) =>
      Number(a.hasAttribute("data-active")) -
      Number(b.hasAttribute("data-active"))
  );
  svg.append(...paths);
}

type LinkState = "active" | "dimmed" | "idle";
const LINK_STROKE = {
  active: ["var(--mc-blue-bold)", 2],
  dimmed: ["var(--mc-blue-tint)", 1.2],
  idle: ["var(--mc-blue-mid)", 1.2],
} as const;
const linkState = (el: Element, selected: Element | null): LinkState =>
  el === selected ? "active" : selected ? "dimmed" : "idle";

function makePath(
  box: DOMRect,
  from: DOMRect,
  to: { left: number; top: number; height: number },
  state: LinkState
): SVGPathElement {
  const x1 = from.right - box.left;
  const y1 = from.top - box.top + from.height / 2;
  const x2 = to.left - box.left;
  const y2 = to.top - box.top + to.height / 2;
  const [stroke, width] = LINK_STROKE[state];
  const dx = Math.max(28, (x2 - x1) * 0.45);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  );
  path.style.stroke = stroke;
  path.setAttribute("stroke-width", String(width));
  path.setAttribute("fill", "none");
  if (state === "active") path.setAttribute("data-active", "true");
  return path;
}
