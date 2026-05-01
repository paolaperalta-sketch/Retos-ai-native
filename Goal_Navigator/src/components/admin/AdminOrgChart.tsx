import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarMap } from "@/data/avatarMap";
import { countReports, flattenTree, type TeamNode } from "@/data/teamHierarchy";
import { calcWeightedProgress, progressToStatus } from "@/lib/okr-utils";
import { StatusBadge } from "@/components/okr/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Network } from "lucide-react";
import type { DrillState, AreaStats } from "./AdminDashboard";
import type { PersonalKR, Status } from "@/types/okr";
import { mockData } from "@/data/mockData";

interface AdminOrgChartProps {
  drill: DrillState;
  areaStats: AreaStats[];
  getProgress: (name: string) => number;
  getStatus: (name: string) => string;
  getAreaLeaders: (area: string) => TeamNode[];
  getLeaderNode: (name: string) => TeamNode | null;
  onDrillArea: (area: string) => void;
  onDrillLeader: (name: string) => void;
  pendingApprovals: Record<string, number>;
}

function OrgNode({
  node, getProgress, getStatus, onClick, pendingCount, showTeamSize,
}: {
  node: TeamNode;
  getProgress: (name: string) => number;
  getStatus: (name: string) => string;
  onClick?: () => void;
  pendingCount: number;
  showTeamSize: boolean;
}) {
  const progress = getProgress(node.name);
  const status = getStatus(node.name);
  const teamSize = countReports(node);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer min-w-[160px] bg-transparent"
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={avatarMap[node.name]} alt={node.name} className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {node.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground">{node.name.split(" ").slice(0, 2).join(" ")}</p>
        <p className="text-[10px] text-muted-foreground">{node.role}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
        <StatusBadge status={status as Status} compact />
      </div>
      {showTeamSize && teamSize > 0 && (
        <span className="text-[10px] text-muted-foreground">{teamSize} personas</span>
      )}
      {pendingCount > 0 && (
        <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-100 px-1.5 py-0.5 rounded-full">
          <AlertCircle className="h-3 w-3" />
          {pendingCount}
        </span>
      )}
    </button>
  );
}

export function AdminOrgChart({
  drill, areaStats, getProgress, getStatus, getAreaLeaders, getLeaderNode, onDrillArea, onDrillLeader, pendingApprovals,
}: AdminOrgChartProps) {
  if (drill.level === "areas") {
    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Organigrama — Vista por Áreas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {areaStats.map((area) => (
              <button
                key={area.area}
                onClick={() => onDrillArea(area.area)}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer min-w-[140px] bg-transparent"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{area.area.charAt(0)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{area.area}</p>
                <Progress value={area.avgProgress} className="h-1.5 w-20" />
                <span className="text-xs font-bold text-foreground">{area.avgProgress}%</span>
                <span className="text-[10px] text-muted-foreground">{area.totalPeople} personas</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drill.level === "leaders" && drill.selectedArea) {
    const leaders = getAreaLeaders(drill.selectedArea);
    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Organigrama — {drill.selectedArea}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {leaders.map((leader) => {
              const pending = flattenTree(leader).reduce((s, p) => s + (pendingApprovals[p.name] || 0), 0);
              return (
                <OrgNode
                  key={leader.name}
                  node={leader}
                  getProgress={getProgress}
                  getStatus={getStatus}
                  onClick={() => onDrillLeader(leader.name)}
                  pendingCount={pending}
                  showTeamSize
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drill.level === "team" && drill.selectedLeader) {
    const leaderNode = getLeaderNode(drill.selectedLeader);
    if (!leaderNode) return null;

    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Equipo de {leaderNode.name.split(" ")[0]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Leader at top */}
          <div className="flex justify-center mb-6">
            <OrgNode
              node={leaderNode}
              getProgress={getProgress}
              getStatus={getStatus}
              pendingCount={pendingApprovals[leaderNode.name] || 0}
              showTeamSize
            />
          </div>
          {/* Connector line */}
          <div className="flex justify-center mb-2">
            <div className="w-px h-6 bg-border" />
          </div>
          {/* Direct reports */}
          <div className="flex flex-wrap gap-3 justify-center">
            {(leaderNode.directReports || []).map((child) => {
              const hasTeam = (child.directReports?.length || 0) > 0;
              return (
                <OrgNode
                  key={child.name}
                  node={child}
                  getProgress={getProgress}
                  getStatus={getStatus}
                  onClick={hasTeam ? () => onDrillLeader(child.name) : undefined}
                  pendingCount={pendingApprovals[child.name] || 0}
                  showTeamSize={hasTeam}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
