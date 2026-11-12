"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useFetchData } from "@/hooks/useFetchData";
import { useGetUserId } from "@/hooks/useGetUserId";
import { useProps } from "@/hooks/useProps";
import { routes } from "@/lib/routes";
import Link from "@/components/shared/Link";
import { Prop_Type } from "@metacensus/api";
import { useMemo } from "react";
import { Paper } from "../../../../types/Paper";
import { ChevronRight, CircleCheck, Clipboard } from "lucide-react";

type TopicActionItemsProps = {
  topicId: string;
};

type ActionItem = {
  id: string;
  category: string;
  label: string;
  href: string;
};

// Categories are listed in the order they appear in the popover.
const CATEGORY_ORDER = [
  "Vote on consensus statements",
  "Vote on paper inclusions",
  "Review data extractions",
];

const TopicActionItems = ({ topicId }: TopicActionItemsProps) => {
  const { userId } = useGetUserId();

  const { data: props } = useProps(topicId);

  // The dashboard's key, so this hits React Query's cache instead of re-fetching.
  const papersBody = { topicId, page: 1, limit: 30 };
  const { data: papers } = useFetchData<typeof papersBody, Paper[]>(
    routes.api.paper,
    [`topics-papers-status-${topicId}`],
    "POST",
    papersBody
  );

  // Open consensus statements are the votable props.
  const votableProps = useMemo(
    () =>
      (props ?? []).filter(
        // The scientific question is locked on the dashboard, so it
        // is never an open action; only statements are voted on here.
        (p) => p.type === Prop_Type.Statement && (!p.conclusion || p.conclusion === "open")
      ),
    [props]
  );

  // One batched query for the prop ids the current user has already voted on,
  // instead of fanning out a request per votable prop.
  const { data: votedPropIds } = useFetchData<undefined, string[]>(
    routes.api.topicMyVotes(topicId),
    [`action-items-my-votes-${topicId}`],
    "GET"
  );

  const votedPropIdSet = useMemo(
    () => new Set((votedPropIds ?? []).map(String)),
    [votedPropIds]
  );

  const items = useMemo<ActionItem[]>(() => {
    if (!userId) return [];
    const result: ActionItem[] = [];

    // (1) — vote-based: surface statements the user hasn't voted on yet.
    // Wait for the votes query before guessing, so we don't flash items the
    // user has already handled.
    if (votedPropIds !== undefined) {
      votableProps.forEach((p) => {
        if (votedPropIdSet.has(String(p.id))) return;

        result.push({
          id: `statement-${p.id}`,
          category: "Vote on consensus statements",
          label: p.description,
          href: `/topics/${topicId}/topic-consensus-statements`,
        });
      });
    }

    // (2) & (3) — paper-based: derived from paper status + the user's votes.
    const numericUserId = Number(userId);
    (papers ?? []).forEach((paper) => {
      if (paper.status === "Pending Approval") {
        const alreadyVoted = paper.paperApprovalsRejections?.some(
          (r) => r.user?.id === numericUserId
        );
        if (!alreadyVoted) {
          result.push({
            id: `inclusion-${paper.id}`,
            category: "Vote on paper inclusions",
            label: paper.title,
            href: `/topics/${topicId}/topic-papers/${paper.id}`,
          });
        }
      } else if (
        paper.status === "Pending Review" ||
        paper.status === "Being Reviewed"
      ) {
        result.push({
          id: `extraction-${paper.id}`,
          category: "Review data extractions",
          label: paper.title,
          href: `/topics/${topicId}/topic-papers/${paper.id}`,
        });
      }
    });

    return result;
  }, [userId, votableProps, votedPropIds, votedPropIdSet, papers, topicId]);

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [items]);

  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="gap-2 px-2 py-1 relative"
        >
          <Clipboard className="size-[1em] text-base" />
          <span className="text-xs">Action Items</span>
          {count > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-mc-fill-solid text-mc-ink-on-fill text-[10px] font-semibold h-4 min-w-4 px-1">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 max-h-[28rem] overflow-auto">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-bold">Action Items</p>
          <p className="text-xs text-muted-foreground">
            Things you can act on in this topic
          </p>
        </div>

        {count === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <CircleCheck className="size-[1em] text-2xl text-emerald-500" />
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">
              No actions need your attention right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {groups.map((group) => (
              <div key={group.category} className="py-2">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.category} ({group.items.length})
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-secondary"
                  >
                    <span className="text-xs line-clamp-2 flex-1">
                      {item.label}
                    </span>
                    <ChevronRight className="size-[1em] text-mc-ink-secondary shrink-0" />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TopicActionItems;
