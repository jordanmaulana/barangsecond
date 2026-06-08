import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";

import { themeAtom } from "@/lib/theme";

const VARS = [
  "accent",
  "positive",
  "warning",
  "negative",
  "info",
  "border",
  "muted-foreground",
  "surface",
] as const;

type ChartColors = Record<(typeof VARS)[number], string>;

function read(): ChartColors {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    VARS.map((v) => [v, cs.getPropertyValue(`--${v}`).trim()]),
  ) as ChartColors;
}

/** Resolve theme CSS variables to concrete colors for Recharts; updates on theme switch. */
export function useChartColors(): ChartColors {
  const theme = useAtomValue(themeAtom);
  const [colors, setColors] = useState<ChartColors>(read);
  useEffect(() => {
    // Wait a frame so the .dark class is applied before reading computed styles.
    const id = requestAnimationFrame(() => setColors(read()));
    return () => cancelAnimationFrame(id);
  }, [theme]);
  return colors;
}
