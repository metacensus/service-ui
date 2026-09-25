export type TopicFlowStage = {
  name: string;
  href: string;
  /** Path prefix that marks this stage active; defaults to `href`. */
  activePrefix?: string;
};

export type TopicFlowState = "past" | "current" | "future";

/** The topic's stages in the order work moves through them. The dashboard is
 *  the overview of all of them, so it sits outside the flow. */
export function topicFlowStages(topicId: string): TopicFlowStage[] {
  const base = `/topics/${topicId}`;
  return [
    { name: "Papers", href: `${base}/topic-papers` },
    {
      name: "Extraction",
      href: `${base}/topic-review/schema`,
      activePrefix: `${base}/topic-review`,
    },
    { name: "Analysis", href: `${base}/topic-analysis` },
    { name: "Statements", href: `${base}/topic-consensus-statements` },
  ];
}

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Index of the stage the pathname is in, or -1 (e.g. on the dashboard). */
export function activeStageIndex(
  stages: readonly TopicFlowStage[],
  pathname: string
): number {
  return stages.findIndex((stage) =>
    matches(pathname, stage.activePrefix ?? stage.href)
  );
}

/** Stages before the current one read as passed, after it as ahead. With no
 *  current stage every stage is ahead. */
export function stageState(index: number, activeIndex: number): TopicFlowState {
  if (activeIndex < 0 || index > activeIndex) return "future";
  return index < activeIndex ? "past" : "current";
}
