import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveRole } from "@/lib/rbac";
import { toast } from "sonner";
import type { PersonalKR } from "@/types/okr";

export interface KRFormData {
  name: string;
  companyOkrName: string; // pillar name
  baseline: number;
  target: number;
  weight: number;
  closingMonth?: "abril" | "mayo" | "junio" | "julio";
}

/**
 * Check if current user can manage (add/edit/delete) KRs for a target person.
 * Rules:
 *  - super_admin: always
 *  - team_leader who is the direct manager of the target: yes
 *  - everyone else: no
 */
export function canManageKRsForPerson(
  currentEmail: string | undefined,
  targetManagerEmail: string | undefined,
  currentRole: string
): boolean {
  if (!currentEmail) return false;
  if (currentRole === "super_admin") return true;
  if (currentRole === "team_leader" && targetManagerEmail) {
    return currentEmail.toLowerCase() === targetManagerEmail.toLowerCase();
  }
  return false;
}

export function useKRCrud() {
  const { user, role } = useAuth();
  const [saving, setSaving] = useState(false);
  const effectiveRole = getEffectiveRole(user?.email, role);

  const addKR = useCallback(async (
    data: KRFormData,
    targetUserId: string,
    okrId: string
  ) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("key_results").insert({
        name: data.name.toUpperCase(),
        user_id: targetUserId,
        okr_id: okrId,
        baseline: data.baseline,
        target: data.target,
        weight: data.weight,
        current_value: data.baseline,
        status: "on_track",
        closing_month: data.closingMonth ?? "mayo",
      });
      if (error) throw error;
      toast.success("Objetivos actualizados correctamente");
      return true;
    } catch (e: any) {
      toast.error("Error al agregar KR: " + e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateKR = useCallback(async (
    krId: string,
    updates: Partial<{ name: string; target: number; weight: number; baseline: number; current_value: number; closing_month: string }>
  ) => {
    setSaving(true);
    try {
      const finalUpdates: typeof updates = { ...updates };
      if (finalUpdates.name) finalUpdates.name = finalUpdates.name.toUpperCase();

      const { error } = await supabase
        .from("key_results")
        .update(finalUpdates)
        .eq("id", krId);
      if (error) throw error;
      toast.success("Objetivos actualizados correctamente");
      return true;
    } catch (e: any) {
      toast.error("Error al actualizar KR: " + e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteKR = useCallback(async (krId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("key_results")
        .delete()
        .eq("id", krId);
      if (error) throw error;
      toast.success("Indicador eliminado correctamente");
      return true;
    } catch (e: any) {
      toast.error("Error al eliminar KR: " + e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { addKR, updateKR, deleteKR, saving, effectiveRole };
}
