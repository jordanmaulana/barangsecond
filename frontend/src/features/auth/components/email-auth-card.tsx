import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { useEmailLogin, useEmailRegister } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api";

type Mode = "login" | "register";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const data = err.data;
    if (data && typeof data === "object") {
      for (const value of Object.values(data as Record<string, unknown>)) {
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      }
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

const tabClass = (active: boolean) =>
  `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

const labelClass = "text-sm font-medium text-slate-700";

export function EmailAuthCard() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const login = useEmailLogin();
  const register = useEmailRegister();
  const mutation = mode === "login" ? login : register;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      { email, password },
      {
        onSuccess: () => navigate({ to: "/dashboard" }),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex gap-1 rounded-lg bg-slate-50 p-1">
        <button type="button" className={tabClass(mode === "login")} onClick={() => setMode("login")}>
          Login
        </button>
        <button
          type="button"
          className={tabClass(mode === "register")}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {mode === "register" && (
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {mutation.isPending
            ? mode === "login"
              ? "Signing in…"
              : "Creating account…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}
