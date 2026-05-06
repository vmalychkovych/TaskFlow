"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getCurrentUser, login, logout } from "@/lib/api";
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from "@/lib/session-storage";
import type { AuthResponse, CurrentUser } from "@/lib/types";

type AuthStatus = "loading" | "ready";

type AuthContextValue = {
  session: AuthResponse | null;
  currentUser: CurrentUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const stored = getStoredAuth();

    if (!stored) {
      setStatus("ready");
      return;
    }

    setSession(stored);

    getCurrentUser(stored.accessToken)
      .then(setCurrentUser)
      .catch(() => {
        clearStoredAuth();
        setSession(null);
        setCurrentUser(null);
      })
      .finally(() => {
        setStatus("ready");
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      currentUser,
      status,
      async signIn(email: string, password: string) {
        const auth = await login({ email, password });
        setStoredAuth(auth);
        setSession(auth);
        const user = await getCurrentUser(auth.accessToken);
        setCurrentUser(user);
      },
      async signOut() {
        if (session?.accessToken) {
          try {
            await logout(session.accessToken);
          } catch {
            // Best-effort logout keeps the client flowing even if the API is down.
          }
        }

        clearStoredAuth();
        setSession(null);
        setCurrentUser(null);
      },
    }),
    [currentUser, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
