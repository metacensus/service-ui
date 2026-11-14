"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

type AsyncSectionProps<T> = {
  /** The query this section renders. Its state, not the data's shape, decides
   *  what is shown. */
  query: UseQueryResult<T, Error>;
  /** What "nothing here" looks like for this data. Required: a section that
   *  cannot say it is empty renders a blank region instead, which reads as a
   *  failure to a user and as success to a developer. */
  isEmpty: (data: T) => boolean;
  empty: ReactNode;
  /** Rendered only once the data has arrived, which is why this is a function
   *  and not a node: there is no way to draw the body over a pending or failed
   *  request. */
  children: (data: T) => ReactNode;
  loading?: ReactNode;
  /** Shown when the request failed. Defaults to a neutral message; a caller
   *  with something more useful to say passes it. */
  error?: ReactNode;
  className?: string;
};

/**
 * Renders one region from a query's state machine: loading, error, empty, or
 * data.
 *
 * React Query already knows which of the four a request is in. Deriving that
 * from the value instead loses it — `undefined` collapses loading, failure and
 * absence into one, and `[]` is truthy, so an empty list reads as a full one.
 * Both mistakes shipped before this existed.
 */
const AsyncSection = <T,>({
  query,
  isEmpty,
  empty,
  children,
  loading,
  error,
  className,
}: AsyncSectionProps<T>) => {
  const content = () => {
    if (query.isPending) {
      if (query.failureCount > 0) {
        return <p className="text-xs text-muted-foreground">Still trying to load this…</p>;
      }
      return loading ?? <Skeleton className="h-20 rounded-xl" />;
    }

    if (query.isError) {
      return (
        error ?? (
          <p className="text-xs text-mc-alert-ink">
            Could not load this section. Please try again later.
          </p>
        )
      );
    }

    return isEmpty(query.data) ? empty : children(query.data);
  };

  return <div className={cn(className)}>{content()}</div>;
};

export default AsyncSection;
