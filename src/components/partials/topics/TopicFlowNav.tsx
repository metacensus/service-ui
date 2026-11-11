"use client";

import Link from "@/components/shared/Link";
import { usePathname } from "@/lib/next-navigation-compat";
import { cn } from "@/lib/utils";
import {
  activeStageIndex,
  stageState,
  topicFlowStages,
  type TopicFlowState,
} from "./topicFlow";

// each segment points right and is notched on the left so the next one nests.
export const CHEVRON = "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)";
export const CHEVRON_FIRST = "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)";

export const STATE_CLASSES: Record<TopicFlowState, string> = {
  past: "bg-mc-tint-purple-fill text-mc-tint-purple-ink",
  future: "bg-secondary text-muted-foreground hover:text-foreground",
};

type TopicFlowNavViewProps = {
  topicId: string;
  pathname: string;
};

/** Pure view, so it renders in tests without a router. */
export const TopicFlowNavView = ({ topicId, pathname }: TopicFlowNavViewProps) => {
  const stages = topicFlowStages(topicId);
  const active = activeStageIndex(stages, pathname);
  const dashboardHref = `/topics/${topicId}/topic-dashboard`;
  const onDashboard = pathname === dashboardHref;

  return (
    <nav
      aria-label="Topic stages"
      className="mt-6 flex flex-wrap items-center gap-3"
    >
      <Link
        href={dashboardHref}
        aria-current={onDashboard ? "page" : undefined}
        className={cn(
          "rounded-md px-4 py-2 text-xs font-bold transition-colors",
          STATE_CLASSES[onDashboard ? "current" : "future"]
        )}
      >
        Dashboard
      </Link>
      <ol className="flex min-w-[320px] flex-1 items-stretch gap-px">
        {stages.map((stage, index) => {
          const state = stageState(index, active);
          return (
            <li key={stage.href} className="flex flex-1">
              <Link
                href={stage.href}
                aria-current={state === "current" ? "page" : undefined}
                data-state={state}
                className={cn(
                  "flex w-full items-center justify-center py-2 pl-4 pr-3 sm:px-6 text-center text-xs font-bold transition-colors hover:brightness-95",
                  STATE_CLASSES[state]
                )}
                style={{ clipPath: index === 0 ? CHEVRON_FIRST : CHEVRON }}
              >
                {stage.name}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const TopicFlowNav = ({ topicId }: { topicId: string }) => {
  const pathname = usePathname();
  return <TopicFlowNavView topicId={topicId} pathname={pathname} />;
};

export default TopicFlowNav;
