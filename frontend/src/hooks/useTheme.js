import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rmr_theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Respect OS preference on first visit, default to the brand's dark look.
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * Single source of truth for the dark/light theme. Writes the choice to
 * <html data-theme> so the CSS token overrides apply, and persists it.
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // Keep the mobile browser chrome in sync with the surface colour.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#fdf6ec" : "#100b00");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
}
