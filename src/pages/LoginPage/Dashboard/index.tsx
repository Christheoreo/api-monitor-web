import { EndpointTable } from "@/features/endpoints/EndpointTable";
import type { Endpoint } from "@/features/endpoints/types";

// TEMPORARY — replace with useQuery(["endpoints"], fetchEndpoints) once /endpoints exists.
const mockEndpoints: Endpoint[] = [
  {
    id: "1",
    name: "Auth API",
    method: "GET",
    path: "/v1/auth/login",
    status: "up",
    responseTimeMs: 112,
    lastCheckedLabel: "12s ago",
    uptimePercent: 99.98,
  },
  {
    id: "2",
    name: "Search API",
    method: "GET",
    path: "/v1/search",
    status: "down",
    responseTimeMs: null,
    lastCheckedLabel: "2m ago",
    uptimePercent: 92.4,
  },
];

export function Dashboard() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Endpoints</h1>
        <span className="text-sm">
          <span className="text-up-text">13 up</span>
          {" · "}
          <span className="text-down-text">2 down</span>
        </span>
      </div>
      <EndpointTable endpoints={mockEndpoints} onEdit={() => {}} />
    </div>
  );
}
