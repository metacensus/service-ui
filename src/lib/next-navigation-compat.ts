// Compatibility shim that re-implements the subset of `next/navigation` the UI
// uses on top of TanStack Router. Files that imported from "@/lib/next-navigation-compat"
// now import from "@/lib/next-navigation-compat" with no other changes.

import {
  redirect as tanstackRedirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";

/**
 * Mirrors the App Router `useRouter()` shape for the methods the UI uses.
 */
export function useRouter() {
  const navigate = useNavigate();

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
}

export function usePathname(): string {
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
