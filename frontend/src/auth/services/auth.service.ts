import type { AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthError } from "../types/auth.types";

const redirectUrl = (path: string) => `${window.location.origin}${path}`;

export function toAuthError(error: unknown): AuthError {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("invalid login credentials")) return new AuthError("invalid_credentials", "The email or password is incorrect.");
  if (message.includes("email not confirmed")) return new AuthError("email_not_confirmed", "Please verify your email before signing in.");
  if (message.includes("already registered") || message.includes("already been registered")) return new AuthError("already_registered", "This email cannot be registered. Try signing in or use password recovery.");
  if (message.includes("rate limit") || message.includes("too many")) return new AuthError("rate_limited", "Too many attempts. Please wait a moment and try again.");
  if (message.includes("expired") || message.includes("invalid token")) return new AuthError("expired_link", "This link has expired or is no longer valid.");
  if (message.includes("network") || message.includes("fetch")) return new AuthError("network", "We could not reach the authentication service. Check your connection and try again.");
  return new AuthError("unexpected", "Something went wrong. Please try again.");
}

async function unwrap(request: Promise<{ data?: unknown; error: SupabaseAuthError | null }>) {
  const { data, error } = await request;
  if (error) throw toAuthError(error);
  return data;
}

export const authService = {
  login(email: string, password: string) {
    return unwrap(supabase.auth.signInWithPassword({ email, password }));
  },
  signup(email: string, password: string) {
    return unwrap(supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl("/verify-email") } })) as Promise<{ session: object | null }>;
  },
  logout() {
    return unwrap(supabase.auth.signOut());
  },
  resetPassword(email: string) {
    return unwrap(supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl("/reset-password") }));
  },
  updatePassword(password: string) {
    return unwrap(supabase.auth.updateUser({ password }));
  },
  resendVerification(email: string) {
    return unwrap(supabase.auth.resend({ type: "signup", email }));
  },
};
