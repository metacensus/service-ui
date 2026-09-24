import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/lib/head";

/**
 * Applies the deepest matched route's `head` title and description to the document.
 *
 * TanStack's `<HeadContent />` renders `<title>` and `<meta>` in place and leaves hoisting them into `<head>` to React 19. On React 18 they would land in the body, so this writes the two tags `index.html` already declares instead.
 */
export function DocumentHead() {
  const title = useRouterState({
    select: (state) => {
      const metas = state.matches.flatMap((match) => match.meta ?? []);
      return [...metas].reverse().find((m) => m?.title)?.title;
    },
  }) ?? DEFAULT_TITLE;

  const description = useRouterState({
    select: (state) => {
      const metas = state.matches.flatMap((match) => match.meta ?? []);
      return [...metas].reverse().find((m) => m?.name === "description")?.content;
    },
  }) ?? DEFAULT_DESCRIPTION;

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [description]);

  return null;
}
