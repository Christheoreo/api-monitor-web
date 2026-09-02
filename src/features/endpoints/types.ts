export interface Endpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  status: "up" | "down";
  responseTimeMs: number | null;
  lastCheckedLabel: string; // e.g. "12s ago" — formatted display string
  uptimePercent: number;
}
