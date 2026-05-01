import { Shield } from "lucide-react";

interface ProbationBadgeProps {
  daysRemaining: number;
  compact?: boolean;
}

export function ProbationBadge({ daysRemaining, compact }: ProbationBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-warning-bg text-warning-foreground ${compact ? '' : 'px-2.5'}`}>
      <Shield className="h-3 w-3" />
      {compact ? 'Prueba' : `Periodo de Prueba · ${daysRemaining}d restantes`}
    </span>
  );
}
