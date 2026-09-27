import { createContext, useContext, useEffect, useMemo, useState, useRef, type PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { authService } from "../services/auth.service";
import type { AuthContextValue, AuthStatus } from "../types/auth.types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const lastSyncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const syncSessionToBackend = async (currentSession: Session | null) => {
      try {
        if (currentSession && currentSession.access_token && currentSession.refresh_token) {
          if (lastSyncedTokenRef.current === currentSession.access_token) return;
          lastSyncedTokenRef.current = currentSession.access_token;

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
            }),
          });
        } else {
          if (lastSyncedTokenRef.current !== null) {
            lastSyncedTokenRef.current = null;
            await fetch("/api/auth/logout", {
              method: "POST",
            });
          }
        }
      } catch (error) {
        console.error("Failed to sync session to backend", error);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setStatus(nextSession ? "authenticated" : "unauthenticated");
        syncSessionToBackend(nextSession);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setStatus(data.session ? "authenticated" : "unauthenticated");
        // We do not strictly need to sync on every initial load if the cookie is already there,
        // but doing so ensures the backend cookies are in sync with the frontend's localStorage.
        syncSessionToBackend(data.session);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    status,
    isLoading: status === "loading",
    async login(email, password) { await authService.login(email, password); },
    async signup(email, password) {
      const result = await authService.signup(email, password);
      return { needsVerification: !result.session };
    },
    async logout() { await authService.logout(); },
    async resetPassword(email) { await authService.resetPassword(email); },
    async updatePassword(password) { await authService.updatePassword(password); },
    async resendVerification(email) { await authService.resendVerification(email); },
  }), [session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
