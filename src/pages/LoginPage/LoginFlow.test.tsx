import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./index";
import { AuthProvider } from "../../features/auth/AuthProvider";
import { tokenStore } from "../../lib/api/tokenStore";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const VALID_USER = {
  id: "11111111-1111-4111-8111-111111111111",
  first_name: null,
  last_name: null,
  email: "chris@example.com",
  createdAt: null,
  updatedAt: null,
};

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Dashboard home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  tokenStore.set(null);
  vi.restoreAllMocks();
});

async function goToCodeStep(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("fetch", fetchMock);
  renderLoginPage();

  await userEvent.type(
    screen.getByLabelText(/email/i),
    "chris@example.com",
  );
  await userEvent.click(screen.getByRole("button", { name: /send code/i }));

  await screen.findByLabelText(/6-digit code/i);
}

describe("login flow", () => {
  it("goes from email to code entry to an authenticated redirect", async () => {
    const fetchMock = vi.fn((url: string) => {
      const path = url.toString();
      if (path.includes("/auth/refresh"))
        return Promise.resolve(new Response(null, { status: 401 }));
      if (path.includes("/auth/request-code"))
        return Promise.resolve(jsonResponse({ message: "sent" }));
      if (path.includes("/auth/verify-code"))
        return Promise.resolve(jsonResponse({ accessToken: "access-123" }));
      if (path.includes("/auth/user"))
        return Promise.resolve(jsonResponse(VALID_USER));
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    await goToCodeStep(fetchMock);

    await userEvent.type(screen.getByLabelText(/6-digit code/i), "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await screen.findByText("Dashboard home");
    expect(tokenStore.get()).toBe("access-123");
  });

  it("rejects an invalid email before calling the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    // fireEvent.submit bypasses the native type="email" constraint
    // validation that a real click would trigger, so this exercises our
    // own zod validation in the submit handler instead of the browser's.
    fireEvent.submit(screen.getByRole("button", { name: /send code/i }).closest("form")!);

    expect(
      await screen.findByText(/enter a valid email/i),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some((call) =>
        call[0].toString().includes("/auth/request-code"),
      ),
    ).toBe(false);
  });

  it("shows a friendly message for a wrong or expired code", async () => {
    const fetchMock = vi.fn((url: string) => {
      const path = url.toString();
      if (path.includes("/auth/refresh"))
        return Promise.resolve(new Response(null, { status: 401 }));
      if (path.includes("/auth/request-code"))
        return Promise.resolve(jsonResponse({ message: "sent" }));
      if (path.includes("/auth/verify-code"))
        return Promise.resolve(
          jsonResponse(
            { message: "Invalid or expired code" },
            { status: 400 },
          ),
        );
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    await goToCodeStep(fetchMock);

    await userEvent.type(screen.getByLabelText(/6-digit code/i), "000000");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    expect(
      await screen.findByText(/invalid or has expired/i),
    ).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
  });

  it("shows a friendly message when too many attempts are made", async () => {
    const fetchMock = vi.fn((url: string) => {
      const path = url.toString();
      if (path.includes("/auth/refresh"))
        return Promise.resolve(new Response(null, { status: 401 }));
      if (path.includes("/auth/request-code"))
        return Promise.resolve(jsonResponse({ message: "sent" }));
      if (path.includes("/auth/verify-code"))
        return Promise.resolve(
          jsonResponse({ message: "Too many attempts" }, { status: 429 }),
        );
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    await goToCodeStep(fetchMock);

    await userEvent.type(screen.getByLabelText(/6-digit code/i), "111111");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    expect(await screen.findByText(/too many attempts/i)).toBeInTheDocument();
  });
});
