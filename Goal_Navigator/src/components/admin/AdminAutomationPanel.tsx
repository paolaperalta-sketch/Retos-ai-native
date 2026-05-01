import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, CheckCircle2, AlertCircle, AlertTriangle, Users } from "lucide-react";
import { useTeamAutomation } from "@/hooks/useTeamAutomation";
import { estadoSemaforo } from "@/lib/automation-utils";

/**
 * Org-wide Automation health panel for the Company dashboard.
 * Shows aggregated KPIs and an area-level ranking. NO per-person task detail
 * — that lives inside each person's profile in "Mi Equipo".
 */
export function AdminAutomationPanel() {
  const { period, members, loading } = useTeamAutomation();

  const kpis = useMemo(() => {
    const total = members.reduce((a, m) => a + m.total, 0);
    const validAuto = members.reduce((a, m) => a + m.validAutomatizadas, 0);
    const sinEv = members.reduce((a, m) => a + m.sinEvidencia, 0);
    const horas = members.reduce((a, m) => a + m.horasAhorradas, 0);
    const enRiesgo = period
      ? members.filter(
          (m) => estadoSemaforo(m.pct, period.meta_porcentaje, period.fecha_inicio, period.fecha_fin) === "en_riesgo",
        ).length
      : 0;
    return {
      total,
      validAuto,
      sinEv,
      horas,
      enRiesgo,
      avgPct: total ? (validAuto / total) * 100 : 0,
      activePeople: members.length,
    };
  }, [members, period]);

  const byArea = useMemo(() => {
    const map = new Map<string, { area: string; total: number; valid: number; people: number }>();
    members.forEach((m) => {
      const key = m.area ?? "Sin área";
      if (!map.has(key)) map.set(key, { area: key, total: 0, valid: 0, people: 0 });
      const row = map.get(key)!;
      row.total += m.total;
      row.valid += m.validAutomatizadas;
      row.people += 1;
    });
    return Array.from(map.values())
      .map((r) => ({ ...r, pct: r.total ? (r.valid / r.total) * 100 : 0 }))
      .sort((a, b) => b.pct - a.pct);
  }, [members]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">Cargando indicadores de automatización…</p>
      </Card>
    );
  }
  if (!period) return null;

  const meta = period.meta_porcentaje;

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Salud de Automatización</h3>
            <p className="text-xs text-muted-foreground">Indicador organizacional · Meta {meta}%</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground tabular-nums">{kpis.avgPct.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground">avance global</p>
        </div>
      </div>

      <Progress value={Math.min(100, (kpis.avgPct / meta) * 100)} className="h-2" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Mini icon={Users} label="Personas activas" value={String(kpis.activePeople)} />
        <Mini icon={Target} label="Tareas totales" value={String(kpis.total)} />
        <Mini icon={CheckCircle2} label="Con evidencia" value={String(kpis.validAuto)} />
        <Mini icon={AlertCircle} label="Sin evidencia" value={String(kpis.sinEv)} accent={kpis.sinEv > 0} />
        <Mini icon={AlertTriangle} label="En riesgo" value={String(kpis.enRiesgo)} accent={kpis.enRiesgo > 0} />
      </div>

      {byArea.length > 0 && (
        <div className="pt-2 border-t border-border/40">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Ranking por área
          </p>
          <div className="space-y-1.5">
            {byArea.map((a) => (
              <div key={a.area} className="flex items-center gap-3 text-xs">
                <span className="w-32 truncate font-medium text-foreground">{a.area}</span>
                <Progress value={Math.min(100, (a.pct / meta) * 100)} className="h-1.5 flex-1 max-w-md" />
                <span className="w-10 text-right tabular-nums font-semibold text-foreground">
                  {a.pct.toFixed(0)}%
                </span>
                <span className="w-20 text-right tabular-nums text-muted-foreground">
                  {a.valid}/{a.total} · {a.people}p
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Mini({ icon: Icon, label, value, accent }: any) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-amber-500/40 bg-amber-500/5" : "border-border/40 bg-muted/10"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-amber-500" : "text-muted-foreground"}`} />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
