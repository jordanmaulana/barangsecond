import { cn } from "@/lib/utils";

type Tone = { cls: string; dot: string };

const TONES: Record<string, Tone> = {
  positive: { cls: "bg-positive/12 text-positive border-positive/25", dot: "bg-positive" },
  warning: { cls: "bg-warning/12 text-warning border-warning/25", dot: "bg-warning" },
  negative: { cls: "bg-negative/12 text-negative border-negative/25", dot: "bg-negative" },
  info: { cls: "bg-info/12 text-info border-info/25", dot: "bg-info" },
  accent: { cls: "bg-accent-soft text-accent border-accent/25", dot: "bg-accent" },
  neutral: {
    cls: "bg-surface-muted text-muted-foreground border-border-strong/60",
    dot: "bg-muted-foreground",
  },
};

// Map a domain status string → semantic tone.
const VARIANT_TONE: Record<string, keyof typeof TONES> = {
  available: "positive",
  paid: "positive",
  settled: "positive",
  reserved: "warning",
  due: "info",
  active: "info",
  credit: "accent",
  cash: "neutral",
  sold: "neutral",
  overdue: "negative",
  default: "neutral",
};

export function Badge({
  value,
  label,
  dot = true,
}: {
  value: string;
  label?: string;
  dot?: boolean;
}) {
  const tone = TONES[VARIANT_TONE[value] ?? "neutral"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tone.cls,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />}
      {label ?? value}
    </span>
  );
}
