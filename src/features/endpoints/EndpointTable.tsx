import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/StatusBadge";
import { UptimeBar } from "../../components/UptimeBar";
import type { Endpoint } from "./types";

interface EndpointTableProps {
  endpoints: Endpoint[];
  onEdit: (endpoint: Endpoint) => void;
}

export function EndpointTable({ endpoints, onEdit }: EndpointTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Endpoint</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Response Time</TableHead>
          <TableHead>Last Checked</TableHead>
          <TableHead>Uptime (7d)</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {endpoints.map((endpoint) => (
          <TableRow key={endpoint.id}>
            <TableCell>
              <div className="font-semibold">{endpoint.name}</div>
              <div className="text-sm text-text-secondary">
                {endpoint.method} {endpoint.path}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={endpoint.status} />
            </TableCell>
            <TableCell>
              {endpoint.responseTimeMs !== null
                ? `${endpoint.responseTimeMs} ms`
                : "—"}
            </TableCell>
            <TableCell className="text-text-secondary">
              {endpoint.lastCheckedLabel}
            </TableCell>
            <TableCell>
              <UptimeBar percent={endpoint.uptimePercent} />
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(endpoint)}
              >
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
