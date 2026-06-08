import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent font-display text-2xl font-bold text-accent-foreground">
        b
      </span>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading barangsecond…
      </div>
    </div>
  ),
});
