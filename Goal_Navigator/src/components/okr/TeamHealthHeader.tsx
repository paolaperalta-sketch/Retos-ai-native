import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Check, Sparkles } from "lucide-react";

interface TeamHealthHeaderProps {
  avgProgress: number;
  totalMembers: number;
  submittedCount: number;
  pendingApprovalCount: number;
  noCheckinCount: number;
  zeroProgressCount: number;
  noCumplidoKRs: number;
  /** Suma de horas/semana ahorradas reportadas por todo el equipo */
  teamEfficiencyHoursWeek?: number;
  /** % promedio de avance de automatización del equipo */
  automationAvgPct?: number;
}

export function TeamHealthHeader({
  avgProgress,
  totalMembers,
  submittedCount,
  pendingApprovalCount,
  noCheckinCount,
  zeroProgressCount,
  noCumplidoKRs,
  teamEfficiencyHoursWeek = 0,
  automationAvgPct = 0,
}: TeamHealthHeaderProps) {
  const clamped = Math.min(100, Math.max(0, avgProgress));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const ringColor = clamped >= 71 ? "stroke-emerald-500" : clamped >= 41 ? "stroke-amber-500" : "stroke-rose-500";
  const ringGlow = clamped >= 71
    ? "drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
    : clamped >= 41
      ? "drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]"
      : "drop-shadow-[0_0_6px_rgba(239,68,68,0.3)]";

  const hasRisks = noCheckinCount > 0 || zeroProgressCount > 0 || noCumplidoKRs > 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 rounded-2xl bg-card border border-border/40 p-5 md:p-6">
      {/* Left: Health ring */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="relative">
          <svg width="100" height="100" className={`-rotate-90 ${ringGlow}`}>
            <circle cx="50" cy="50" r={radius} fill="none" className="stroke-muted/20" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              className={`${ringColor} transition-all duration-700 ease-out`}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-foreground tabular-nums">{Math.round(clamped)}%</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">Promedio del Equipo</span>
      </div>

      {/* Center: Counters */}
      <div className="flex-1 flex flex-wrap items-center justify-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tabular-nums">{submittedCount}/{totalMembers}</p>
            <p className="text-[10px] text-muted-foreground">autocalificaciones enviadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tabular-nums">{pendingApprovalCount}</p>
            <p className="text-[10px] text-muted-foreground">pendientes de tu aprobación</p>
          </div>
        </div>

        {/* Automatización: % promedio del equipo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tabular-nums">{Math.round(automationAvgPct)}%</p>
            <p className="text-[10px] text-muted-foreground">automatización del equipo</p>
          </div>
        </div>

        {/* Eficiencia generada: horas/semana auto-reportadas */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tabular-nums">
              {teamEfficiencyHoursWeek.toFixed(1)}h
              <span className="text-[10px] font-medium text-muted-foreground ml-1">/sem</span>
            </p>
            <p className="text-[10px] text-muted-foreground">eficiencia total generada</p>
          </div>
        </div>
      </div>

      {/* Right: Risk alerts */}
      <div className="shrink-0 flex flex-wrap gap-1.5 justify-end max-w-[260px]">
        {hasRisks ? (
          <>
            {noCheckinCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-full">
                <AlertCircle className="h-3 w-3" />
                {noCheckinCount} sin autocalificación
              </span>
            )}
            {zeroProgressCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-full">
                <AlertCircle className="h-3 w-3" />
                {zeroProgressCount} en 0% de avance
              </span>
            )}
            {noCumplidoKRs > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                {noCumplidoKRs} KRs no cumplidos
              </span>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-full">
            <Check className="h-3 w-3" />
            Equipo al día
          </span>
        )}
      </div>
    </div>
  );
}
