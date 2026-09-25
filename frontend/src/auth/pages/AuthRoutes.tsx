import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../index";
import { AuthPage, type AuthPath } from "./AuthPage";

export const authPaths = new Set(["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"]);

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function AuthRoutes({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);
  const { status, user } = useAuth();

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // If loading, show nothing (let AuthProvider load first)
  if (status === "loading") {
    return <div className="w-full h-screen bg-slate-950" />;
  }

  // If on auth path, show auth page
  if (authPaths.has(path)) {
    return <AuthPage path={path as AuthPath} />;
  }

  // If not authenticated and not on auth path, show login
  if (!user) {
    return <AuthPage path="/login" />;
  }

  // If authenticated and not on auth path, show main app
  return children;
}
