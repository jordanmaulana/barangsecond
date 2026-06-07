import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtom } from "jotai";

import { AppShell } from "@/components/layout/app-shell";
import { ApiError } from "@/lib/api";
import { me } from "@/features/auth/api";
import { tokenAtom, userAtom } from "@/features/auth/state";

const UNAUTH_ALLOWED = new Set(["/login"]);
const FULL_BLEED_PATHS = new Set(["/", "/login"]);

export function AuthGate() {
  const [token, setToken] = useAtom(tokenAtom);
  const [user, setUser] = useAtom(userAtom);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sessionExpiredFiredRef = useRef(false);

  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setToken(null);
          setUser(null);
          sessionExpiredFiredRef.current = true;
        } else {
          // Non-401 failure (5xx, network): don't hang on splash — fall back to login.
          setToken(null);
          setUser(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, user, setToken, setUser]);

  useEffect(() => {
    if (!token) {
      if (!UNAUTH_ALLOWED.has(pathname)) navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    if (FULL_BLEED_PATHS.has(pathname)) {
      navigate({ to: "/dashboard" });
    }
  }, [token, user, pathname, navigate]);

  if (!token || !user || FULL_BLEED_PATHS.has(pathname)) {
    return <Outlet />;
  }
  return <AppShell />;
}
