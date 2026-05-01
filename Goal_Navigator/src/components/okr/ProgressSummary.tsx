import { PersonalKR, Status } from "@/types/okr";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { calcWeightedProgress, progressToStatus, calcKRProgress } from "@/lib/okr-utils";
import { formatKR } from "@/lib/text-utils";
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ProgressSummaryProps {
  krs: PersonalKR[];
  title?: string;
}

export function ProgressSummary({ krs, title = "Resumen de Progreso" }: ProgressSummaryProps) {
  const overallProgress = calcWeightedProgress(krs);
  const overallStatus = progressToStatus(overallProgress);

  const onTrack = krs.filter(kr => kr.status === "on_track").length;
  const atRisk = krs.filter(kr => kr.status === "at_risk").length;
  const offTrack = krs.filter(kr => kr.status === "off_track").length;

  return (
    <div className="space-y-4">
      {title && <h2 className="text-sm font-bold text-foreground">{title}</h2>}

      {/* Main progress */}
      <div className="rounded-xl bg-card border p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium">Cumplimiento Ponderado</span>
          </div>
          <StatusBadge status={overallStatus} />
        </div>
        <p className="text-3xl font-bold text-foreground mb-2">{Math.round(overallProgress)}%</p>
        <ProgressBar value={overallProgress} status={overallStatus} size="lg" showLabel={false} />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card border p-3 text-center">
          <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{onTrack}</p>
          <p className="text-[10px] text-muted-foreground">On Track</p>
        </div>
        <div className="rounded-xl bg-card border p-3 text-center">
          <TrendingUp className="h-4 w-4 text-warning mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{atRisk}</p>
          <p className="text-[10px] text-muted-foreground">At Risk</p>
        </div>
        <div className="rounded-xl bg-card border p-3 text-center">
          <AlertTriangle className="h-4 w-4 text-danger mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{offTrack}</p>
          <p className="text-[10px] text-muted-foreground">Off Track</p>
        </div>
      </div>

      {/* Per-KR breakdown */}
      {krs.length > 0 && (
        <div className="rounded-xl bg-card border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Desglose por KR</p>
          {krs.map(kr => {
            const p = calcKRProgress(kr);
            return (
              <div key={kr.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="kr-title text-foreground truncate max-w-[70%] normal-case" style={{ textTransform: "none" }}>{formatKR(kr.name)}</span>
                  <span className="text-[11px] font-bold text-muted-foreground">{Math.round(p)}%</span>
                </div>
                <ProgressBar value={p} status={kr.status} size="sm" showLabel={false} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
