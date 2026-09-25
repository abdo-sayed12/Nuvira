import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { authService } from "../services/auth.service";
import type { AuthContextValue, AuthStatus } from "../types/auth.types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setStatus(nextSession ? "authenticated" : "unauthenticated");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setStatus(data.session ? "authenticated" : "unauthenticated");
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
