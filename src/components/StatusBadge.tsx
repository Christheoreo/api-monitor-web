import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  status: "up" | "down";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isUp = status === "up";
  return (
    <Badge
      className={
        isUp
          ? "bg-up-bg text-up-text hover:bg-up-bg"
          : "bg-down-bg text-down-text hover:bg-down-bg"
      }
    >
      {isUp ? "Up" : "Down"}
    </Badge>
  );
}
