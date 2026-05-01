import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions, getUserNode } from "@/lib/rbac";
import { findParent, teamHierarchy } from "@/data/teamHierarchy";

import {
  Rocket, Target, ChevronDown,
  Building2, Clock, CheckCircle2, ArrowUpDown, MessageSquare, Loader2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { calcKRProgress } from "@/lib/okr-utils";


import { PeriodSelector } from "@/components/okr/PeriodSelector";
import { PageTitle } from "@/components/PageTitle";
import { useMonthlyCheckins } from "@/hooks/useMonthlyCheckins";
import type { StatusRating, FlowStatus, MonthlyCheckin } from "@/hooks/useMonthlyCheckins";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PersonalKR, CompanyOKR } from "@/types/okr";
import { KR_SELECT_COLUMNS, mapKRRow, dedupeKRs, periodToClosingMonth } from "@/lib/kr-mapper";
import { PERIOD_ALL } from "./PeriodSelector";
import { formatKR, normalizeBia } from "@/lib/text-utils";
import { OKRContextTags } from "@/components/okr/OKRContextTags";
import { AINativeAutomationChecklist } from "@/components/automation/AINativeAutomationChecklist";
import { isAutomationKR } from "@/lib/automation-utils";
import { useOperationalTasks } from "@/hooks/useOperationalTasks";

type KRAssignee = { id: string; name: string; checkinId?: string };
type ViewKR = PersonalKR & {
  isOwn?: boolean;
  canSelfEvaluate?: boolean;
  /** When >1, this row is a deduplicated KR shared by several owners. */
  assignees?: KRAssignee[];
  /** All KR ids represented by this row (for progress aggregation). */
  groupedKrIds?: string[];
};

type ViewAreaOKR = {
  id: string;
  name: string;
  area: string;
  description?: string;
  isOwnedByUser?: boolean;
  krs: ViewKR[];
};

const isAINativeOkr = (name: string) => /ai\s*native/i.test(name || "");

const RATINGS: { key: StatusRating; label: string; emoji: string; bg: string; text: string }[] = [
  { key: "cumplido", label: "Cumplido", emoji: "✅", bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400" },
  { key: "parcial", label: "Parcial", emoji: "⚠️", bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-400" },
  { key: "no_cumplido", label: "No cumplido", emoji: "❌", bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-500 dark:text-pink-400" },
];

export default function CollaboratorView() {
  const { user, role, impersonating, realUser } = useAuth();
  const permissions = getUserPermissions(user?.email, role);
  const currentUser = permissions.userName || "Sebastián Ruales";
  
  const userNode = getUserNode(user?.email);
  const leaderNode = userNode ? findParent(teamHierarchy, userNode.name) : null;
  // When impersonating someone whose profile is missing, user.id falls back to the super_admin's id.
  // In that case we MUST NOT filter by user_id (or we leak the admin's KRs).
  const isImpersonatingWithoutProfile = !!impersonating && (!impersonating.userId || impersonating.userId === realUser?.id);

  const [period, setPeriod] = useState("Mayo 2026");
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // KRs come exclusively from the DB now (mock data removed).
  // KRs from Supabase — real data assigned to this user_id (or pre-assigned by email)
  const [dbKRs, setDbKRs] = useState<PersonalKR[]>([]);
  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("get_person_key_results", {
        _target_user_id: isImpersonatingWithoutProfile ? null : user.id,
        _target_email: user.email,
        _target_full_name: currentUser,
      });
      if (error) {
        console.error("KR query error", error);
        setDbKRs([]);
        return;
      }

      const mapped: PersonalKR[] = ((data || []) as any[]).map(r => mapKRRow(r, currentUser));

      if (typeof window !== "undefined") {
        // Audit log to make missing KR diagnosis easy in the console.
        console.info(`[KR audit] ${currentUser} → ${mapped.length} KRs from DB`);
      }
      setDbKRs(mapped);
    })();
  }, [user?.id, user?.email, currentUser, isImpersonatingWithoutProfile]);

  // Only DB KRs are shown — mock data fallback removed since the OKR base was wiped
  // and will be re-uploaded with real data.
  const myKRs = useMemo(() => {
    const base = dedupeKRs(dbKRs);
    const closing = periodToClosingMonth(period);
    if (!closing) return base;
    return base.filter(kr => kr.closingMonth === closing);
  }, [dbKRs, period]);

  // Load company OKR names for DB-based cascade grouping.
  // FASE 3 created the canonical `company_okrs` table — KRs reference it via company_okr_id.
  const [companyOkrMap, setCompanyOkrMap] = useState<Record<string, { id: string; name: string; area: string; pillarName: string; description: string }>>({});
  useEffect(() => {
    (async () => {
      const [coRes, pRes] = await Promise.all([
        supabase.from("company_okrs").select("id, name, area, pillar_id, description"),
        supabase.from("okr_pillars").select("id, name"),
      ]);
      if (coRes.error) { console.error("company_okrs query error", coRes.error); return; }
      if (pRes.error) { console.error("okr_pillars query error", pRes.error); }
      const pillarMap: Record<string, string> = {};
      (pRes.data || []).forEach((p: any) => { pillarMap[p.id] = p.name; });
      const map: Record<string, { id: string; name: string; area: string; pillarName: string; description: string }> = {};
      (coRes.data || []).forEach((c: any) => {
        map[c.id] = {
          id: c.id,
          name: c.name,
          area: c.area || "",
          pillarName: pillarMap[c.pillar_id] || "",
          description: c.description || "",
        };
      });
      setCompanyOkrMap(map);
    })();
  }, []);

  // Owned area OKRs — when current user is okr_owner of any company_okrs row,
  // fetch ALL its KRs (regardless of who owns them). KRs not assigned to current user
  // are merged read-only into the unified "Mis objetivos" cascade so leaders see
  // all OKRs they own (e.g. Katheryn → Lifecycle).
  const [ownedAreaKRs, setOwnedAreaKRs] = useState<PersonalKR[]>([]);
  useEffect(() => {
    if (!user?.email) { setOwnedAreaKRs([]); return; }
    (async () => {
      const krRes = await (supabase as any).rpc("get_owned_area_key_results", {
        _target_user_id: isImpersonatingWithoutProfile ? null : user.id,
        _target_email: user.email,
        _target_full_name: currentUser,
      });
      if (krRes.error) { console.error("owned area KRs error", krRes.error); setOwnedAreaKRs([]); return; }
      const mapped = ((krRes.data || []) as any[]).map((r: any) => {
        const realOwner = (r.assigned_full_name || "").split(",")[0]?.trim() || currentUser;
        return mapKRRow(r, realOwner);
      });
      console.info(`[OKR-owner audit] ${currentUser} → ${mapped.length} owner KR(s) total`);
      setOwnedAreaKRs(mapped);
    })();
  }, [user?.id, user?.email, currentUser, isImpersonatingWithoutProfile]);

  // Build cascade — group by PILLAR (gran OKR de compañía).
  // Each pillar contains multiple area-level OKRs (rows in `company_okrs`),
  // and each area OKR contains its KRs. Hierarchy:
  //   Pillar (AI NATIVE) → OKR de área (company_okrs.name) → KRs
  // KRs WITHOUT a known company_okr_id stay ungrouped (rendered as orphan KRs first).
  const cascade = useMemo(() => {
    const groups: Record<string, { companyOkr: CompanyOKR; pillarName: string; areaOkrs: ViewAreaOKR[] }> = {};
    const addAreaKR = (kr: ViewKR, forceFullArea = false) => {
      const cid = kr.areaOkrId;
      const co = cid ? companyOkrMap[cid] : undefined;
      if (!co) return; // orphan — handled separately
      const pillarKey = (co.pillarName || co.name).trim().toUpperCase() || "SIN PILAR";
      if (!groups[pillarKey]) {
        groups[pillarKey] = {
          companyOkr: { id: pillarKey, name: co.pillarName || co.name, progress: 0, areaOkrs: [] },
          pillarName: co.pillarName || "",
          areaOkrs: [],
        };
      }
      let areaGroup = groups[pillarKey].areaOkrs.find(a => a.id === co.id);
      if (!areaGroup) {
        areaGroup = { id: co.id, name: co.name, area: co.area, description: co.description, isOwnedByUser: forceFullArea, krs: [] };
        groups[pillarKey].areaOkrs.push(areaGroup);
      }
      areaGroup.isOwnedByUser = areaGroup.isOwnedByUser || forceFullArea;
      if (!areaGroup.krs.some(existing => existing.id === kr.id)) areaGroup.krs.push(kr);
    };
    const closing = periodToClosingMonth(period);
    const filteredOwned = closing ? ownedAreaKRs.filter(kr => kr.closingMonth === closing) : ownedAreaKRs;
    const myKrIds = new Set(myKRs.map(k => k.id));
    myKRs.forEach(kr => addAreaKR({ ...kr, isOwn: true, canSelfEvaluate: true }, true));
    // Merge owned-area KRs (leader is okr_owner) — leader self-evaluates global progress.
    filteredOwned.forEach(kr => {
      if (myKrIds.has(kr.id)) return;
      addAreaKR({ ...kr, isOwn: false, canSelfEvaluate: true }, true);
    });

    // ── DEDUPLICATION: within each area OKR, merge KRs sharing the same
    // normalized name into ONE row (no per-person details). The leader rates
    // the global KR — the per-person detail lives in "Mi equipo".
    const normName = (s: string) => {
      let t = (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,;:()"']/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Strip trailing filler phrases that don't change KR meaning.
      const fillers = [
        "de los casos", "de casos", "del total", "de las solicitudes",
        "de solicitudes", "de los clientes", "de clientes", "de las personas",
        "de personas", "de los tickets", "de tickets", "en total", "global",
      ];
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of fillers) {
          if (t.endsWith(" " + f)) { t = t.slice(0, -f.length - 1).trim(); changed = true; }
        }
      }
      return t;
    };
    Object.values(groups).forEach(g => {
      g.areaOkrs.forEach(ao => {
        const buckets = new Map<string, ViewKR[]>();
        ao.krs.forEach(kr => {
          const key = normName(kr.name);
          const arr = buckets.get(key) || [];
          arr.push(kr);
          buckets.set(key, arr);
        });
        const deduped: ViewKR[] = [];
        buckets.forEach(arr => {
          if (arr.length === 1) { deduped.push(arr[0]); return; }
          // Prefer the user's own KR as representative if present.
          const rep = arr.find(k => k.isOwn) || arr[0];
          const avgCurrent = arr.reduce((s, k) => s + (Number(k.current) || 0), 0) / arr.length;
          deduped.push({
            ...rep,
            current: avgCurrent,
            // Strip per-person metadata so the UI never renders names/counts.
            assignees: undefined,
            groupedKrIds: undefined,
          });
        });
        ao.krs = deduped;
      });
    });

    const result = Object.values(groups);
    // ⚡ Priority pinning: in Mayo 2026, the AI Native OKR is the priority of
    // the month and must always render first regardless of source order.
    if (/mayo/i.test(period)) {
      result.sort((a, b) => {
        const ai = isAINativeOkr(a.companyOkr.name) ? -1 : 0;
        const bi = isAINativeOkr(b.companyOkr.name) ? -1 : 0;
        return ai - bi;
      });
    }
    return result;
  }, [myKRs, ownedAreaKRs, companyOkrMap, period]);

  // Orphan KRs: only DB KRs without a known company_okr_id (rendered first, ungrouped)
  const orphanKRs = useMemo(() => {
    if (dbKRs.length === 0) return [];
    return myKRs.filter(kr => !kr.areaOkrId || !companyOkrMap[kr.areaOkrId]);
  }, [dbKRs, myKRs, companyOkrMap]);

  const displayedKRs = useMemo(() => dedupeKRs(myKRs), [myKRs]);
  const krIds = useMemo(() => displayedKRs.map(kr => kr.id), [displayedKRs]);
  const ownKrIdSet = useMemo(() => new Set(myKRs.map(kr => kr.id)), [myKRs]);

  const {
    checkins,
    saveDraft: saveCheckinDraft,
    refetch: refetchCheckins,
  } = useMonthlyCheckins(krIds);

  const checkinDraftCount = useMemo(() => myKRs.filter(kr => checkins[kr.id]?.flow_status === "draft").length, [myKRs, checkins]);
  const allSubmittedOrClosed = useMemo(() => myKRs.length > 0 && myKRs.every(kr => checkins[kr.id] && checkins[kr.id].flow_status !== "draft"), [myKRs, checkins]);
  const submitCheckins = async () => {
    const draftIds = myKRs.map(kr => checkins[kr.id]).filter(c => c?.flow_status === "draft" && c.collaborator_comment.trim().length > 0).map(c => c!.id);
    if (draftIds.length === 0) return;
    await supabase.from("monthly_checkins").update({ flow_status: "submitted" }).in("id", draftIds);
    await refetchCheckins();
  };

  const overallProgress = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    myKRs.forEach(kr => {
      const c = checkins[kr.id];
      const pct = c ? (c.leader_adjusted_percent ?? (c.flow_status === "approved" ? c.progress_percent : (c.progress_percent || 0))) : 0;
      const w = kr.weight || 0;
      weightedSum += pct * w;
      totalWeight += w;
    });
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }, [myKRs, checkins]);

  const firstName = sentenceCase(currentUser.split(" ")[0] || "");

  // Color helpers
  const progressColor = (p: number) =>
    p >= 80 ? "text-emerald-500" : p >= 50 ? "text-amber-500" : "text-rose-500";
  const progressBg = (p: number) =>
    p >= 80 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500";
  const progressRingStroke = (p: number) =>
    p >= 80 ? "stroke-emerald-500" : p >= 50 ? "stroke-amber-500" : "stroke-rose-500";

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, overallProgress));
  const offset = circumference - (clamped / 100) * circumference;

  // Checkin stats — KRs that have been rated (any non-null progress + rating)
  const ratedCount = useMemo(() => {
    return myKRs.filter(kr => {
      const c = checkins[kr.id];
      return c && (c.progress_percent != null && c.progress_percent !== 0 || c.flow_status !== "draft");
    }).length;
  }, [myKRs, checkins]);
  const submittedOrClosedCount = Object.values(checkins).filter(
    c => c.flow_status !== "draft"
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8 font-sans" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ─── PAGE TITLE ─── */}
      <PageTitle
        breadcrumb="MI DESEMPEÑO"
        title="Mi desempeño"
        controls={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      {/* ─── HERO HEADER ─── */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm overflow-hidden animate-fade-in">
        <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative shrink-0">
            <svg width="104" height="104" className="-rotate-90 drop-shadow-sm">
              <circle cx="52" cy="52" r={radius * 0.85} fill="none" className="stroke-muted/15" strokeWidth="9" />
              <circle
                cx="52" cy="52" r={radius * 0.85} fill="none"
                className={`${progressRingStroke(clamped)} transition-all duration-1000 ease-out`}
                strokeWidth="9" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * radius * 0.85}
                strokeDashoffset={(2 * Math.PI * radius * 0.85) - (clamped / 100) * (2 * Math.PI * radius * 0.85)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-foreground tabular-nums">{Math.round(clamped)}%</span>
              <span className="text-[9px] text-muted-foreground font-medium tracking-wide">Avance</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                Hola, {firstName} 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tu progreso global en {period}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-primary" />
                <strong className="text-foreground">{ratedCount}</strong> KRs calificados de <strong className="text-foreground">{myKRs.length}</strong>
              </span>
              {submittedOrClosedCount > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <strong className="text-foreground">{submittedOrClosedCount}</strong> enviados
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── OKR CASCADE WITH INTEGRATED SELF-EVAL ─── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 px-1 mb-3">
          <Building2 className="h-4 w-4 text-primary" />
          Mis objetivos & autocalificación
        </h2>

        {/* Orphan KRs (no parent OKR) — rendered first as standalone rows */}
        {orphanKRs.map(kr => (
          <OrphanKRRow
            key={kr.id}
            kr={kr}
            checkin={checkins[kr.id] || null}
            onSaveDraft={saveCheckinDraft}
            progressColor={progressColor}
            progressBg={progressBg}
          />
        ))}

        {cascade.map(({ companyOkr, areaOkrs, pillarName }) => (
          <CompanyOKRCard
            key={companyOkr.id}
            companyName={companyOkr.name}
            pillarName={pillarName}
            areaOkrs={areaOkrs}
            checkins={checkins}
            onSaveDraft={saveCheckinDraft}
            progressColor={progressColor}
            progressBg={progressBg}
            isPriority={isAINativeOkr(companyOkr.name) && /mayo/i.test(period)}
            period={period}
          />
        ))}

        {cascade.length === 0 && orphanKRs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No tienes KRs asignados para este periodo
          </div>
        )}
      </div>

      {/* ─── SUBMIT CTA — sticky footer, only when there are drafts ready ─── */}
      {myKRs.length > 0 && !allSubmittedOrClosed && checkinDraftCount > 0 && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <div className="flex items-center gap-3 rounded-full bg-card/95 backdrop-blur border border-border shadow-lg pl-4 pr-1.5 py-1.5">
            <span className="text-[11px] text-muted-foreground">
              {checkinDraftCount} {checkinDraftCount === 1 ? "KR listo" : "KRs listos"} para enviar a tu líder
            </span>
            <Button
              onClick={async () => {
                setSubmitting(true);
                try {
                  await submitCheckins();
                  setJustSubmitted(true);
                  setTimeout(() => setJustSubmitted(false), 4000);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              className="gap-1.5 rounded-full h-8 px-3 text-[11px] font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              size="sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Rocket className="h-3.5 w-3.5" />
                  Enviar Autocalificación
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {(allSubmittedOrClosed || justSubmitted) && Object.keys(checkins).length > 0 && (
        <div className="text-center py-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            ✅ Autocalificación enviada — Tu líder fue notificado.
          </p>
        </div>
      )}

    </div>
  );
}

/* ─── Company OKR Card ─── */
/* ─── Company OKR Card — parent row + collapsible KR children ─── */
function CompanyOKRCard({
  companyName,
  pillarName,
  areaOkrs,
  checkins,
  onSaveDraft,
  progressColor,
  progressBg,
  isPriority = false,
  period,
}: {
  companyName: string;
  pillarName?: string;
  areaOkrs: ViewAreaOKR[];
  checkins: Record<string, MonthlyCheckin>;
  onSaveDraft: (krId: string, percent: number, rating: StatusRating, comment: string) => void;
  progressColor: (p: number) => string;
  progressBg: (p: number) => string;
  isPriority?: boolean;
  period?: string;
}) {
  // All KRs flattened — used for aggregate progress + count
  const allKrs = useMemo(() => areaOkrs.flatMap(ao => ao.krs), [areaOkrs]);

  // Aggregate OKR progress (weighted average of KR check-ins)
  const okrProgress = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    allKrs.forEach(kr => {
      const c = checkins[kr.id];
      const pct = c
        ? (c.leader_adjusted_percent ?? (c.flow_status === "approved" ? c.progress_percent : (c.progress_percent || 0)))
        : calcKRProgress(kr);
      const w = kr.weight || 0;
      weightedSum += pct * w;
      totalWeight += w;
    });
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }, [allKrs, checkins]);

  // Default state: ALL cards start collapsed. The user actively chooses which
  // to expand. This avoids the "infinite scroll" overload on first load.
  // (Previously cards auto-opened when KRs were unrated, but with 4-5 OKRs ×
  // 8-12 KRs each that produced an overwhelming first view.)
  const [open, setOpen] = useState(false);

  // Use the area name from the first area OKR — represents the OKR de área
  // (e.g., "Lifecycle"). The chip shows the área (e.g. "CX").
  // AI Native is a transversal/global OKR — never inherit the user's own area
  // (PEOPLE, SALES, etc.). Always show "TRANSVERSAL".
  const primaryAreaOkr = areaOkrs[0];
  const isAINative = isAINativeOkr(companyName) || isAINativeOkr(pillarName || "");
  const headerArea = isAINative ? "TRANSVERSAL" : (primaryAreaOkr?.area || "").toUpperCase();
  const headerName = sentenceCase(primaryAreaOkr?.name || companyName);

  // ── Priority card (AI Native in Mayo): pull automation tasks for inline progress ──
  // Lazy-load: only fetch tasks when the card is open OR it's the priority header
  // (we still need the small stats summary for the collapsed priority badge).
  const { tasks: automationTasks } = useOperationalTasks({ enabled: isPriority || open });
  const automationStats = useMemo(() => {
    if (!isPriority) return null;
    const total = automationTasks.length;
    const done = automationTasks.filter(t => t.estado === "automatizada").length;
    const validated = automationTasks.filter(t => t.validation_status === "validada").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    let copy = `${done}/${total} tareas · Hasta 31 mayo`;
    if (total === 0) copy = "Sin tareas cargadas para este mes";
    else if (validated === total && total > 0) copy = "✓ Validado por tu líder";
    else if (done >= total && total > 0) copy = "✓ Meta alcanzada · Pendiente líder";
    return { total, done, pct, copy };
  }, [isPriority, automationTasks]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-xl border overflow-hidden shadow-sm ${
        isPriority
          ? "border-primary/30 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent ring-1 ring-primary/10"
          : "border-border/40 bg-card"
      }`}>
        {isPriority && (
          <div className="flex items-center gap-1.5 px-4 py-1 bg-primary/10 border-b border-primary/15 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Zap className="h-3 w-3 fill-primary" />
            Prioridad mayo 2026
          </div>
        )}
        <CollapsibleTrigger asChild>
          <button className={`w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer text-left bg-transparent border-none ${
            isPriority ? "hover:bg-primary/5" : "hover:bg-muted/10"
          }`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              isPriority
                ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-gradient-to-br from-primary/20 to-primary/5"
            }`}>
              {isPriority
                ? <Zap className="h-4 w-4 fill-primary-foreground" />
                : <Target className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">OKR · {headerArea || "Área"}</p>
                <p className="text-sm font-semibold text-foreground truncate">{headerName}</p>
              </div>
              {isPriority && automationStats ? (
                <div className="flex items-center gap-2 pr-2">
                  <div className="h-1.5 flex-1 max-w-[180px] rounded-full bg-primary/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                      style={{ width: `${automationStats.pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-foreground tabular-nums">{automationStats.done}/{automationStats.total}</span>
                  <span className="text-[11px] text-muted-foreground">· Hasta 31 mayo</span>
                </div>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <OKRContextTags
                    areaOkrText={primaryAreaOkr?.description || primaryAreaOkr?.name}
                  />
                </div>
              )}
            </div>
            <span className={`text-sm font-bold tabular-nums shrink-0 ${progressColor(okrProgress)}`}>
              {okrProgress}%
            </span>
            {!isPriority && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {allKrs.length} KR{allKrs.length !== 1 ? "s" : ""}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>


        <CollapsibleContent>
          <div className={`border-t px-3 py-3 space-y-4 ${
            isPriority ? "bg-primary/[0.03] border-primary/15" : "bg-muted/20 border-border/20"
          }`}>
            {areaOkrs.map(ao => (
              <div key={ao.id} className="space-y-2">
                {/* Area OKR sub-header — only show if multiple area OKRs grouped */}
                {areaOkrs.length > 1 && (
                <div className="px-2 pt-1 flex items-start gap-2">
                  <Target className="h-3.5 w-3.5 text-primary/70 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-primary/70">
                      OKR · {isAINative ? "Transversal" : sentenceCase(ao.area || "Área")}
                    </p>
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs font-medium text-foreground/90 leading-snug cursor-help underline decoration-dotted decoration-primary/30 underline-offset-2">
                            {sentenceCase(ao.name)}
                          </p>
                        </TooltipTrigger>
                        {ao.description && (
                          <TooltipContent side="top" className="max-w-md text-xs leading-relaxed">
                            {ao.description}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                )}
                {/* KRs under this area OKR */}
                <div className="relative pl-7">
                  <div className="absolute left-2 top-0 bottom-2 w-px bg-primary/20" aria-hidden />
                  <div className="space-y-1.5">
                    {ao.krs.map(kr => (
                      <div key={kr.id} className="relative">
                        <div className="absolute -left-5 top-5 w-4 h-px bg-primary/20" aria-hidden />
                        <InlineKRCheckin
                          kr={kr}
                          checkin={checkins[kr.id] || null}
                          onSaveDraft={onSaveDraft}
                          progressColor={progressColor}
                          progressBg={progressBg}
                          canSelfEvaluate={!!(kr as ViewKR).canSelfEvaluate}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ─── Orphan KR row — for KRs without a parent company OKR ─── */
function OrphanKRRow({
  kr,
  checkin,
  onSaveDraft,
  progressColor,
  progressBg,
}: {
  kr: PersonalKR;
  checkin: MonthlyCheckin | null;
  onSaveDraft: (krId: string, percent: number, rating: StatusRating, comment: string) => void;
  progressColor: (p: number) => string;
  progressBg: (p: number) => string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-sm p-2">
      <div className="px-2 pt-1 pb-1.5 flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-primary/60" />
        <p className="text-[10px] font-semibold text-primary/70">KR · Individual</p>
      </div>
      <InlineKRCheckin
        kr={kr}
        checkin={checkin}
        onSaveDraft={onSaveDraft}
        progressColor={progressColor}
        progressBg={progressBg}
      />
    </div>
  );
}

/** Sentence case helper — protects acronyms and lowercases connectors regardless of source casing */
const PROTECTED_WORDS = new Set([
  "AI", "Bia", "OKR", "OKRs", "KR", "KRs", "CX", "CEO", "CFO", "CTO", "COO",
  "ANEEL", "NPS", "CSAT", "SLA", "SST", "IT", "HR", "ROI", "KPI", "B2B", "B2C",
]);
const LOWERCASE_CONNECTORS = new Set([
  "de", "en", "la", "el", "los", "las", "y", "o", "a", "con", "por", "para", "del", "al",
]);
function sentenceCase(s: string): string {
  if (!s) return s;
  const out = s
    .split(/\s+/)
    .map((w, i) => {
      if (!w) return w;
      // Protected acronym match (case-insensitive)
      const protectedMatch = Array.from(PROTECTED_WORDS).find(p => p.toLowerCase() === w.toLowerCase());
      if (protectedMatch) return protectedMatch;
      const lower = w.toLowerCase();
      // Connectors stay lowercase (except first word)
      if (i > 0 && LOWERCASE_CONNECTORS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
  return normalizeBia(out);
}

/* ─── Inline KR with integrated self-evaluation ─── */
function InlineKRCheckin({
  kr,
  checkin,
  onSaveDraft,
  progressColor,
  progressBg,
  areaOkrText,
  canSelfEvaluate = true,
}: {
  kr: PersonalKR;
  checkin: MonthlyCheckin | null;
  onSaveDraft: (krId: string, percent: number, rating: StatusRating, comment: string) => void;
  progressColor: (p: number) => string;
  progressBg: (p: number) => string;
  areaOkrText?: string;
  canSelfEvaluate?: boolean;
}) {
  const isAutomation = isAutomationKR(kr.name);
  const [expanded, setExpanded] = useState(isAutomation && canSelfEvaluate);
  const [resultValue, setResultValue] = useState(checkin ? String(checkin.progress_percent) : "");
  const [rating, setRating] = useState<StatusRating | null>(
    checkin ? (checkin.status_rating as StatusRating) : null
  );
  const [comment, setComment] = useState(checkin?.collaborator_comment ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialMountRef = useRef(true);

  const flowStatus = (checkin?.flow_status ?? "draft") as FlowStatus;
  // Future-month lock: KRs whose `monthly_targets.active_month` is later than
  // the SELECTED period cannot be self-graded yet. We compare against the
  // period the user picked (not the calendar month) so a user looking at
  // "Mayo 2026" can grade their May KRs even if today's date is still April.
  const activeMonth = (kr.monthlyTargets?.active_month as string | undefined) || undefined;
  const monthLabelMap: Record<string, string> = {
    "2026-05": "mayo", "2026-06": "junio", "2026-07": "julio", "2026-08": "agosto",
  };
  // El KR AI Native siempre se puede abrir — el colaborador necesita ir marcando
  // tareas desde ya aunque la meta cierre en mayo. El % se calcula del checklist.
  // For now we only guard against months explicitly in the future (junio/julio
  // when the active period is mayo). Mayo is always graded.
  const calendarMonthKey = new Date().toISOString().slice(0, 7);
  const isFutureMonth = !!activeMonth && activeMonth > calendarMonthKey && activeMonth > "2026-05" && !isAutomation;
  const futureMonthLabel = activeMonth ? (monthLabelMap[activeMonth] || activeMonth) : "";
  const isLocked = !canSelfEvaluate || ((flowStatus !== "draft" || isFutureMonth) && !isAutomation);

  // Sync from checkin (when remote data changes)
  useEffect(() => {
    if (checkin) {
      setResultValue(String(checkin.progress_percent));
      setRating(checkin.status_rating as StatusRating);
      setComment(checkin.collaborator_comment ?? "");
    }
    initialMountRef.current = true;
  }, [checkin?.id, checkin?.flow_status]);

  const numericResult = resultValue === "" ? null : Number(resultValue);
  const autoPercent = useMemo(() => {
    if (numericResult === null) return 0;
    const base = kr.baseline ?? 0;
    const target = kr.target ?? 100;
    if (target === base) return 0;
    return Math.round(Math.min(100, Math.max(0, ((numericResult - base) / (target - base)) * 100)));
  }, [numericResult, kr.baseline, kr.target]);

  const sourcePercent = Math.round(Math.min(100, Math.max(0, calcKRProgress(kr))));
  const displayPercent = checkin
    ? (checkin.leader_adjusted_percent ?? checkin.progress_percent ?? sourcePercent)
    : canSelfEvaluate
      ? autoPercent
      : sourcePercent;

  const isTouched = resultValue !== "";
  const hasCheckin = !!checkin;
  // Auto-derive rating from computed percent (no UI for it anymore)
  const derivedRating: StatusRating = autoPercent >= 80 ? "cumplido" : autoPercent >= 50 ? "parcial" : "no_cumplido";

  // ── AUTO-SAVE: debounce 600ms whenever rating/result/comment change ──
  useEffect(() => {
    if (isLocked) return;
    // Skip the very first render after mount/sync
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    if (!isTouched) return; // need both rating + result before persisting

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(async () => {
      try {
        await onSaveDraft(kr.id, autoPercent, derivedRating, comment);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("idle");
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultValue, comment, autoPercent, derivedRating, isLocked, isTouched]);

  // Status indicator
  const statusLabel = isLocked
    ? flowStatus === "approved"
      ? { icon: <CheckCircle2 className="h-3 w-3" />, text: "Aprobado", color: "text-emerald-600 dark:text-emerald-400" }
      : flowStatus === "submitted"
        ? { icon: <Clock className="h-3 w-3" />, text: "Enviado", color: "text-amber-600 dark:text-amber-400" }
        : flowStatus === "adjusted"
          ? { icon: <ArrowUpDown className="h-3 w-3" />, text: "Ajustado", color: "text-primary" }
          : null
    : null;

  // Semantic color for the rating dot in collapsed view (auto-derived)
  const ratingDotColor = !isTouched
    ? "bg-muted"
    : derivedRating === "cumplido"
      ? "bg-emerald-500"
      : derivedRating === "parcial"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className={`rounded-lg border transition-colors bg-background/50 ${
      isTouched && !isLocked ? "border-border/50" : "border-border/20 hover:border-border/40"
    }`}>
      {/* KR Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-start gap-3 p-3 text-left transition-colors bg-transparent border-none ${
          "hover:bg-muted/10 cursor-pointer"
        }`}
      >
        <Target className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p
            className="kr-title text-foreground normal-case break-words flex items-start gap-1.5"
            style={{ textTransform: "none" }}
            title={formatKR(kr.name)}
          >
            {kr.isStar && (
              <span
                className="inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 shrink-0"
                title="KR estrella — top priority"
              >
                ★
              </span>
            )}
            <span>{formatKR(kr.name)}</span>
            {canSelfEvaluate && (kr as ViewKR).isOwn === false ? null : null}
            {canSelfEvaluate && (kr as ViewKR).isOwn && (
              <span className="ml-1 inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-1.5 py-0.5 text-[9px] font-semibold text-primary shrink-0">Tu KR</span>
            )}
          </p>
          {areaOkrText && (
            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
              <OKRContextTags areaOkrText={areaOkrText} />
            </div>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="kr-meta-label">
              Baseline: <strong className="text-foreground">{
                (kr.monthlyTargets?.baseline as string) || (kr.baseline ? `${kr.baseline}` : "—")
              }</strong>
            </span>
            <span className="kr-meta-label">
              Meta {futureMonthLabel || "mayo"}: <strong className="text-foreground">{
                (activeMonth === "2026-06"
                  ? (kr.monthlyTargets?.meta_junio as string)
                  : (kr.monthlyTargets?.meta_mayo as string)) ||
                (kr.target ? `${kr.target}` : "—")
              }</strong>
            </span>
            <span className="kr-meta-label">
              Peso: <strong className="text-foreground">{(() => {
                const w = kr.weight || 0;
                // Tolerate both fraction (0.5) and percent (50) storage.
                const pct = w > 1 ? w : w * 100;
                return `${Math.round(pct)}%`;
              })()}</strong>
            </span>
            {/* Progress bar */}
            <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden max-w-[80px]">
              <div
                className={`h-full rounded-full ${progressBg(displayPercent)} transition-all duration-500`}
                style={{ width: `${Math.min(displayPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right side: percent + status */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isTouched || hasCheckin ? (
            <span className={`text-sm font-bold tabular-nums ${progressColor(displayPercent)}`}>
              {displayPercent}%
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Sin calificar</span>
          )}
          {isFutureMonth ? (
            <span className="text-[10px] font-medium flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Meta activa: {futureMonthLabel}
            </span>
          ) : statusLabel ? (
            <span className={`text-[10px] font-medium flex items-center gap-0.5 ${statusLabel.color}`}>
              {statusLabel.icon}
              {statusLabel.text}
            </span>
          ) : isTouched ? (
            <span className="text-[10px] font-medium flex items-center gap-1 text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${ratingDotColor}`} />
              Borrador
            </span>
          ) : !expanded ? (
            <span className="text-[10px] text-primary font-medium">
              {isAutomation ? "Ver tareas" : "Calificar"}
            </span>
          ) : null}
        </div>
      </button>

      {/* Expanded self-eval form (auto-save) */}
      {expanded && !isLocked && (
        <div className="px-3 pb-3 pt-0 space-y-3 animate-fade-in border-t border-border/10 mx-3">
          {isAutomationKR(kr.name) ? (
            <div className="pt-3">
              <AINativeAutomationChecklist
                onPercentChange={(pct) => {
                  // Push validated % into the result field so the KR check-in flow uses it.
                  setResultValue(String(pct));
                }}
              />
            </div>
          ) : (
            <>
              {/* Result input */}
              <div className="flex items-center gap-2 pt-3">
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wide shrink-0">
                  Resultado
                </span>
                <input
                  type="number"
                  min={0}
                  value={resultValue}
                  onChange={e => setResultValue(e.target.value)}
                  placeholder="—"
                  className="w-20 h-8 text-sm font-semibold text-center rounded-lg border border-border/50 bg-transparent focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all tabular-nums"
                />
                {isTouched && (
                  <span className={`text-xs font-bold ${progressColor(autoPercent)}`}>
                    = {autoPercent}%
                  </span>
                )}
              </div>

              {/* Comment */}
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Comentario (opcional)..."
                rows={1}
                className="text-xs resize-none rounded-lg border-border/30 bg-transparent focus:border-primary/50 min-h-[32px] py-1.5 px-3"
              />
            </>
          )}

          {/* Auto-save status (no manual button) */}
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground h-4">
            {saveState === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Guardando…</span>
              </>
            )}
            {saveState === "saved" && (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Guardado automáticamente</span>
              </>
            )}
            {saveState === "idle" && isTouched && (
              <span>Los cambios se guardan solos</span>
            )}
          </div>
        </div>
      )}

      {/* Per-person detail intentionally lives in "Mi equipo", not here. */}

      {/* Locked state: show existing data inline */}
      {isLocked && hasCheckin && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-border/10 mx-3 pt-2">
          {checkin.collaborator_comment && (
            <p className="text-[11px] text-muted-foreground italic">"{checkin.collaborator_comment}"</p>
          )}
          {checkin.leader_feedback && (
            <div className="flex items-start gap-1.5">
              <MessageSquare className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground">{checkin.leader_feedback}</p>
            </div>
          )}
          {flowStatus === "adjusted" && checkin.leader_adjusted_percent != null && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" />
              Tu calificación: {checkin.progress_percent}% → Líder: {checkin.leader_adjusted_percent}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}
