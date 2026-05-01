import { Status } from "@/types/okr";
import { StatusBadge } from "./StatusBadge";

interface GlobalProgressRingProps {
  progress: number;
  status: Status;
  krCount: number;
  weightSum: number;
}

export function GlobalProgressRing({ progress, status, krCount, weightSum }: GlobalProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor = clamped >= 80
    ? "stroke-emerald-500"
    : clamped >= 50
      ? "stroke-amber-500"
      : "stroke-rose-500";

  const glowColor = clamped >= 80
    ? "drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
    : clamped >= 50
      ? "drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]"
      : "drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]";

  return (
    <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-6">
        {/* Donut ring */}
        <div className="relative shrink-0">
          <svg width="120" height="120" className={`-rotate-90 ${glowColor}`}>
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              className="stroke-muted/20"
              strokeWidth="10"
            />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              className={`${strokeColor} transition-all duration-1000 ease-out`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-foreground tabular-nums">{Math.round(clamped)}%</span>
            <span className="text-[10px] text-muted-foreground font-medium">global</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Progreso Global</h2>
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{krCount}</strong> KRs activos</span>
            <span>·</span>
            <span>Peso total: <strong className="text-foreground">{weightSum}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
