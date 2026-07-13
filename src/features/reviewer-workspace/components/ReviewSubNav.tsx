"use client";

import Link from "@/components/shared/Link";
import { cn } from "@/lib/utils";

type ReviewSubNavProps = {
  topicId: string;
};

  const pathname = usePathname();
  const base = `/topics/${topicId}/topic-review`;
  const links = [
  ];

    .filter(
    )

  return (
    <nav
      aria-label="Review sections"
    >

          return (
            <Link
              className={cn(
              )}
            >
              <span className="flex min-w-0 items-center justify-center gap-2 whitespace-nowrap">
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
