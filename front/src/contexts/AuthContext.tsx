import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "lider";
}

export interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_KEY = "auth_token";
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY));

  // Persist token to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // On mount, if we have a stored token, fetch the current user
  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json() as Promise<AuthUser>;
      })
      .then((userData) => setUser(userData))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Listen for auth:expired events dispatched by the ApiClient on HTTP 401
  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
      navigate("/login");
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? "Credenciais inválidas.");
    }

    const data = await res.json() as { token: string; user: AuthUser };
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }).catch(() => {
        // ignore network errors on logout
      });
    }

    setToken(null);
    setUser(null);
    navigate("/login");
  }, [token, navigate]);

  const updateUser = useCallback((user: AuthUser) => {
    setUser(user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [token, user, isLoading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
