import { useState, useMemo, useEffect } from "react";
import { PageTitle } from "@/components/PageTitle";
import { teamHierarchy, flattenTree, findNode, countReports, type TeamNode } from "@/data/teamHierarchy";
import { mockData } from "@/data/mockData";
import { calcWeightedProgress, progressToStatus } from "@/lib/okr-utils";
import { AdminHeatmap } from "./AdminHeatmap";
import { AdminLeaderList } from "./AdminLeaderList";
import { AdminTeamDrill } from "./AdminTeamDrill";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { AdminOrgChart } from "./AdminOrgChart";
import { AdminKPICards } from "./AdminKPICards";
import { AdminAIMindset } from "./AdminAIMindset";
import { AdminAutomationPanel } from "./AdminAutomationPanel";
import { AdminUserManagement } from "./AdminUserManagement";
import { Target, List, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type DrillLevel = "areas" | "leaders" | "team";

export interface DrillState {
  level: DrillLevel;
  selectedArea?: string;
  selectedLeader?: string;
  breadcrumbs: { label: string; level: DrillLevel; area?: string; leader?: string }[];
}

export interface AreaStats {
  area: string;
  totalPeople: number;
  avgProgress: number;
  status: string;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  krCount: number;
  leaders: TeamNode[];
}

export function AdminDashboard() {
  const [viewMode, setViewMode] = useState<"list" | "orgchart">("list");
  const [drill, setDrill] = useState<DrillState>({
    level: "areas",
    breadcrumbs: [{ label: "Compañía", level: "areas" }],
  });

  // Pending accountability data
  const [pendingApprovals, setPendingApprovals] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from("kr_accountability")
      .select("user_id, status")
      .eq("status", "pending")
      .then(({ data }) => {
        if (data) {
          const counts: Record<string, number> = {};
          data.forEach((r) => {
            counts[r.user_id] = (counts[r.user_id] || 0) + 1;
          });
          setPendingApprovals(counts);
        }
      });
  }, []);

  const allKRs = useMemo(() => mockData.flatMap((c) => c.areaOkrs.flatMap((a) => a.krs)), []);
  const allNodes = useMemo(() => flattenTree(teamHierarchy), []);

  // Area stats
  const areaStats = useMemo((): AreaStats[] => {
    const areaMap = new Map<string, TeamNode[]>();
    allNodes.forEach((n) => {
      if (n.area === "EXECUTIVE") return;
      if (!areaMap.has(n.area)) areaMap.set(n.area, []);
      areaMap.get(n.area)!.push(n);
    });

    return Array.from(areaMap.entries())
      .map(([area, nodes]) => {
        const names = new Set(nodes.map((n) => n.name));
        const areaKRs = allKRs.filter((kr) => names.has(kr.owner));
        const progresses = nodes
          .map((n) => calcWeightedProgress(allKRs.filter((kr) => kr.owner === n.name)))
          .filter((p) => p > 0);
        const avgProgress =
          progresses.length > 0
            ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
            : 0;
        const status = progressToStatus(avgProgress);

        let onTrack = 0, atRisk = 0, offTrack = 0;
        nodes.forEach((n) => {
          const p = calcWeightedProgress(allKRs.filter((kr) => kr.owner === n.name));
          const s = progressToStatus(p);
          if (s === "on_track") onTrack++;
          else if (s === "at_risk") atRisk++;
          else offTrack++;
        });

        // Find leaders in this area
        const leaders = nodes.filter((n) => n.contribucion === "LÍDER" || (n.directReports && n.directReports.length > 0));

        return { area, totalPeople: nodes.length, avgProgress, status, onTrack, atRisk, offTrack, krCount: areaKRs.length, leaders };
      })
      .sort((a, b) => b.avgProgress - a.avgProgress);
  }, [allKRs, allNodes]);

  // Global stats
  const totalPeople = allNodes.filter((n) => n.area !== "EXECUTIVE").length;
  const globalAvgProgress = areaStats.length > 0
    ? Math.round(areaStats.reduce((s, a) => s + a.avgProgress, 0) / areaStats.length)
    : 0;
  const totalKRs = allKRs.length;
  const aiMindsetGlobal = 34;

  // Navigation handlers
  const drillIntoArea = (area: string) => {
    setDrill({
      level: "leaders",
      selectedArea: area,
      breadcrumbs: [
        { label: "Compañía", level: "areas" },
        { label: area, level: "leaders", area },
      ],
    });
  };

  const drillIntoLeader = (leaderName: string) => {
    setDrill((prev) => ({
      level: "team",
      selectedArea: prev.selectedArea,
      selectedLeader: leaderName,
      breadcrumbs: [
        ...prev.breadcrumbs,
        { label: leaderName.split(" ")[0], level: "team", area: prev.selectedArea, leader: leaderName },
      ],
    }));
  };

  const navigateBreadcrumb = (index: number) => {
    const target = drill.breadcrumbs[index];
    setDrill({
      level: target.level,
      selectedArea: target.area,
      selectedLeader: target.leader,
      breadcrumbs: drill.breadcrumbs.slice(0, index + 1),
    });
  };

  // Helper to calc progress for a person
  const getProgress = (name: string) => calcWeightedProgress(allKRs.filter((kr) => kr.owner === name));
  const getStatus = (name: string) => progressToStatus(getProgress(name));

  // Get leaders for a specific area
  const getAreaLeaders = (area: string): TeamNode[] => {
    // Find the VP (direct report of CEO) for this area
    const vpNodes = (teamHierarchy.directReports || []).filter((n) => n.area === area);
    if (vpNodes.length > 0) return vpNodes;
    // Fallback: any leader in the area
    return areaStats.find((a) => a.area === area)?.leaders || [];
  };

  // Get the selected leader's node
  const getLeaderNode = (name: string): TeamNode | null => {
    return findNode(teamHierarchy, name) || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageTitle
        breadcrumb="PANEL EMPRESA"
        title="Torre de Control Estratégica"
        subtitle="Visión consolidada del rendimiento organizacional"
        controls={
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors border-none cursor-pointer ${
                viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("orgchart")}
              className={`p-2 rounded-md transition-colors border-none cursor-pointer ${
                viewMode === "orgchart" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Breadcrumbs */}
      <AdminBreadcrumbs breadcrumbs={drill.breadcrumbs} onNavigate={navigateBreadcrumb} />

      {/* KPI Cards - always visible */}
      <AdminKPICards
        totalPeople={totalPeople}
        globalAvgProgress={globalAvgProgress}
        totalKRs={totalKRs}
        aiMindsetGlobal={aiMindsetGlobal}
      />

      {/* Main content based on view mode and drill level */}
      {viewMode === "orgchart" ? (
        <AdminOrgChart
          drill={drill}
          areaStats={areaStats}
          getProgress={getProgress}
          getStatus={getStatus}
          getAreaLeaders={getAreaLeaders}
          getLeaderNode={getLeaderNode}
          onDrillArea={drillIntoArea}
          onDrillLeader={drillIntoLeader}
          pendingApprovals={pendingApprovals}
        />
      ) : (
        <>
          {drill.level === "areas" && (
            <AdminHeatmap areaStats={areaStats} onSelectArea={drillIntoArea} />
          )}
          {drill.level === "leaders" && drill.selectedArea && (
            <AdminLeaderList
              area={drill.selectedArea}
              leaders={getAreaLeaders(drill.selectedArea)}
              getProgress={getProgress}
              getStatus={getStatus}
              onSelectLeader={drillIntoLeader}
              onBack={() => navigateBreadcrumb(0)}
              pendingApprovals={pendingApprovals}
              allKRs={allKRs}
            />
          )}
          {drill.level === "team" && drill.selectedLeader && (
            <AdminTeamDrill
              leaderNode={getLeaderNode(drill.selectedLeader)}
              getProgress={getProgress}
              getStatus={getStatus}
              onDrillLeader={drillIntoLeader}
              onBack={() => navigateBreadcrumb(drill.breadcrumbs.length - 2)}
              pendingApprovals={pendingApprovals}
              allKRs={allKRs}
            />
          )}
        </>
      )}

      {/* Org-wide Automation health (moved from Mi Equipo) */}
      <AdminAutomationPanel />

      {/* User Management */}
      <AdminUserManagement />

      {/* AI Mindset - always visible at bottom */}
      <AdminAIMindset aiMindsetGlobal={aiMindsetGlobal} />
    </div>
  );
}
