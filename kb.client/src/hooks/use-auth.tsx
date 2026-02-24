import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

interface User {
  userId: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

interface LoginResult {
  success: boolean;
  requiresMfa?: boolean;
  error?: string;
}

interface RegisterResult {
  success: boolean;
  error?: string;
}

const AUTH_STORAGE_KEY = "kb_auth_user";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  // On mount, restore user from localStorage.
  // The actual cookie validity is checked server-side on API calls.
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Global 401 interceptor — redirect to login when cookie expires
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        const url =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof Request
              ? args[0].url
              : "";
        // Don't intercept auth endpoints to avoid redirect loops
        if (!url.includes("/api/auth/")) {
          clearAuth();
          navigate("/login");
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [clearAuth, navigate]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, isMobileApp: false }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          body?.detail || body?.title || "Invalid email or password.";
        return { success: false, error: message };
      }

      const data = await response.json();

      if (data.requiresMfa) {
        return { success: false, requiresMfa: true };
      }

      const authUser: User = { userId: data.userId, email };
      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return { success: true };
    },
    []
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      confirmPassword: string
    ): Promise<RegisterResult> => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          body?.detail || body?.title || "Registration failed.";
        return { success: false, error: message };
      }

      return { success: true };
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearAuth();
    navigate("/login");
  }, [clearAuth, navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
