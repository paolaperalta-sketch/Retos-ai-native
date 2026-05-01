import { Status } from "@/types/okr";

interface StatusBadgeProps {
  status: Status;
  compact?: boolean;
}

const statusConfig: Record<Status, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  on_track: { label: "On Track", dotColor: "bg-success", bgColor: "bg-success-bg", textColor: "text-success-foreground" },
  at_risk: { label: "At Risk", dotColor: "bg-warning", bgColor: "bg-warning-bg", textColor: "text-warning-foreground" },
  off_track: { label: "Off Track", dotColor: "bg-danger", bgColor: "bg-danger-bg", textColor: "text-danger-foreground" },
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (compact) {
    return <span className={`h-2 w-2 rounded-full shrink-0 ${config.dotColor}`} title={config.label} />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bgColor} ${config.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
