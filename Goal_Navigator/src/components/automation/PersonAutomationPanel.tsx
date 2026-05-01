import { useEffect, useMemo } from "react";
import { Sparkles, Target, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { calcAutomationPercent, type OperationalTask, type OkrPeriod } from "@/lib/automation-utils";
import { TeamMemberAutomationTaskCard } from "./TeamMemberAutomationPanel";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  email: string;
  fullName: string;
}

async function fetchActivePeriod(): Promise<OkrPeriod | null> {
  const { data } = await supabase
    .from("okr_periods")
    .select("*")
    .eq("activo", true)
    .maybeSingle();
  return (data as OkrPeriod | null) ?? null;
}

async function fetchPersonTasks(periodId: string, email: string): Promise<OperationalTask[]> {
  const { data } = await supabase
    .from("operational_tasks")
    .select("*")
    .eq("okr_period_id", periodId)
    .ilike("assigned_email", email);
  return (data as OperationalTask[]) ?? [];
}

/**
 * Per-person Automation panel rendered inside the unified
 * Person profile (Mi Equipo → expand person → Automatización tab).
 * Cached via react-query so switching tabs/people is instant on revisit.
 */
export function PersonAutomationPanel({ email, fullName }: Props) {
  const qc = useQueryClient();

  const { data: period } = useQuery({
    queryKey: ["okr-active-period"],
    queryFn: fetchActivePeriod,
    staleTime: 10 * 60 * 1000,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["person-tasks", period?.id, email.toLowerCase()],
    queryFn: () => fetchPersonTasks(period!.id, email),
    enabled: Boolean(period?.id && email),
    staleTime: 5 * 60 * 1000,
  });

  // Realtime: invalidate on changes (single shared channel per email)
  useEffect(() => {
    if (!period?.id || !email) return;
    const ch = supabase
      .channel(`person-auto-${email.toLowerCase()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operational_tasks" },
        () => {
          qc.invalidateQueries({ queryKey: ["person-tasks", period.id, email.toLowerCase()] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [period?.id, email, qc]);

  const stats = useMemo(() => {
    const base = calcAutomationPercent(tasks);
    return { ...base, pct: base.percent };
  }, [tasks]);

  if (isLoading && tasks.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Cargando tareas…</p>;
  }
  if (!tasks.length) {
    return (
      <div className="text-center py-10 px-6 rounded-xl border border-dashed border-border/40 bg-muted/10">
        <Sparkles className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">Sin tareas asignadas</p>
        <p className="text-xs text-muted-foreground mt-1">
          {fullName.split(" ")[0]} aún no tiene tareas operativas para automatizar en este periodo.
        </p>
      </div>
    );
  }

  const meta = period?.meta_porcentaje ?? 80;
  const towardGoal = Math.min(100, (stats.pct / meta) * 100);

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Avance hacia automatización</p>
          </div>
          <span className="text-xl font-bold text-foreground tabular-nums">{stats.pct.toFixed(0)}%</span>
        </div>
        <Progress value={towardGoal} className="h-2" />
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground tabular-nums">
          <span className="inline-flex items-center gap-1">
            <Target className="h-3 w-3" /> Meta {meta}%
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {stats.validated} validadas
          </span>
          <span>· {stats.total} totales</span>
          {stats.pending > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" /> {stats.pending} por validar
            </span>
          )}
        </div>
      </div>

      {/* Lista de tareas con evidencia + comentarios */}
      <div className="space-y-2.5">
        {tasks.map((t) => (
          <TeamMemberAutomationTaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}
