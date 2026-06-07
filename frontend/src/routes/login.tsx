import { createFileRoute } from "@tanstack/react-router";

import { EmailAuthCard } from "@/features/auth/components/email-auth-card";
import { GoogleSignInCard } from "@/features/auth/components/google-sign-in-card";

export const Route = createFileRoute("/login")({
  component: () => (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <EmailAuthCard />
        <div className="flex w-full items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleSignInCard />
      </div>
    </div>
  ),
});
