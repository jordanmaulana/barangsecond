import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-sm)] bg-surface-muted", className)}
      {...props}
    />
  );
}

/** Placeholder rows for a table body while data loads. */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-border">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className={cn("h-4", c === 0 ? "w-32" : "w-16", c > 0 && "ml-auto")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
