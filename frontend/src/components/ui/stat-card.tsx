import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { InfoHint } from "@/components/ui/info-hint";

type Tone = "default" | "positive" | "warning" | "negative" | "accent";

const ICON_TONE: Record<Tone, string> = {
  default: "bg-surface-muted text-muted-foreground",
  positive: "bg-positive/12 text-positive",
  warning: "bg-warning/12 text-warning",
  negative: "bg-negative/12 text-negative",
  accent: "bg-accent-soft text-accent",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  trend,
  hint,
  info,
  className,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: Tone;
  trend?: { value: string; up: boolean };
  hint?: string;
  info?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-pop",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
          {info && <InfoHint text={info} />}
        </span>
        {Icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]", ICON_TONE[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="tabular text-2xl font-semibold leading-none text-foreground">{value}</div>
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.up ? "text-positive" : "text-negative",
              )}
            >
              {trend.up ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </div>
    </div>
  );
}
