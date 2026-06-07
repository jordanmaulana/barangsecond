import { cn } from "@/lib/utils";

const VARIANTS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-amber-100 text-amber-700",
  sold: "bg-slate-200 text-slate-600",
  due: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-rose-100 text-rose-700",
  default: "bg-slate-100 text-slate-600",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        VARIANTS[value] ?? VARIANTS.default,
      )}
    >
      {label ?? value}
    </span>
  );
}
