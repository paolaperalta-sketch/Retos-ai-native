import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { findNode, findParent, teamHierarchy } from "@/data/teamHierarchy";
import { LeaderCheckinReview } from "./LeaderCheckinReview";
import { useMonthlyCheckins } from "@/hooks/useMonthlyCheckins";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { calcWeightedProgress, progressToStatus } from "@/lib/okr-utils";
import { ArrowLeft, Target, Sparkles, ListChecks } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { avatarMap } from "@/data/avatarMap";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonAutomationPanel } from "@/components/automation/PersonAutomationPanel";
import type { PersonalKR } from "@/types/okr";
import type { KRFormValues } from "./KRFormModal";
import { formatKR } from "@/lib/text-utils";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LeaderPersonDetailProps {
  selectedPerson: string;
  krs: PersonalKR[];
  krPillarMap: Record<string, string>;
  onBack: () => void;
  canManage: boolean;
  nameToEmail: Record<string, string>;
  userIdMap: Record<string, string>;
  hireDates: Record<string, string>;
  localKRs: Record<string, PersonalKR[]>;
  onLocalKRsChange: (name: string, krs: PersonalKR[]) => void;
  onAddKR: (values: KRFormValues, targetUserId: string) => Promise<void>;
  onUpdateKR: (krId: string, updates: Partial<{ name: string; target: number; weight: number; baseline: number }>) => Promise<void>;
  onDeleteKR: (krId: string) => Promise<void>;
  saving: boolean;
}

export function LeaderPersonDetail({
  selectedPerson,
  krs,
  krPillarMap,
  onBack,
  nameToEmail,
  userIdMap,
}: LeaderPersonDetailProps) {
  const { user } = useAuth();
  const node = findNode(teamHierarchy, selectedPerson);
  const boss = findParent(teamHierarchy, selectedPerson);
  const progress = calcWeightedProgress(krs);
  const status = progressToStatus(progress);

  const grouped = useMemo(() => {
    const map: Record<string, PersonalKR[]> = {};
    krs.forEach(kr => {
      const pillar = krPillarMap[kr.id] || "Otros";
      if (!map[pillar]) map[pillar] = [];
      map[pillar].push(kr);
    });
    return Object.entries(map);
  }, [krs]);

  // Monthly check-ins for this person
  const personEmail = nameToEmail[selectedPerson];
  const personUserId = personEmail ? userIdMap[personEmail] : undefined;
  const krIds = useMemo(() => krs.map(kr => kr.id), [krs]);

  const {
    checkins: monthlyCheckins,
    approve: approveCheckin,
    adjust: adjustCheckin,
  } = useMonthlyCheckins(krIds, personUserId);

  // Prefetch automation tasks so the "Automatización" tab opens instantly
  const qc = useQueryClient();
  useEffect(() => {
    if (!personEmail) return;
    qc.prefetchQuery({
      queryKey: ["okr-active-period"],
      queryFn: async () => {
        const { data } = await supabase.from("okr_periods").select("*").eq("activo", true).maybeSingle();
        return data ?? null;
      },
      staleTime: 10 * 60 * 1000,
    }).then(() => {
      const period: any = qc.getQueryData(["okr-active-period"]);
      if (!period?.id) return;
      qc.prefetchQuery({
        queryKey: ["person-tasks", period.id, personEmail.toLowerCase()],
        queryFn: async () => {
          const { data } = await supabase
            .from("operational_tasks")
            .select("*")
            .eq("okr_period_id", period.id)
            .ilike("assigned_email", personEmail);
          return data ?? [];
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [personEmail, qc]);

  const pendingCount = Object.values(monthlyCheckins).filter(c => c.flow_status === "submitted").length;
  const firstName = selectedPerson.split(" ")[0];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        Volver al equipo
      </button>

      {/* Person header */}
      <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarMap[selectedPerson]} alt={selectedPerson} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {selectedPerson.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">{selectedPerson}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {node?.role} · {node?.area}
            {boss && <span className="ml-2 text-border">|</span>}
            {boss && <span className="ml-2">Reporta a {boss.name.split(" ").slice(0, 2).join(" ")}</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-foreground tabular-nums">{Math.round(progress)}%</span>
          <div className="mt-1">
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={progress} status={status} size="sm" showLabel={false} />

      {/* Unified profile tabs: OKRs + Automatización */}
      <Tabs defaultValue="okrs">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="okrs" className="gap-1.5">
            <Target className="h-3.5 w-3.5" />
            OKRs &amp; Check-ins
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Automatización
          </TabsTrigger>
        </TabsList>

        <TabsContent value="okrs" className="mt-4 space-y-4">
          {/* Pending banner */}
          {pendingCount > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <span className="text-amber-700 dark:text-amber-400 font-bold text-sm">{pendingCount}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Autocalificaciones pendientes</p>
                <p className="text-xs text-muted-foreground">
                  {firstName} envió {pendingCount} resultado{pendingCount > 1 ? "s" : ""} para tu revisión
                </p>
              </div>
            </div>
          )}

          {/* Check-in review cards grouped by pillar */}
          {grouped.map(([pillar, pillarKrs]) => {
            return (
              <div key={pillar} className="space-y-2.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {pillar}
                </p>
                {pillarKrs.map(kr => {
                  const checkin = monthlyCheckins[kr.id];
                  if (!checkin) {
                    return (
                      <div key={kr.id} className="rounded-xl border border-border/40 bg-card px-4 py-3 flex items-center gap-3">
                        <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="kr-title text-foreground truncate normal-case" style={{ textTransform: "none" }}>{formatKR(kr.name)}</p>
                          <p className="kr-meta-label">
                            Base: {kr.baseline} · Meta: {kr.target} · Actual: {kr.current}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground italic">Sin check-in</span>
                      </div>
                    );
                  }
                  return (
                    <LeaderCheckinReview
                      key={kr.id}
                      krId={kr.id}
                      krName={formatKR(kr.name)}
                      checkin={checkin}
                      onApprove={approveCheckin}
                      onAdjust={adjustCheckin}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {krs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No hay KRs asignados a {firstName}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="automation" className="mt-4">
          {personEmail ? (
            <PersonAutomationPanel email={personEmail} fullName={selectedPerson} />
          ) : (
            <div className="text-center py-10 px-6 rounded-xl border border-dashed border-border/40 bg-muted/10">
              <ListChecks className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No se encontró el correo de {firstName} para cargar sus tareas.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
