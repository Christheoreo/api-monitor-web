import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, refreshAccessToken } from "./client";
import { tokenStore } from "./tokenStore";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

beforeEach(() => {
  tokenStore.set(null);
  vi.restoreAllMocks();
});

describe("apiFetch — silent refresh on 401", () => {
  it("refreshes the access token once and retries the original request", async () => {
    tokenStore.set("stale-token");

    const fetchMock = vi
      .fn()
      // original request -> 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // refresh call -> new token
      .mockResolvedValueOnce(jsonResponse({ accessToken: "fresh-token" }))
      // retried original request -> success
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ ok: boolean }>("/widgets");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toEqual(
      expect.stringContaining("/auth/refresh"),
    );
    expect(tokenStore.get()).toBe("fresh-token");
  });

  it("shares a single in-flight refresh across concurrent 401s", async () => {
    tokenStore.set("stale-token");

    let refreshCalls = 0;
    const fetchMock = vi.fn((url: string) => {
      const path = url.toString();
      if (path.includes("/auth/refresh")) {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse({ accessToken: "fresh-token" }));
      }
      // Every non-refresh call 401s until the token has been refreshed,
      // then succeeds on retry.
      if (tokenStore.get() === "fresh-token") {
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      return Promise.resolve(new Response(null, { status: 401 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await Promise.all([
      apiFetch("/a"),
      apiFetch("/b"),
      apiFetch("/c"),
      apiFetch("/d"),
      apiFetch("/e"),
    ]);

    expect(results).toHaveLength(5);
    expect(refreshCalls).toBe(1);
  });

  it("fully logs out (clears the token) when refresh fails", async () => {
    tokenStore.set("stale-token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 })); // refresh itself fails
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/widgets")).rejects.toThrow();
    expect(tokenStore.get()).toBeNull();
  });

  it("returns null and clears the token when the refresh request throws", async () => {
    tokenStore.set("stale-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const token = await refreshAccessToken();

    expect(token).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });
});
