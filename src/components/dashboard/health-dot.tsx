import { cn } from "@/lib/utils";

type Health = "healthy" | "at_risk" | "churned" | "green" | "yellow" | "red";

const colorMap: Record<Health, string> = {
  healthy: "bg-emerald-500",
  green: "bg-emerald-500",
  at_risk: "bg-amber-500",
  yellow: "bg-amber-500",
  churned: "bg-red-500",
  red: "bg-red-500",
};

const labelMap: Record<Health, string> = {
  healthy: "Healthy",
  green: "On Track",
  at_risk: "At Risk",
  yellow: "Needs Attention",
  churned: "Churned",
  red: "At Risk",
};

export function HealthDot({ health, showLabel = false }: { health: Health; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", colorMap[health])} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{labelMap[health]}</span>
      )}
    </span>
  );
}
