import { tokenStore } from "./tokenStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface ApiErrorBody {
  message?: string;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Single-flight refresh: if a refresh is already in progress, every
// caller awaits the SAME promise instead of firing their own request.
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the httpOnly refresh cookie
      });

      if (!res.ok) {
        tokenStore.set(null);
        return null;
      }

      const data = await res.json();
      tokenStore.set(data.accessToken);
      return data.accessToken as string;
    } catch {
      tokenStore.set(null);
      return null;
    } finally {
      refreshPromise = null; // clear so the NEXT 401 can trigger a fresh refresh
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean; // for request-code / verify-code — no access token to send yet
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const doFetch = () => {
    const token = tokenStore.get();
    return fetch(`${API_BASE}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    res = newToken ? await doFetch() : res; // retry once, or fall through to the error below
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}
