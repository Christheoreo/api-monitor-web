import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";

export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
    queryClient.clear(); // wipe cached query data so the next session starts clean
    navigate("/login", { replace: true });
  };

  return <button onClick={handleLogout}>Log out</button>;
}
