import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-white">
      <Navbar />
      <div className="flex">
        <Sidebar endpoints={[]} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
