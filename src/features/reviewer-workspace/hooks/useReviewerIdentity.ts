"use client";

import { useSelf } from "@/hooks/useGetUserId";

// Best-effort display-name suggestion from the logged-in user.
// The persisted reviewer name (useReviewState) always wins; this only
// prefills the "Reviewing as" control the first time.
export function useSessionNameSuggestion(): string | null {
  const self = useSelf().data;
  return self?.name || self?.email || null;
}
