import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { loginApi, getMe, logoutApi, refreshApi } from "../services/authService";
import type { AuthUser } from "../services/authService";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session (VERY IMPORTANT) ─────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const me = await getMe(); // backend reads cookie
        setUser(me);
      } catch {
        try {
          await refreshApi();
          const me = await getMe();
          setUser(me);
        } catch {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ── Login ───────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    await loginApi({ email, password }); // sets cookies

    const me = await getMe(); // fetch user after login
    return me;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await logoutApi(); // clears cookie on backend
    } catch {
      // optional: ignore error
    }

    setUser(null); // ✅ this updates UI immediately
  }, []);

  const refresh = useCallback(async () => {
    try {
      await refreshApi(); // refresh cookies
      const me = await getMe(); // re-fetch user
      setUser(me);
    } catch {
      setUser(null); // session invalid → logout
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        setUser,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
