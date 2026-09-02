interface UptimeBarProps {
  percent: number;
}

export function UptimeBar({ percent }: UptimeBarProps) {
  const isHealthy = percent >= 98;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full ${isHealthy ? "bg-up-text" : "bg-down-text"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm">{percent}%</span>
    </div>
  );
}
