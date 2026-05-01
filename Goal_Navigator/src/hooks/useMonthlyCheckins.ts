import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type StatusRating = "cumplido" | "parcial" | "no_cumplido";
export type FlowStatus = "draft" | "submitted" | "approved" | "adjusted";

export interface MonthlyCheckin {
  id: string;
  kr_id: string;
  user_id: string;
  month: string;
  progress_percent: number;
  status_rating: StatusRating;
  collaborator_comment: string;
  leader_feedback: string | null;
  flow_status: FlowStatus;
  leader_id: string | null;
  leader_adjusted_percent: number | null;
  leader_adjusted_rating: string | null;
  created_at: string;
  updated_at: string;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useMonthlyCheckins(krIds: string[], targetUserId?: string, monthOverride?: string) {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<Record<string, MonthlyCheckin>>({});
  const [loading, setLoading] = useState(false);
  const month = monthOverride || getCurrentMonth();

  const fetchCheckins = useCallback(async () => {
    if (krIds.length === 0) return;
    setLoading(true);
    try {
      let query = supabase
        .from("monthly_checkins")
        .select("*")
        .in("kr_id", krIds)
        .eq("month", month);

      if (targetUserId) {
        query = query.eq("user_id", targetUserId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const map: Record<string, MonthlyCheckin> = {};
      for (const row of (data || []) as unknown as MonthlyCheckin[]) {
        map[row.kr_id] = row;
      }
      setCheckins(map);
    } catch (e: any) {
      console.error("Error fetching checkins:", e.message);
    } finally {
      setLoading(false);
    }
  }, [krIds.join(","), targetUserId, month]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  // Realtime: refetch when monthly_checkins changes for any of the watched KRs
  useEffect(() => {
    if (krIds.length === 0) return;
    const channel = supabase
      .channel(`monthly-checkins-${krIds.join("-").slice(0, 50)}-${targetUserId ?? "self"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "monthly_checkins" },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          if (row.month !== month) return;
          if (!krIds.includes(row.kr_id)) return;
          if (targetUserId && row.user_id !== targetUserId) return;
          fetchCheckins();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [krIds.join(","), targetUserId, month, fetchCheckins]);

  // Save draft (upsert)
  const saveDraft = useCallback(async (
    krId: string,
    progressPercent: number,
    statusRating: StatusRating,
    comment: string
  ) => {
    if (!user?.id) return;
    try {
      const existing = checkins[krId];
      if (existing) {
        const { error } = await supabase
          .from("monthly_checkins")
          .update({
            progress_percent: progressPercent,
            status_rating: statusRating,
            collaborator_comment: comment,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("monthly_checkins")
          .insert({
            kr_id: krId,
            user_id: user.id,
            month,
            progress_percent: progressPercent,
            status_rating: statusRating,
            collaborator_comment: comment,
            flow_status: "draft",
          });
        if (error) throw error;
      }
      await fetchCheckins();
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    }
  }, [user?.id, checkins, month, fetchCheckins]);

  // Submit all drafts
  const submitAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      const draftIds = Object.values(checkins)
        .filter(c => c.flow_status === "draft" && c.collaborator_comment.trim().length > 0)
        .map(c => c.id);

      if (draftIds.length === 0) {
        toast.error("Completa al menos un KR antes de enviar");
        return;
      }

      const { error } = await supabase
        .from("monthly_checkins")
        .update({ flow_status: "submitted" })
        .in("id", draftIds);
      if (error) throw error;

      toast.success("Autocalificación enviada al líder");
      await fetchCheckins();
    } catch (e: any) {
      toast.error("Error al enviar: " + e.message);
    }
  }, [user?.id, checkins, fetchCheckins]);

  // Leader approve
  const approve = useCallback(async (krId: string) => {
    if (!user?.id) return;
    const c = checkins[krId];
    if (!c) return;
    try {
      const { error } = await supabase
        .from("monthly_checkins")
        .update({ flow_status: "approved", leader_id: user.id })
        .eq("id", c.id);
      if (error) throw error;
      toast.success("Check-in aprobado");
      await fetchCheckins();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  }, [user?.id, checkins, fetchCheckins]);

  // Leader adjust
  const adjust = useCallback(async (
    krId: string,
    adjustedPercent: number,
    adjustedRating: StatusRating,
    feedback: string
  ) => {
    if (!user?.id) return;
    const c = checkins[krId];
    if (!c) return;
    try {
      const { error } = await supabase
        .from("monthly_checkins")
        .update({
          flow_status: "adjusted",
          leader_id: user.id,
          leader_adjusted_percent: adjustedPercent,
          leader_adjusted_rating: adjustedRating,
          leader_feedback: feedback,
        })
        .eq("id", c.id);
      if (error) throw error;
      toast.success("Check-in ajustado");
      await fetchCheckins();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  }, [user?.id, checkins, fetchCheckins]);

  // Leader direct rate — creates a checkin if none exists
  const leaderDirectRate = useCallback(async (
    krId: string,
    targetUserId: string,
    percent: number,
    rating: StatusRating,
    comment: string
  ) => {
    if (!user?.id) return;
    try {
      const existing = checkins[krId];
      if (existing) {
        // Update existing checkin with leader override
        const { error } = await supabase
          .from("monthly_checkins")
          .update({
            flow_status: "adjusted",
            leader_id: user.id,
            leader_adjusted_percent: percent,
            leader_adjusted_rating: rating,
            leader_feedback: comment || null,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Create a new checkin as the leader
        const { error } = await supabase
          .from("monthly_checkins")
          .insert({
            kr_id: krId,
            user_id: targetUserId,
            month,
            progress_percent: percent,
            status_rating: rating,
            collaborator_comment: "",
            flow_status: "adjusted",
            leader_id: user.id,
            leader_adjusted_percent: percent,
            leader_adjusted_rating: rating,
            leader_feedback: comment || null,
          });
        if (error) throw error;
      }
      toast.success("Calificación guardada");
      await fetchCheckins();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  }, [user?.id, checkins, month, fetchCheckins]);

  const draftCount = Object.values(checkins).filter(c => c.flow_status === "draft").length;
  const submittedCount = Object.values(checkins).filter(c => c.flow_status === "submitted").length;
  const allSubmittedOrClosed = Object.keys(checkins).length > 0 &&
    Object.values(checkins).every(c => c.flow_status !== "draft");

  return {
    checkins,
    loading,
    month,
    saveDraft,
    submitAll,
    approve,
    adjust,
    leaderDirectRate,
    refetch: fetchCheckins,
    draftCount,
    submittedCount,
    allSubmittedOrClosed,
  };
}
