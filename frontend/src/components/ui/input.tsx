import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const base =
  "h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground shadow-card transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-negative aria-[invalid=true]:ring-negative/30";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, className)} {...props} />
  ),
);
Input.displayName = "Input";
