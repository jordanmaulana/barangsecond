import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { useGoogleSignIn } from "@/features/auth/hooks";
import { useTheme } from "@/lib/theme";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function GoogleSignInCard() {
  const ref = useRef<HTMLDivElement>(null);
  const signIn = useGoogleSignIn();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) =>
        signIn.mutate(credential, {
          onSuccess: () => navigate({ to: "/dashboard" }),
          onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal masuk"),
        }),
    });
    ref.current.innerHTML = "";
    window.google.accounts.id.renderButton(ref.current, {
      type: "standard",
      theme: theme === "dark" ? "filled_black" : "outline",
      size: "large",
      width: 320,
    });
  }, [clientId, signIn, navigate, theme]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={ref} className="flex min-h-[40px] justify-center" />
      {!clientId && (
        <p className="text-xs text-negative">VITE_GOOGLE_CLIENT_ID not set.</p>
      )}
    </div>
  );
}
