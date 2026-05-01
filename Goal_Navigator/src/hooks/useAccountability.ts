import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AccountabilityData, AccountabilityStatus } from "@/components/okr/AccountabilityPanel";

interface AccountabilityRow {
  id: string;
  kr_id: string;
  user_id: string;
  suggested_score: number;
  self_comment: string;
  progress_value: number | null;
  status: string;
  leader_id: string | null;
  leader_score: number | null;
  leader_comment: string | null;
  period: string;
  created_at: string;
  updated_at: string;
}

function rowToData(row: AccountabilityRow): AccountabilityData {
  return {
    suggestedScore: row.suggested_score,
    selfComment: row.self_comment,
    status: row.status as AccountabilityStatus,
    progressValue: row.progress_value ?? undefined,
    leaderScore: row.leader_score ?? undefined,
    leaderComment: row.leader_comment ?? undefined,
  };
}

/**
 * Hook to manage accountability data for a set of KR IDs.
 * Works for both collaborator (own records) and leader (reports' records).
 */
export function useAccountability(krIds: string[], targetUserId?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, AccountabilityData>>({});
  const [rows, setRows] = useState<Record<string, AccountabilityRow>>({});
  const [loading, setLoading] = useState(false);

  // Fetch existing accountability records
  const fetchData = useCallback(async () => {
    if (krIds.length === 0) return;
    setLoading(true);
    try {
      let query = supabase
        .from("kr_accountability")
        .select("*")
        .in("kr_id", krIds);

      if (targetUserId) {
        query = query.eq("user_id", targetUserId);
      }

      const { data: result, error } = await query;
      if (error) throw error;

      const newData: Record<string, AccountabilityData> = {};
      const newRows: Record<string, AccountabilityRow> = {};
      for (const row of (result || []) as unknown as AccountabilityRow[]) {
        newData[row.kr_id] = rowToData(row);
        newRows[row.kr_id] = row;
      }
      setData(newData);
      setRows(newRows);
    } catch (e: any) {
      console.error("Error fetching accountability:", e.message);
    } finally {
      setLoading(false);
    }
  }, [krIds.join(","), targetUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Collaborator submits self-score
  const submitSelfScore = useCallback(async (krId: string, score: number, comment: string, progressValue?: number) => {
    if (!user?.id) {
      toast.error("Sesión expirada, vuelve a iniciar sesión");
      return false;
    }
    try {
      const existing = rows[krId];
      if (existing) {
        const { error } = await supabase
          .from("kr_accountability")
          .update({
            suggested_score: score,
            self_comment: comment,
            progress_value: progressValue ?? 0,
            status: "submitted",
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kr_accountability")
          .insert({
            kr_id: krId,
            user_id: user.id,
            suggested_score: score,
            self_comment: comment,
            progress_value: progressValue ?? 0,
            status: "submitted",
          });
        if (error) throw error;
      }
      toast.success("✅ Autocalificación cargada", {
        description: "Tu líder fue notificado para revisarla.",
      });
      await fetchData();
      return true;
    } catch (e: any) {
      console.error("[autocalificacion] error:", e);
      toast.error("No se pudo enviar tu calificación", {
        description: e?.message || "Revisa tu conexión e intenta de nuevo.",
      });
      return false;
    }
  }, [user?.id, rows, fetchData]);

  // Leader approves
  const approveScore = useCallback(async (krId: string) => {
    if (!user?.id) return;
    const existing = rows[krId];
    if (!existing) return;
    try {
      const { error } = await supabase
        .from("kr_accountability")
        .update({
          status: "approved",
          leader_id: user.id,
          leader_score: existing.suggested_score,
        })
        .eq("id", existing.id);
      if (error) throw error;
      toast.success("Resultado aprobado");
      await fetchData();
    } catch (e: any) {
      toast.error("Error al aprobar: " + e.message);
    }
  }, [user?.id, rows, fetchData]);

  // Leader adjusts
  const adjustScore = useCallback(async (krId: string, score: number, comment: string) => {
    if (!user?.id) return;
    const existing = rows[krId];
    if (!existing) return;
    try {
      const { error } = await supabase
        .from("kr_accountability")
        .update({
          status: "adjusted",
          leader_id: user.id,
          leader_score: score,
          leader_comment: comment,
        })
        .eq("id", existing.id);
      if (error) throw error;
      toast.success("Resultado ajustado y cerrado");
      await fetchData();
    } catch (e: any) {
      toast.error("Error al ajustar: " + e.message);
    }
  }, [user?.id, rows, fetchData]);

  return { data, loading, submitSelfScore, approveScore, adjustScore, refetch: fetchData };
}
