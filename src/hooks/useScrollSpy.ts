import { useEffect, useState } from "react";

/**
 * Tracks which page section is currently in view.
 *
 * `ids` are element ids (in document order). The active section is the last
 * one whose top has crossed 35% of the viewport height — i.e. the section
 * the reader is actually looking at, not merely the next one peeking in.
 * Returns null when the reader is above the first section (the hero).
 */
export function useScrollSpy(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Cheap enough (a handful of rect reads) to run un-throttled; rAF-based
    // throttling stalls in occluded tabs.
    const measure = () => {
      const threshold = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) current = id;
      }
      setActive(current);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}
