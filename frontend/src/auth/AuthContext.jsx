import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const hash = window.location.hash || "";
      if (hash.includes("session_id=")) {
        const sid = new URLSearchParams(hash.replace(/^#/, "")).get("session_id");
        if (sid) {
          try {
            await authApi.google(sid);
          } catch { /* invalid session */ }
        }
        // pulisci il fragment
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const logout = async () => {
    try { await authApi.logout(); } catch { /* */ }
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, loading, refresh, logout, authOpen, setAuthOpen }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve essere usato dentro AuthProvider");
  return ctx;
}
