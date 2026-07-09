import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 */
  const [theme, setTheme] = useState<Theme>(() => {
    if (defaultTheme) return defaultTheme;
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

  return [theme, toggle];
}
