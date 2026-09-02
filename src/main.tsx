import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppLayout } from "./components/layout/AppLayout";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "./lib/api/client.ts";
import { tokenStore } from "./lib/api/tokenStore.ts";
import { AuthProvider } from "./features/auth/AuthProvider.tsx";
import { ProtectedRoute } from "./features/auth/ProtectedRoute.tsx";
import { LoginPage } from "./pages/LoginPage/index.tsx";
import { Dashboard } from "./pages/LoginPage/Dashboard/index.tsx";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        tokenStore.set(null); // AuthProvider is subscribed, will flip to unauthenticated
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        tokenStore.set(null);
      }
    },
  }),
  defaultOptions: {/* as above */},
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <AppLayout>
                    <Outlet />
                  </AppLayout>
                }
              >
                <Route path="/" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
