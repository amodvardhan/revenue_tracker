import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { setUnauthorizedHandler } from "./apiUnauthorized";
import { clearSession, loadSession, type AppSession, saveSession } from "./session";
import { logout as apiLogout } from "../features/app/services/appApi";

interface SessionContextValue {
  session: AppSession | null;
  login: (session: AppSession) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [session, setSession] = useState<AppSession | null>(() => loadSession());
  const navigate = useNavigate();

  const login = useCallback((next: AppSession) => {
    saveSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    const token = session?.token;
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // still clear local session
      }
    }
    clearSession();
    setSession(null);
    navigate("/login", { replace: true });
  }, [navigate, session?.token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setSession(null);
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const value = useMemo(
    () => ({
      session,
      login,
      logout
    }),
    [session, login, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
