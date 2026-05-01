import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OperationalTask, OkrPeriod } from "@/lib/automation-utils";

export interface TeamMemberSummary {
  email: string;
  full_name: string;
  area: string | null;
  subarea: string | null;
  total: number;
  /** Tareas marcadas como automatizadas (sin filtro de evidencia) */
  automatizadas: number;
  /** Automatizadas CON evidencia válida (URL o herramienta documentada) */
  validAutomatizadas: number;
  /** % basado en validAutomatizadas/total — el único que cuenta para meta */
  pct: number;
  /** Tareas marcadas como hechas pero sin evidencia → bloqueadas para el progreso */
  sinEvidencia: number;
  horasAhorradas: number;
  /** Suma de horas/semana auto-reportadas por el colaborador (eficiencia real) */
  horasSemanaReportadas: number;
  tasks: OperationalTask[];
}

/** Una tarea cuenta hacia el progreso solo si tiene evidencia técnica
 *  (link o herramienta) Y horas ahorradas reportadas. Esto garantiza que
 *  cada automatización contabilizada alimente la métrica de eficiencia. */
export const taskHasEvidence = (t: OperationalTask) => {
  const hasProof = Boolean(
    (t.evidencia_url && t.evidencia_url.trim()) ||
      (t.herramienta_usada && t.herramienta_usada.trim()),
  );
  const hasHours = typeof t.horas_ahorradas_semana === "number" && t.horas_ahorradas_semana >= 0;
  return hasProof && hasHours;
};

export function useTeamAutomation() {
  const { user, role } = useAuth();
  const [period, setPeriod] = useState<OkrPeriod | null>(null);
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // 1. Active period
    const { data: periodData } = await supabase
      .from("okr_periods")
      .select("*")
      .eq("activo", true)
      .maybeSingle();
    setPeriod(periodData as OkrPeriod | null);

    if (!periodData) {
      setLoading(false);
      return;
    }

    // 2. Get reports list (from users_master by manager_email)
    const myEmail = user.email?.toLowerCase() ?? "";
    let teamQuery = supabase.from("users_master").select("email, full_name, area, subarea");
    if (role !== "super_admin" && role !== "global_leader") {
      teamQuery = teamQuery.eq("manager_email", user.email ?? "");
    }
    const { data: teamRows } = await teamQuery;
    const teamEmails = (teamRows ?? []).map((r) => r.email.toLowerCase());

    if (!teamEmails.length) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // 3. Fetch all their tasks (RLS will filter to allowed ones)
    const { data: taskRows } = await supabase
      .from("operational_tasks")
      .select("*")
      .eq("okr_period_id", periodData.id)
      .in("assigned_email", teamEmails);

    const tasks = (taskRows as OperationalTask[]) ?? [];

    // 4. Aggregate per person
    const summaries: TeamMemberSummary[] = (teamRows ?? []).map((r) => {
      const personTasks = tasks.filter(
        (t) => (t.assigned_email ?? "").toLowerCase() === r.email.toLowerCase(),
      );
      const automatizadasList = personTasks.filter((t) => t.estado === "automatizada");
      const validAutoList = automatizadasList.filter(taskHasEvidence);
      const automatizadas = automatizadasList.length;
      const validAutomatizadas = validAutoList.length;
      const sinEvidencia = automatizadas - validAutomatizadas;
      const total = personTasks.length;
      const horasAhorradas =
        validAutoList.reduce((acc, t) => {
          const mult: Record<string, number> = {
            Diaria: 22,
            Semanal: 4,
            Quincenal: 2,
            Mensual: 1,
            Eventual: 0.5,
          };
          return acc + (t.tiempo_minutos || 0) * (mult[t.frecuencia] ?? 0.5);
        }, 0) / 60;
      const horasSemanaReportadas = validAutoList.reduce(
        (acc, t) => acc + (t.horas_ahorradas_semana ?? 0),
        0,
      );
      return {
        email: r.email,
        full_name: r.full_name,
        area: r.area,
        subarea: r.subarea,
        total,
        automatizadas,
        validAutomatizadas,
        sinEvidencia,
        pct: total ? (validAutomatizadas / total) * 100 : 0,
        horasAhorradas,
        horasSemanaReportadas,
        tasks: personTasks,
      };
    });

    setMembers(summaries.filter((m) => m.total > 0));
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const ch = supabase
      .channel(`team-automation-rt-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operational_tasks" },
        () => fetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetch]);

  return { period, members, loading, refresh: fetch };
}
