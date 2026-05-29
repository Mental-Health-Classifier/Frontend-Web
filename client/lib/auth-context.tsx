/**
 * Global authentication context.
 *
 * Wraps the entire app so every component can access the current user
 * and auth helpers (login / logout) without prop-drilling.
 *
 * The user object is loaded once on mount from GET /auth/me when a
 * token exists in localStorage.  Login stores the token and fetches
 * the user.  Logout clears both.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: (silent?: boolean) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  /* Fetch user profile from backend.
   * silent=true: swallow errors without logging the user out — use after
   * profile updates where a getMe failure is not an auth failure. */
  const refreshUser = useCallback(async (silent = false) => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
    } catch {
      if (!silent) {
        // Hard auth failure (page load / token expired) → clear session
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
      // silent=true → stay logged in, displayed data may be stale until next refresh
    }
  }, []);

  /* On mount — if a token exists, try to hydrate user */
  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Login: obtain token → store → fetch user */
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const accessToken: string = res.data.access_token;
    localStorage.setItem("token", accessToken);
    setToken(accessToken);

    // Fetch user profile with the new token
    const meRes = await authApi.getMe();
    setUser(meRes.data);
  }, []);

  /* Logout: clear token + any legacy session keys */
  const logout = useCallback(() => {
    // Purge any legacy localStorage session keys from older builds
    Object.keys(localStorage)
      .filter(k => k.startsWith("mindcare_sessions"))
      .forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
