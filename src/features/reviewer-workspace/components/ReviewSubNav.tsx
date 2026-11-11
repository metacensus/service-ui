"use client";

import Link from "@/components/shared/Link";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "@/lib/next-navigation-compat";
import type { DataMode } from "@/features/reviewer-workspace/model/dataMode";
import { reviewSearchFromData } from "@/features/reviewer-workspace/model/returnContext";

type ReviewSubNavProps = {
  topicId: string;
  dataMode?: DataMode | null;
};

const ReviewSubNav = ({ topicId, dataMode }: ReviewSubNavProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const base = `/topics/${topicId}/topic-review`;
  const reviewSearch = reviewSearchFromData(dataMode, searchParams);
  const links = [
    { label: "Schema", path: `${base}/schema` },
    { label: "Data", path: `${base}/data` },
    { label: "Review", path: base, search: reviewSearch },
  ];

  const activePath = links
    .filter(
      ({ path }) => pathname === path || pathname.startsWith(`${path}/`)
    )
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  return (
    <nav
      aria-label="Review sections"
      className="mt-6 w-full rounded-md bg-secondary p-1"
    >
      <div className="flex gap-1">
        {links.map((link, index) => {
          const isActive = activePath === link.path;

          return (
            <Link
              className={cn(
                "flex min-h-12 flex-1 items-center justify-center rounded-sm px-3 py-2 text-center text-xs font-bold text-muted-foreground transition-colors hover:text-mc-ink-accent",
                isActive && "bg-white text-foreground shadow-sm"
              )}
              href={link.path + (link.search ?? "")}
              key={link.path}
            >
              <span className="flex min-w-0 items-center justify-center gap-2 whitespace-nowrap">
                <span className="tabular-nums">{index + 1}</span>
                <span>{link.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default ReviewSubNav;
