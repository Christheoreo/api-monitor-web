import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { tokenStore } from "../../lib/api/tokenStore";
import { refreshAccessToken } from "../../lib/api/client";
import {
  verifyCode as verifyCodeApi,
  logout as logoutApi,
  fetchCurrentUser,
  type User,
} from "../../lib/api/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe((token) => {
      if (!token) {
        setStatus("unauthenticated");
        setUser(null);
        return;
      }

      // Token just became available (mount-restore OR reactive refresh
      // after a 401) — hydrate the user before flipping to authenticated,
      // so consumers never see status:"authenticated" with user:null.
      fetchCurrentUser()
        .then((me) => {
          setUser(me);
          setStatus("authenticated");
        })
        .catch(() => {
          tokenStore.set(null); // token was bad/stale — bounce to unauthenticated
        });
    });

    refreshAccessToken(); // attempts session restore via the httpOnly cookie

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, code: string) => {
    const { accessToken } = await verifyCodeApi(email, code);
    tokenStore.set(accessToken); // triggers the subscriber above, which hydrates `user`
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      tokenStore.set(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
