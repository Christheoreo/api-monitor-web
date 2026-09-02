import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

  // Monotonic generation counter — bumped every time the token changes,
  // regardless of whether the new value happens to match an old one.
  const generationRef = useRef(0);

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe((token) => {
      const generation = ++generationRef.current;

      if (!token) {
        setStatus("unauthenticated");
        setUser(null);
        return;
      }

      setStatus("loading");

      fetchCurrentUser()
        .then((me) => {
          // Ignore stale completions: a newer token event (logout, refresh,
          // or a subsequent login) may have superseded this one, even if
          // the token value itself is unchanged or coincidentally repeats.
          if (generationRef.current !== generation) return;
          setUser(me);
          setStatus("authenticated");
        })
        .catch(() => {
          if (generationRef.current !== generation) return;
          tokenStore.set(null);
        });
    });

    refreshAccessToken();

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, code: string) => {
    const { accessToken } = await verifyCodeApi(email, code);
    tokenStore.set(accessToken); // triggers the subscriber above, which hydrates `user`
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort: clear local state below regardless of network failure.
    } finally {
      tokenStore.set(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
