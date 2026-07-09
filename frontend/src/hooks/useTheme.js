import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const theme = "dark";
  const toggleTheme = useCallback(() => {}, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#0B0B0F");
  }, []);

  return { theme, toggleTheme };
}
