import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Light/dark theme for a design direction, held in memory only: the app
 * writes no storage key. With no `defaultTheme`, it starts from the OS
 * preference.
 */
export function useTheme(defaultTheme?: Theme): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (defaultTheme) return defaultTheme;
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    // Keep native form controls / scrollbars in sync with the visible theme.
    document.documentElement.style.colorScheme = theme;
    return () => {
      document.documentElement.style.colorScheme = "";
    };
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  return [theme, toggle];
}
