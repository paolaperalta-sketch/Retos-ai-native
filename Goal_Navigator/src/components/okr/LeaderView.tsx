import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/lib/rbac";
import { LeaderPersonDetail } from "./LeaderPersonDetail";
import { TeamHealthDashboard } from "./TeamHealthDashboard";
import { TeamMemberRow } from "./TeamMemberRow";
import { teamHierarchy, findNode, countReports, findParent, getTeammates, getAllAreas, getSubareas, flattenTree, type TeamNode } from "@/data/teamHierarchy";
import { EvaluationPanel, type EvaluationData } from "./EvaluationPanel";
import { calcWeightedProgress } from "@/lib/okr-utils";
import {
  ArrowLeft, ChevronRight, Filter,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { avatarMap } from "@/data/avatarMap";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { KRFormModal, type KRFormValues } from "./KRFormModal";
import { KRDeleteDialog } from "./KRDeleteDialog";
import { canManageKRsForPerson, useKRCrud } from "@/hooks/useKRCrud";
import { supabase } from "@/integrations/supabase/client";
import { useMonthlyCheckins } from "@/hooks/useMonthlyCheckins";
import { useTeamAutomation } from "@/hooks/useTeamAutomation";
import type { PersonalKR } from "@/types/okr";
import { KR_SELECT_COLUMNS, mapKRRow, dedupeKRs, periodToClosingMonth, type KRRow } from "@/lib/kr-mapper";


const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type StatusFilter = "" | "pending" | "approved" | "not_sent" | "no_krs";

export default function LeaderView() {
  const { role, user } = useAuth();
  const permissions = getUserPermissions(user?.email, role);
  const canEvaluate = permissions.canEvaluate;
  const effectiveRole = permissions.effectiveRole;
  const teamRoot = permissions.teamRootNode || teamHierarchy;

  const visibleNames = useMemo(() => {
    if (effectiveRole === "super_admin") return null;
    if (effectiveRole === "global_leader") {
      const area = permissions.userArea;
      return new Set(flattenTree(teamHierarchy).filter(n => n.area === area).map(n => n.name));
    }
    if (effectiveRole === "team_leader") {
      return teamRoot ? new Set(flattenTree(teamRoot).map(n => n.name)) : new Set<string>();
    }
    return new Set<string>();
  }, [effectiveRole, permissions.userArea, teamRoot]);

  const [period, setPeriod] = useState("Mayo 2026");

  // Convert "Abril 2026" ⇄ "2026-04" for the hook + dashboard picker
  const periodValue = useMemo(() => {
    const [mName, yStr] = period.split(" ");
    const idx = MONTHS.indexOf(mName);
    const m = idx >= 0 ? idx + 1 : new Date().getMonth() + 1;
    const y = Number(yStr) || new Date().getFullYear();
    return `${y}-${String(m).padStart(2, "0")}`;
  }, [period]);
  const setPeriodFromValue = useCallback((v: string) => {
    const [yStr, mStr] = v.split("-");
    const idx = Number(mStr) - 1;
    setPeriod(`${MONTHS[idx]} ${yStr}`);
  }, []);
  
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationData>>({});
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [evalTarget, setEvalTarget] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState("");
  const [filterSubarea, setFilterSubarea] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("");

  const [hireDates, setHireDates] = useState<Record<string, string>>({});
  const [userIdMap, setUserIdMap] = useState<Record<string, string>>({});
  const [nameToEmail, setNameToEmail] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("users_master").select("email, hire_date, full_name").then(({ data }) => {
      if (data) {
        const hdMap: Record<string, string> = {};
        const neMap: Record<string, string> = {};
        data.forEach(r => {
          if (r.hire_date) hdMap[r.email] = r.hire_date;
          neMap[r.full_name] = r.email;
          neMap[r.full_name.toUpperCase()] = r.email;
          const titleCase = r.full_name.split(' ').map((w: string) =>
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          ).join(' ');
          neMap[titleCase] = r.email;
        });
        setHireDates(hdMap);
        setNameToEmail(neMap);
      }
    });
    supabase.from("profiles").select("email, user_id").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.email] = r.user_id; });
        setUserIdMap(map);
      }
    });
  }, []);

  const { addKR, updateKR, deleteKR, saving } = useKRCrud();
  const [localKRs, setLocalKRs] = useState<Record<string, PersonalKR[]>>({});
  const [editingKR, setEditingKR] = useState<PersonalKR | null>(null);
  const [deletingKR, setDeletingKR] = useState<PersonalKR | null>(null);
  const [krFormOpen, setKrFormOpen] = useState(false);
  const [krFormTarget, setKrFormTarget] = useState<string | null>(null); // member name for add

  const [teamKRRows, setTeamKRRows] = useState<KRRow[]>([]);
  const [companyOkrMap, setCompanyOkrMap] = useState<Record<string, { id: string; name: string; area: string; description: string; pillarId: string; pillarName: string; pillarDescription: string }>>({});

  useEffect(() => {
    (supabase as any).rpc("get_team_key_results").then(({ data, error }: any) => {
      if (error) {
        console.error("team key_results RPC error, falling back to direct select", error);
        supabase.from("key_results").select(KR_SELECT_COLUMNS).then(({ data: d2, error: e2 }) => {
          if (e2) { console.error("team key_results query error", e2); return; }
          setTeamKRRows((d2 || []) as KRRow[]);
        });
        return;
      }
      setTeamKRRows((data || []) as KRRow[]);
    });
    (async () => {
      const [coRes, pRes] = await Promise.all([
        supabase.from("company_okrs").select("id, name, area, description, pillar_id"),
        supabase.from("okr_pillars").select("id, name, description"),
      ]);
      if (coRes.error) { console.error("team company_okrs query error", coRes.error); return; }
      if (pRes.error) { console.error("team okr_pillars query error", pRes.error); }
      const pillarMap: Record<string, { name: string; description: string }> = {};
      (pRes.data || []).forEach((p: any) => { pillarMap[p.id] = { name: p.name || "", description: p.description || "" }; });
      const map: Record<string, { id: string; name: string; area: string; description: string; pillarId: string; pillarName: string; pillarDescription: string }> = {};
      (coRes.data || []).forEach((c: any) => {
        const pillar = pillarMap[c.pillar_id] || { name: "", description: "" };
        map[c.id] = {
          id: c.id,
          name: c.name,
          area: c.area || "",
          description: c.description || "",
          pillarId: c.pillar_id || "",
          pillarName: pillar.name,
          pillarDescription: pillar.description,
        };
      });
      setCompanyOkrMap(map);
    })();
  }, []);

  // Build reverse map: hierarchy name → KRs
  // A KR can belong to MULTIPLE people when assigned_full_name is a comma-list
  // (e.g. "PAOLA PERALTA, KAREN VILLAMIL"). In that case the KR appears for every
  // mentioned person, matching what each user sees in "Mi Desempeño".
  const personKRsMap = useMemo(() => {
    const map: Record<string, PersonalKR[]> = {};
    const hierarchyNames = flattenTree(teamHierarchy).map(n => n.name);
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
    const emailToName = new Map<string, string>();
    hierarchyNames.forEach(name => {
      const email = nameToEmail[name];
      if (email) emailToName.set(email.toLowerCase(), name);
    });
    const userIdToName = new Map<string, string>();
    hierarchyNames.forEach(name => {
      const email = nameToEmail[name];
      const uid = email ? userIdMap[email] : undefined;
      if (uid) userIdToName.set(uid, name);
    });
    // Pre-tokenize each hierarchy name for shared-name matching
    const hierarchyTokens = hierarchyNames.map(name => ({
      name,
      tokens: normalize(name).split(" ").filter(t => t.length >= 3),
    }));

    const localKRById = new Map<string, PersonalKR>();
    Object.values(localKRs).flat().forEach(kr => localKRById.set(kr.id, kr));

    // Filter KR rows by closing_month derived from selected period
    const closing = periodToClosingMonth(period);
    const filteredRows = closing
      ? teamKRRows.filter(r => (localKRById.get(r.id)?.closingMonth ?? (r as any).closing_month) === closing)
      : teamKRRows;

    filteredRows.forEach(row => {
      const owners = new Set<string>();

      // 1) Direct match: email
      const emailOwner = row.assigned_email
        ? emailToName.get(row.assigned_email.toLowerCase())
        : undefined;
      if (emailOwner) owners.add(emailOwner);

      // 2) Direct match: user_id
      const uidOwner = row.user_id ? userIdToName.get(row.user_id) : undefined;
      if (uidOwner) owners.add(uidOwner);

      // 3) Match every person mentioned in assigned_full_name (comma-separated list)
      if (row.assigned_full_name) {
        const parts = row.assigned_full_name.split(",").map(p => normalize(p));
        parts.forEach(part => {
          const partTokens = part.split(" ").filter(t => t.length >= 3);
          // Find hierarchy names with at least 2 tokens overlap with this part
          hierarchyTokens.forEach(({ name, tokens }) => {
            const hits = tokens.filter(t => partTokens.includes(t)).length;
            if (hits >= 2) owners.add(name);
          });
        });
      }

      if (owners.size === 0) return;
      owners.forEach(ownerName => {
        if (!map[ownerName]) map[ownerName] = [];
        const localKR = localKRById.get(row.id);
        map[ownerName].push(localKR ? { ...localKR, owner: ownerName } : mapKRRow(row, ownerName));
      });
    });
    Object.keys(map).forEach(ownerName => {
      map[ownerName] = dedupeKRs(map[ownerName]);
    });
    return map;
  }, [teamKRRows, nameToEmail, userIdMap, period, localKRs]);

  const getPersonKRs = (name: string): PersonalKR[] => personKRsMap[name] ?? [];
  const getProgress = (name: string) => calcWeightedProgress(getPersonKRs(name));

  // Build pillar map (full company OKR text — pillar description) and área map (full área OKR text — description)
  const krPillarMap = useMemo(() => {
    const map: Record<string, string> = {};
    teamKRRows.forEach(row => {
      const co = row.company_okr_id ? companyOkrMap[row.company_okr_id] : undefined;
      if (!co) return;
      const text = co.pillarDescription || co.pillarName || "";
      if (text) map[row.id] = text;
    });
    return map;
  }, [teamKRRows, companyOkrMap]);

  const krAreaOkrMap = useMemo(() => {
    const map: Record<string, string> = {};
    teamKRRows.forEach(row => {
      const co = row.company_okr_id ? companyOkrMap[row.company_okr_id] : undefined;
      if (!co) return;
      const text = co.description || co.name || "";
      if (text) map[row.id] = text;
    });
    return map;
  }, [teamKRRows, companyOkrMap]);

  const currentNode = useMemo(() => {
    if (drillPath.length === 0) return teamRoot;
    let node = teamRoot;
    for (const name of drillPath) {
      const found = findNode(node, name);
      if (found) node = found;
    }
    return node;
  }, [drillPath, teamRoot]);

  const allMembers = currentNode.directReports || [];
  const availableAreas = useMemo(() => getAllAreas(currentNode), [currentNode]);
  const availableSubareas = useMemo(() => filterArea ? getSubareas(currentNode, filterArea) : [], [currentNode, filterArea]);

  // Collect all KR IDs for all team members to fetch checkins
  const memberKrIds = useMemo(() => {
    const ids: string[] = [];
    allMembers.forEach(m => {
      getPersonKRs(m.name).forEach(kr => ids.push(kr.id));
    });
    return ids;
  }, [allMembers]);

  // Collect all user IDs for team members
  const memberUserIds = useMemo(() => {
    const ids: string[] = [];
    allMembers.forEach(m => {
      const email = nameToEmail[m.name];
      const uid = email ? userIdMap[email] : undefined;
      if (uid) ids.push(uid);
    });
    return ids;
  }, [allMembers, nameToEmail, userIdMap]);

  // Fetch all checkins for the team (no targetUserId filter = get all), filtered by selected month
  const {
    checkins: allCheckins,
    approve: approveCheckin,
    adjust: adjustCheckin,
    leaderDirectRate,
    refetch: refetchCheckins,
  } = useMonthlyCheckins(memberKrIds, undefined, periodValue);

  // Team-wide automation efficiency metric
  const { members: autoMembers } = useTeamAutomation();
  const teamEfficiencyHoursWeek = useMemo(
    () => autoMembers.reduce((acc, m) => acc + (m.horasSemanaReportadas || 0), 0),
    [autoMembers],
  );
  const automationAvgPct = useMemo(
    () => (autoMembers.length ? autoMembers.reduce((a, m) => a + m.pct, 0) / autoMembers.length : 0),
    [autoMembers],
  );

  // Group checkins by person (via KR owner)
  const checkinsByPerson = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    allMembers.forEach(m => {
      const personCheckins: Record<string, any> = {};
      getPersonKRs(m.name).forEach(kr => {
        if (allCheckins[kr.id]) {
          personCheckins[kr.id] = allCheckins[kr.id];
        }
      });
      map[m.name] = personCheckins;
    });
    return map;
  }, [allMembers, allCheckins]);

  // Compute member status
  const getMemberStatus = (name: string): "approved" | "pending" | "not_sent" | "no_krs" => {
    const krs = getPersonKRs(name);
    if (krs.length === 0) return "no_krs";
    const personCheckins = checkinsByPerson[name] || {};
    const checkinValues = Object.values(personCheckins) as any[];
    if (checkinValues.length === 0) return "not_sent";
    const allApproved = checkinValues.every((c: any) => c.flow_status === "approved" || c.flow_status === "adjusted");
    if (allApproved) return "approved";
    const hasPending = checkinValues.some((c: any) => c.flow_status === "submitted");
    if (hasPending) return "pending";
    return "not_sent";
  };

  // Compute header stats
  const headerStats = useMemo(() => {
    let submittedCount = 0;
    let pendingApprovalCount = 0;
    let noCheckinCount = 0;
    let zeroProgressCount = 0;
    let noCumplidoKRs = 0;
    let totalProgress = 0;

    allMembers.forEach(m => {
      const krs = getPersonKRs(m.name);
      const progress = getProgress(m.name);
      totalProgress += progress;

      const personCheckins = checkinsByPerson[m.name] || {};
      const checkinValues = Object.values(personCheckins) as any[];

      const hasSubmitted = checkinValues.some((c: any) => c.flow_status !== "draft");
      if (hasSubmitted) submittedCount++;
      else if (krs.length > 0) noCheckinCount++;

      const pending = checkinValues.filter((c: any) => c.flow_status === "submitted").length;
      pendingApprovalCount += pending;

      if (progress === 0 && krs.length > 0) zeroProgressCount++;

      checkinValues.forEach((c: any) => {
        if (c.status_rating === "no_cumplido") noCumplidoKRs++;
      });
    });

    // Bucket counts for the team-status fallback (when avg progress is 0)
    let atRiskCount = 0;
    let inProgressCount = 0;
    allMembers.forEach(m => {
      const krs = getPersonKRs(m.name);
      if (krs.length === 0) return;
      const p = getProgress(m.name);
      if (p > 0 && p < 30) atRiskCount++;
      else if (p >= 30) inProgressCount++;
    });

    return {
      avgProgress: allMembers.length > 0 ? totalProgress / allMembers.length : 0,
      submittedCount,
      pendingApprovalCount,
      noCheckinCount,
      zeroProgressCount,
      noCumplidoKRs,
      atRiskCount,
      inProgressCount,
    };
  }, [allMembers, checkinsByPerson]);

  // Filter members
  const currentMembers = useMemo(() => {
    let filtered = allMembers;
    if (filterArea) {
      const matchesFilter = (node: TeamNode): boolean => {
        if (node.area === filterArea && (!filterSubarea || node.subarea === filterSubarea)) return true;
        return (node.directReports || []).some(matchesFilter);
      };
      filtered = filtered.filter(matchesFilter);
    }
    if (filterStatus) {
      filtered = filtered.filter(m => getMemberStatus(m.name) === filterStatus);
    }
    return filtered;
  }, [allMembers, filterArea, filterSubarea, filterStatus, checkinsByPerson]);

  const handleDrillInto = (name: string) => {
    if (visibleNames && !visibleNames.has(name)) return;
    const node = findNode(teamHierarchy, name);
    if (node?.directReports && node.directReports.length > 0) {
      setDrillPath(prev => [...prev, name]);
    } else {
      setSelectedPerson(name);
    }
  };

  const handleBreadcrumb = (index: number) => {
    setDrillPath(prev => prev.slice(0, index));
  };

  const handleSaveEvaluation = (data: EvaluationData) => {
    setEvaluations(prev => ({ ...prev, [data.personName]: data }));
    setSelectedPerson(null);
    setEvalTarget(null);
  };

  // Recursive render: each member can expand to show their own reports
  const renderMemberRow = (member: TeamNode, depth: number): React.ReactNode => {
    const subReports = member.directReports || [];
    return (
      <div key={member.name}>
        <div style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : 0 }}>
          <TeamMemberRow
            name={member.name}
            role={member.role}
            area={member.area}
            progress={getProgress(member.name)}
            krs={getPersonKRs(member.name)}
            status={getMemberStatus(member.name)}
            checkins={checkinsByPerson[member.name] || {}}
            email={nameToEmail[member.name]}
            onApprove={(krId) => approveCheckin(krId)}
            onAdjust={(krId, percent, rating, feedback) => adjustCheckin(krId, percent, rating, feedback)}
            krPillarMap={krPillarMap}
            krAreaOkrMap={krAreaOkrMap}
            onEditKR={(kr) => setEditingKR(kr)}
            onDeleteKR={(kr) => setDeletingKR(kr)}
            onAddKR={() => { setKrFormTarget(member.name); setKrFormOpen(true); }}
            onLeaderRate={(krId, percent, rating, comment) => {
              const email = nameToEmail[member.name];
              const uid = email ? userIdMap[email] : undefined;
              if (uid) {
                leaderDirectRate(krId, uid, percent, rating, comment);
              }
            }}
            onUpdateWeight={async (kr, newWeight) => {
              (kr as any).weight = newWeight;
              await updateKR(kr.id, { weight: newWeight });
            }}
            subReports={subReports.length > 0 ? subReports : undefined}
            renderSubReport={subReports.length > 0 ? (n) => renderMemberRow(n, depth + 1) : undefined}
          />
        </div>
      </div>
    );
  };

  // ── Person detail ──
  if (selectedPerson) {
    const node = findNode(teamHierarchy, selectedPerson);
    const boss = findParent(teamHierarchy, selectedPerson);
    const isDirectManager = boss && permissions.userName === boss.name;
    const canManage = effectiveRole === "super_admin" || (effectiveRole === "team_leader" && !!isDirectManager);

    return (
      <LeaderPersonDetail
        selectedPerson={selectedPerson}
        krs={getPersonKRs(selectedPerson)}
        krPillarMap={krPillarMap}
        onBack={() => setSelectedPerson(null)}
        canManage={canManage}
        nameToEmail={nameToEmail}
        userIdMap={userIdMap}
        hireDates={hireDates}
        localKRs={localKRs}
        onLocalKRsChange={(name, krs) => setLocalKRs(prev => ({ ...prev, [name]: krs }))}
        onAddKR={async (values, targetUserId) => {
          await addKR(values, targetUserId, "00000000-0000-0000-0000-000000000000");
        }}
        onUpdateKR={async (krId, updates) => { await updateKR(krId, updates); }}
        onDeleteKR={async (krId) => { await deleteKR(krId); }}
        saving={saving}
      />
    );
  }

  // ── Main view ──
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      {drillPath.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => handleBreadcrumb(0)}
            className="text-muted-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer font-medium"
          >
            Mi Equipo
          </button>
          {drillPath.map((name, i) => (
            <span key={name} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => handleBreadcrumb(i + 1)}
                className={`bg-transparent border-none cursor-pointer font-medium transition-colors ${
                  i === drillPath.length - 1 ? "text-foreground" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {name.split(" ")[0]}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Header / Dashboard */}
      {drillPath.length > 0 ? (
        <div className="flex items-center gap-3">
          <button onClick={() => handleBreadcrumb(drillPath.length - 1)} className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Equipo de {currentNode.name.split(" ")[0]}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{currentNode.role} • {currentMembers.length} reportes directos</p>
          </div>
        </div>
      ) : (
        <TeamHealthDashboard
          areaName={
            permissions.userArea
              ? permissions.userArea.charAt(0) + permissions.userArea.slice(1).toLowerCase()
              : "del equipo"
          }
          periodValue={periodValue}
          onPeriodChange={setPeriodFromValue}
          avgProgress={headerStats.avgProgress}
          totalMembers={allMembers.length}
          alerts={[
            ...allMembers
              .filter(m => {
                const krs = getPersonKRs(m.name);
                if (krs.length === 0) return false;
                const personCheckins = checkinsByPerson[m.name] || {};
                return Object.keys(personCheckins).length === 0;
              })
              .map(m => ({ name: m.name, reason: "no_checkin" as const })),
            ...allMembers
              .filter(m => {
                const krs = getPersonKRs(m.name);
                return krs.length > 0 && getProgress(m.name) === 0;
              })
              .map(m => ({ name: m.name, reason: "zero_progress" as const })),
          ].slice(0, 8)}
          onAlertClick={(name) => setSelectedPerson(name)}
          selfAssessSubmitted={headerStats.submittedCount}
          selfAssessTotal={allMembers.length}
          pendingApprovalCount={headerStats.pendingApprovalCount}
          automationAvgPct={automationAvgPct}
          efficiencyHoursWeek={teamEfficiencyHoursWeek}
          zeroProgressCount={headerStats.zeroProgressCount + headerStats.noCheckinCount}
          atRiskCount={headerStats.atRiskCount}
          inProgressCount={headerStats.inProgressCount}
        />
      )}

      {/* OKRs & Check-ins (single source of truth — automation lives inside each person) */}
      <div className="space-y-5">

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterArea}
          onChange={e => { setFilterArea(e.target.value); setFilterSubarea(""); }}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground cursor-pointer"
        >
          <option value="">Todas las Áreas</option>
          {availableAreas.filter(a => a !== "EXECUTIVE").map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as StatusFilter)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground cursor-pointer"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobado</option>
          <option value="not_sent">Sin enviar</option>
          <option value="no_krs">Sin KRs</option>
        </select>
        <span className="text-[11px] font-medium text-muted-foreground">
          {filterArea ? filterArea : "Todas las Áreas"} · {currentMembers.length} {currentMembers.length === 1 ? "resultado" : "resultados"}
        </span>
        {(filterArea || filterStatus) && (
          <button
            onClick={() => { setFilterArea(""); setFilterSubarea(""); setFilterStatus(""); }}
            className="text-[10px] text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#639922" }} /> Activo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#EF9F27" }} /> En riesgo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#E24B4A" }} /> Sin actividad
        </span>
      </div>

      {/* Team list header */}
      {allMembers.length > 0 && (
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
          Equipo · {allMembers.length} {allMembers.length === 1 ? "persona" : "personas"}
        </h3>
      )}

      {/* Team list */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden" style={{ borderRadius: 12 }}>
        {allMembers.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="h-12 w-12 mx-auto rounded-full bg-muted/40 flex items-center justify-center mb-3">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No tienes personas a cargo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cuando tengas reportes directos asignados, aparecerán aquí.
            </p>
          </div>
        ) : currentMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay personas que coincidan con los filtros</p>
        ) : (
          currentMembers.map(member => renderMemberRow(member, 0))
        )}
      </div>
        </div>

      {/* KR Edit Modal */}
      <KRFormModal
        open={!!editingKR}
        onClose={() => setEditingKR(null)}
        onSubmit={async (values) => {
          if (editingKR) {
            await updateKR(editingKR.id, {
              name: values.name,
              baseline: values.baseline,
              target: values.target,
              weight: values.weight,
              closing_month: values.closingMonth,
            });
            // Optimistic UI: refresh local KR overrides so the leader sees the new
            // weight / baseline / target / name immediately, even when the source
            // KR comes from mockData and not from the DB.
            const ownerName = editingKR.owner;
            const baseList = (localKRs[ownerName] ?? getPersonKRs(ownerName)).map(k =>
              k.id === editingKR.id
                ? {
                    ...k,
                    name: values.name.toUpperCase(),
                    baseline: values.baseline,
                    target: values.target,
                    weight: values.weight,
                    closingMonth: values.closingMonth,
                  }
                : k
            );
            setLocalKRs(prev => ({ ...prev, [ownerName]: baseList }));
            setEditingKR(null);
          }
        }}
        initialValues={editingKR ? {
          name: editingKR.name,
          baseline: editingKR.baseline,
          target: editingKR.target,
          weight: editingKR.weight,
          closingMonth: editingKR.closingMonth ?? "mayo",
        } : undefined}
        mode="edit"
        saving={saving}
      />

      {/* KR Add Modal */}
      <KRFormModal
        open={krFormOpen}
        onClose={() => { setKrFormOpen(false); setKrFormTarget(null); }}
        onSubmit={async (values) => {
          if (krFormTarget) {
            const email = nameToEmail[krFormTarget];
            const uid = email ? userIdMap[email] : undefined;
            if (uid) {
              await addKR(values, uid, "00000000-0000-0000-0000-000000000000");
            }
            setKrFormOpen(false);
            setKrFormTarget(null);
          }
        }}
        mode="add"
        saving={saving}
      />

      {/* KR Delete Dialog */}
      <KRDeleteDialog
        open={!!deletingKR}
        onClose={() => setDeletingKR(null)}
        onConfirm={async () => {
          if (deletingKR) {
            await deleteKR(deletingKR.id);
            setDeletingKR(null);
          }
        }}
        krName={deletingKR?.name || ""}
        saving={saving}
      />

      {/* Inline Evaluation Modal */}
      <Dialog open={!!evalTarget} onOpenChange={(open) => { if (!open) setEvalTarget(null); }}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarMap[evalTarget || ""]} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {evalTarget?.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              Evaluar a {evalTarget}
            </DialogTitle>
          </DialogHeader>
          {evalTarget && (
            <EvaluationPanel
              personName={evalTarget}
              krs={getPersonKRs(evalTarget)}
              existingEvaluation={evaluations[evalTarget]}
              onSave={handleSaveEvaluation}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
