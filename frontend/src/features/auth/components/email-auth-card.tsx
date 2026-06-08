import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { useEmailLogin, useEmailRegister } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

type Mode = "login" | "register";

type FieldErrors = { email?: string; password?: string };

/** Split a DRF error into per-field messages + a fallback toast message. */
function parseError(err: unknown): { fields: FieldErrors; message: string } {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const data = err.data as Record<string, unknown>;
    const pick = (k: string) => {
      const v = data[k];
      if (typeof v === "string") return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
      return undefined;
    };
    const fields: FieldErrors = { email: pick("email"), password: pick("password") };
    const general =
      pick("non_field_errors") ?? pick("detail") ?? fields.email ?? fields.password ?? err.message;
    return { fields, message: general };
  }
  return { fields: {}, message: err instanceof Error ? err.message : "Something went wrong" };
}

export function EmailAuthCard() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();
  const login = useEmailLogin();
  const register = useEmailRegister();
  const mutation = mode === "login" ? login : register;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    mutation.mutate(
      { email, password },
      {
        onSuccess: () => navigate({ to: "/dashboard" }),
        onError: (err) => {
          const { fields, message } = parseError(err);
          setErrors(fields);
          toast.error(message);
        },
      },
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <Segmented
          className="w-full"
          options={[
            { value: "login", label: "Sign in" },
            { value: "register", label: "Register" },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setErrors({});
          }}
        />
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={!!errors.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field
            label="Password"
            htmlFor="password"
            error={errors.password}
            hint={mode === "register" ? "At least 8 characters." : undefined}
          >
            <Input
              id="password"
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              aria-invalid={!!errors.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" className="w-full" loading={mutation.isPending}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
