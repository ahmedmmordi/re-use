import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { loginApi, getMe} from '../services/authService';
import type {AuthUser, UserRole} from '../services/authService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
        setUser(null);
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
    setUser(me);
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────

  // const logout = useCallback(async () => {
  //   try {
  //     await logoutApi(); // clears cookies server-side
  //   } catch {
  //     // ignore
  //   }
  //
  //   setUser(null);
  // }, []);

  return (
      <AuthContext.Provider
          value={{
            isAuthenticated: !!user,
            isLoading,
            user,
            login,
            //logout,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
