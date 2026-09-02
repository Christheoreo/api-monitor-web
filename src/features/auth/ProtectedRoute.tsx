import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return null; // or a spinner — swap for a shared <Spinner /> if you have one
  }

  if (status === "unauthenticated") {
    // Stash the page they were headed to, so LoginPage can send them back after verify-code
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
