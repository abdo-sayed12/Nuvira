import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading...</div>;
  if (status === "unauthenticated") {
    const target = `${window.location.pathname}${window.location.search}`;
    const safeTarget = target.startsWith("/") && !target.startsWith("//") ? target : "/";
    window.location.replace(`/login?next=${encodeURIComponent(safeTarget)}`);
    return fallback ?? null;
  }
  return children;
}
