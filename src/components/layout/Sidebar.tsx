interface Endpoint {
  id: string;
  name: string;
  status: "up" | "down";
}

interface SidebarProps {
  endpoints: Endpoint[];
}

export function Sidebar({ endpoints }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border p-6">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-text-secondary">Endpoints</h2>
      <ul className="space-y-3">
        {endpoints.map((endpoint) => (
          <li key={endpoint.id} className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                endpoint.status === "up" ? "bg-up-text" : "bg-down-text"
              }`}
            />
            <span className="text-sm">{endpoint.name}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
