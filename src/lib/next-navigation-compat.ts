// Compatibility shim that re-implements the subset of `next/navigation` the UI
// uses on top of TanStack Router. Files that imported from "@/lib/next-navigation-compat"
// now import from "@/lib/next-navigation-compat" with no other changes.

import {
  redirect as tanstackRedirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useMemo } from "react";

/**
 * Mirrors the App Router `useRouter()` shape for the methods the UI uses.
 */
export function useRouter() {
  const navigate = useNavigate();

  // Memoized because `next/navigation`'s router is identity-stable and callers
  // put it in effect dependency arrays. Returning a fresh object each render
  // made any such effect run on every render: with the API unreachable, the
  // token-clearing effect in Navbar re-fired until React threw "Maximum update
  // depth exceeded", which tore down the tree before any page could show its
  // own error state.
  return useMemo(
    () => ({
      push: (href: string) => {
        navigate({ to: href });
      },
      replace: (href: string) => {
        navigate({ to: href, replace: true });
      },
      back: () => {
        window.history.back();
      },
      forward: () => {
        window.history.forward();
      },
      // No-op in an SPA: data is already client-fetched via react-query.
      refresh: () => {},
      prefetch: () => {},
    }),
    [navigate]
  );
}

/** Mirrors `usePathname()`. Decoded: route params (topic ids contain a colon) arrive encoded. */
export function usePathname(): string {
  return decodeURIComponent(useLocation().pathname);
}

/**
 * Mirrors `useSearchParams()` — returns a `URLSearchParams` built from the
 * current location's search string.
 */
export function useSearchParams(): URLSearchParams {
  const search = useLocation().searchStr;
  return new URLSearchParams(search ?? "");
}

/** Mirrors `redirect()` (throws to abort the current render). */
export function redirect(href: string): never {
  throw tanstackRedirect({ to: href });
}
