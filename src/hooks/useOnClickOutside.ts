import { RefObject, useCallback, useRef } from "react";
import useEventListener from "./useEventListener";

type Handler = (event: MouseEvent) => void;

function useDebounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, wait);
    },
    [func, wait]
  );

  return debouncedFunction as T;
}

function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: Handler,
  mouseEvent: "mousedown" | "mouseup" = "mousedown",
  delay = 150
): void {
  const debouncedHandler = useDebounce(handler, delay);

  useEventListener(mouseEvent, (event: MouseEvent) => {
    const el = ref?.current;

    // Do nothing if clicking ref's element or descendent elements
    if (!el || el.contains(event.target as Node)) {
      return;
    }

    debouncedHandler(event);
  });
}

export default useOnClickOutside;
