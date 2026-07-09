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

export function useReducedMotion(): boolean {

  useEffect(() => {
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
