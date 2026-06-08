import { useEffect } from "react";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";

export type Theme = "light" | "dark";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Persisted theme; seeded from localStorage or the OS preference. */
export const themeAtom = atomWithStorage<Theme>("bs-theme", systemTheme());

/** Reflects the current theme onto <html class="dark"> — mount once near the root. */
export function useApplyTheme() {
  const [theme] = useAtom(themeAtom);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);
  return theme;
}

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  return {
    theme,
    setTheme,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
