import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthProvider";
import { tokenStore } from "../../lib/api/tokenStore";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function Probe() {
  const { status, user, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

beforeEach(() => {
  tokenStore.set(null);
  vi.restoreAllMocks();
  // Every AuthProvider mounts and immediately calls refreshAccessToken();
  // default to "no session" so tests start from a clean, deterministic state.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
  );
});

describe("AuthProvider logout", () => {
  it("clears client-side auth state even when the logout network call fails", async () => {
    const fetchMock = vi.fn((url: string) => {
      const path = url.toString();
      if (path.includes("/auth/refresh"))
        return Promise.resolve(jsonResponse({ accessToken: "valid-token" }));
      if (path.includes("/auth/user")) {
        return Promise.resolve(
          jsonResponse({
            id: "11111111-1111-4111-8111-111111111111",
            first_name: null,
            last_name: null,
            email: "chris@example.com",
            createdAt: null,
            updatedAt: null,
          }),
        );
      }
      if (path.includes("/auth/logout")) {
        return Promise.reject(new Error("network down"));
      }
      return Promise.resolve(new Response(null, { status: 401 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent(
      "chris@example.com",
    );

    await userEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent(
        "unauthenticated",
      ),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(tokenStore.get()).toBeNull();
  });
});
