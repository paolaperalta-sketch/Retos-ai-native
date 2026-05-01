import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OperationalTask, OkrPeriod, Estado } from "@/lib/automation-utils";
import { toast } from "sonner";

export function useOperationalTasks(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const [period, setPeriod] = useState<OkrPeriod | null>(null);
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: periodData } = await supabase
      .from("okr_periods")
      .select("*")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setPeriod(periodData as OkrPeriod | null);

    if (periodData) {
      const email = user.email?.toLowerCase() ?? "";
      const { data: taskData, error } = await supabase
        .from("operational_tasks")
        .select("*")
        .eq("okr_period_id", periodData.id)
        .or(`user_id.eq.${user.id},assigned_email.eq.${email}`)
        .order("created_at", { ascending: true });

      if (error) console.error("tasks error", error);
      setTasks((taskData as OperationalTask[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (enabled) fetchAll();
  }, [fetchAll, enabled]);

  // Realtime — only when enabled to avoid idle subscriptions
  useEffect(() => {
    if (!user || !enabled) return;
    const channel = supabase
      .channel(`op-tasks-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operational_tasks" },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAll, enabled]);

  const updateTask = useCallback(
    async (id: string, patch: Partial<OperationalTask>) => {
      // Optimistic
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      const { error } = await supabase.from("operational_tasks").update(patch).eq("id", id);
      if (error) {
        toast.error("No se pudo guardar el cambio");
        fetchAll();
      }
    },
    [fetchAll],
  );

  const toggleAutomatizada = useCallback(
    (task: OperationalTask): { becameAutomatizada: boolean } => {
      const nueva: Estado = task.estado === "automatizada" ? "pendiente" : "automatizada";
      const patch: Partial<OperationalTask> = {
        estado: nueva,
        fecha_automatizada: nueva === "automatizada" ? new Date().toISOString() : null,
      };
      // Need to claim if user_id is null
      if (!task.user_id && user) {
        (patch as any).user_id = user.id;
      }
      updateTask(task.id, patch);
      if (nueva === "automatizada") {
        toast.success("✨ Tarea marcada como automatizada");
      }
      return { becameAutomatizada: nueva === "automatizada" };
    },
    [updateTask, user],
  );

  const createTask = useCallback(
    async (input: {
      descripcion: string;
      frecuencia: string;
      tiempo_minutos: number;
    }) => {
      if (!user || !period) return;
      const { error } = await supabase.from("operational_tasks").insert({
        user_id: user.id,
        assigned_email: user.email,
        okr_period_id: period.id,
        descripcion: input.descripcion,
        frecuencia: input.frecuencia,
        tiempo_minutos: input.tiempo_minutos,
        estado: "pendiente",
        origen: "manual",
      });
      if (error) toast.error("No se pudo crear la tarea");
      else {
        toast.success("Tarea creada");
        fetchAll();
      }
    },
    [user, period, fetchAll],
  );

  return { period, tasks, loading, updateTask, toggleAutomatizada, createTask, refresh: fetchAll };
}

export function useTaskComments(taskId: string | null) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setComments(data ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!taskId) return;
    const ch = supabase
      .channel(`task-comments-${taskId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => fetchComments(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [taskId, fetchComments]);

  const addComment = useCallback(
    async (texto: string, isLeader = false) => {
      if (!taskId || !user || !texto.trim()) return;
      const { error } = await supabase.from("task_comments").insert({
        task_id: taskId,
        author_user_id: user.id,
        comentario: texto.trim(),
        is_leader_comment: isLeader,
      });
      if (error) toast.error("No se pudo enviar el comentario");
    },
    [taskId, user],
  );

  return { comments, loading, addComment };
}
