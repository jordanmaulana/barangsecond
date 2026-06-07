import { useMutation, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";

import { emailLogin, emailRegister, googleSignIn, logout, me } from "@/features/auth/api";
import { tokenAtom, userAtom } from "@/features/auth/state";

export function useMe() {
  const [token] = useAtom(tokenAtom);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    enabled: !!token,
  });
}

export function useGoogleSignIn() {
  const [, setToken] = useAtom(tokenAtom);
  const [, setUser] = useAtom(userAtom);
  return useMutation({
    mutationFn: googleSignIn,
    onSuccess: (res) => {
      setToken(res.token);
      setUser(res.user);
    },
  });
}

export function useEmailRegister() {
  const [, setToken] = useAtom(tokenAtom);
  const [, setUser] = useAtom(userAtom);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      emailRegister(email, password),
    onSuccess: (res) => {
      setToken(res.token);
      setUser(res.user);
    },
  });
}

export function useEmailLogin() {
  const [, setToken] = useAtom(tokenAtom);
  const [, setUser] = useAtom(userAtom);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      emailLogin(email, password),
    onSuccess: (res) => {
      setToken(res.token);
      setUser(res.user);
    },
  });
}

export function useLogout() {
  const [, setToken] = useAtom(tokenAtom);
  const [, setUser] = useAtom(userAtom);
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setToken(null);
      setUser(null);
    },
  });
}
