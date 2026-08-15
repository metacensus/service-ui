import {
  CSSProperties,
  ElementType,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * True when the user has requested reduced motion.
 *
 * Read synchronously for the first render. Starting at `false` and correcting in
 * an effect would give exactly the people who asked for less motion a frame of
 * the thing they opted out of — and in the hero's case a frame of locked scroll.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Observe an element entering the viewport. Fires once by default so
 * scroll-triggered animations don't replay.
 */
export function useInView<T extends Element>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.2, rootMargin = "0px 0px -10% 0px", once = true } =
    options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

export type Clock = {
  play: () => void;
  pause: () => void;
  /** Jump to a point on the timeline. Clamped, and ticks immediately. */
  seek: (ms: number) => void;
  /** The current position, for callers that need it outside a tick. */
  elapsed: () => number;
};

/**
 * A timeline's clock, and nothing else.
 *
 * It knows no DOM: what starts it, what stops it, and what it drives are all the
 * caller's business. That separation is deliberate — "play when visible" fuses a
 * clock with an IntersectionObserver, and the two have no reason to know about
 * each other. Compose them at the call site instead, in a line.
 *
 * `onTick` is called per frame rather than the elapsed value being returned as
 * state: the hero writes CSS custom properties straight to the DOM and must not
 * re-render sixty times a second. A caller that *wants* a render can call
 * `setState` from the tick.
 *
 * ## Elapsed is accumulated, not subtracted
 *
 * `elapsed += now - last`, never `now - start`. A backgrounded tab stops issuing
 * frames, so with a start timestamp the first frame back would jump the whole
 * time the tab was away. Accumulating deltas means an unfocused tab simply does
 * not advance — pause comes for free, and `seek` is a plain assignment.
 */
export function useClock(
  durationMs: number,
  onTick: (elapsed: number) => void
): Clock {
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const frameRef = useRef(0);

  // Held in a ref so a caller may pass an inline closure without restarting
  // the clock on every render.
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;

  const clock = useRef<Clock>();
  if (!clock.current) {
    const emit = () => tickRef.current(elapsedRef.current);

    const step = (now: number) => {
      const last = lastRef.current || now;
      lastRef.current = now;
      elapsedRef.current = Math.min(
        durationRef.current,
        elapsedRef.current + (now - last)
      );
      emit();
      // Stop at the end rather than burning frames on a settled timeline; a
      // later `seek` restarts it.
      if (elapsedRef.current < durationRef.current) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = 0;
      }
    };

    const play = () => {
      if (frameRef.current || elapsedRef.current >= durationRef.current) return;
      lastRef.current = 0;
      frameRef.current = requestAnimationFrame(step);
    };

    const pause = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      lastRef.current = 0;
    };

    clock.current = {
      play,
      pause,
      elapsed: () => elapsedRef.current,
      seek: (ms: number) => {
        elapsedRef.current = Math.min(durationRef.current, Math.max(0, ms));
        emit();
      },
    };
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return clock.current;
}

type RevealProps = {
  children?: ReactNode;
  className?: string;
  /** Transition delay in ms (for stagger). */
  delay?: number;
  as?: ElementType;
  style?: CSSProperties;
};

/**
 * Scroll-triggered reveal. Base styles live in globals.css (`.reveal`);
 * feature surfaces can restyle the transition through scoped CSS. Reduced
 * motion is handled in CSS, so content is always visible without JS.
 */
export function Reveal({
  children,
  className,
  delay,
  as: Tag = "div",
  style,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <Tag
      ref={ref}
      className={cn("reveal", inView && "in", className)}
      style={{
        ...style,
        transitionDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
