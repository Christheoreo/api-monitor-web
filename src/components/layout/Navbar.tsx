import { NavLink } from "react-router";
import { LogoutButton } from "../../features/auth/LogoutButton";
import { Button } from "../ui/button";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/status-pages", label: "Status Pages" },
  { to: "/settings", label: "Settings" },
];

export function Navbar() {
  return (
    <header className="flex items-center justify-between border-b border-border px-8 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-accent font-bold">
          P
        </div>
        <span className="text-lg font-bold">Pulse</span>
      </div>

      <nav className="flex items-center gap-6">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              isActive ? "text-accent" : "text-text-secondary hover:text-white"
            }
          >
            {link.label}
          </NavLink>
        ))}
        <LogoutButton />
        <Button>+ Add Endpoint</Button>
      </nav>
    </header>
  );
}
