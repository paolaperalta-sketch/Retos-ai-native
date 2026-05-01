import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calcAutomationPercent, type OperationalTask } from "@/lib/automation-utils";

/**
 * Lightweight hook to get a person's automation progress (% with valid evidence)
 * for the active period. Used to show the metric prominently in the team list
 * without needing to expand the row.
 */
export function usePersonAutomationPct(email?: string) {
  const [pct, setPct] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    (async () => {
      const { data: periodData } = await supabase
        .from("okr_periods")
        .select("id")
        .eq("activo", true)
        .maybeSingle();
      if (!periodData || cancelled) return;
      const { data } = await supabase
        .from("operational_tasks")
        .select("*")
        .eq("okr_period_id", periodData.id)
        .ilike("assigned_email", email);
      if (cancelled) return;
      const tasks = (data as OperationalTask[]) ?? [];
      const stats = calcAutomationPercent(tasks);
      setTotal(tasks.length);
      setPct(stats.percent);
    })();

    const ch = supabase
      .channel(`person-auto-pct-${email}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operational_tasks" },
        async () => {
          const { data: periodData } = await supabase
            .from("okr_periods")
            .select("id")
            .eq("activo", true)
            .maybeSingle();
          if (!periodData) return;
          const { data } = await supabase
            .from("operational_tasks")
            .select("*")
            .eq("okr_period_id", periodData.id)
            .ilike("assigned_email", email);
          const tasks = (data as OperationalTask[]) ?? [];
          const stats = calcAutomationPercent(tasks);
          setTotal(tasks.length);
          setPct(stats.percent);
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [email]);

  return { pct, total };
}
