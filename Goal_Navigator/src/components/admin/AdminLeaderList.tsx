import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarMap } from "@/data/avatarMap";
import { countReports, flattenTree, type TeamNode } from "@/data/teamHierarchy";
import { calcWeightedProgress, progressToStatus } from "@/lib/okr-utils";
import { Users, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/okr/StatusBadge";
import type { PersonalKR, Status } from "@/types/okr";

const STATUS_BG: Record<string, string> = {
  on_track: "border-emerald-200 bg-emerald-50/30",
  at_risk: "border-amber-200 bg-amber-50/30",
  off_track: "border-red-200 bg-red-50/30",
};

interface AdminLeaderListProps {
  area: string;
  leaders: TeamNode[];
  getProgress: (name: string) => number;
  getStatus: (name: string) => string;
  onSelectLeader: (name: string) => void;
  onBack: () => void;
  pendingApprovals: Record<string, number>;
  allKRs: PersonalKR[];
}

export function AdminLeaderList({
  area, leaders, getProgress, getStatus, onSelectLeader, onBack, pendingApprovals, allKRs,
}: AdminLeaderListProps) {
  // Calculate consolidated progress for a leader (average of their subtree)
  const calcSubtreeProgress = (node: TeamNode): number => {
    const people = flattenTree(node);
    if (people.length === 0) return 0;
    const progs = people.map((p) => calcWeightedProgress(allKRs.filter((kr) => kr.owner === p.name)));
    return Math.round(progs.reduce((a, b) => a + b, 0) / progs.length);
  };

  // Count pending in subtree
  const countPendingInSubtree = (node: TeamNode): number => {
    const people = flattenTree(node);
    return people.reduce((sum, p) => sum + (pendingApprovals[p.name] || 0), 0);
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Líderes de {area}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {leaders.length} líderes • Selecciona uno para ver su equipo
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {leaders.map((leader) => {
            const subtreeProgress = calcSubtreeProgress(leader);
            const subtreeStatus = progressToStatus(subtreeProgress);
            const teamSize = countReports(leader);
            const pendingCount = countPendingInSubtree(leader);

            return (
              <button
                key={leader.name}
                onClick={() => onSelectLeader(leader.name)}
                className={`flex items-center gap-4 px-4 py-4 rounded-lg border transition-all cursor-pointer bg-transparent text-left w-full hover:border-primary/40 hover:shadow-sm ${STATUS_BG[subtreeStatus] || "border-border/40"}`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={avatarMap[leader.name]} alt={leader.name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {leader.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{leader.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{leader.role}</p>
                </div>

                {pendingCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertCircle className="h-3 w-3" />
                    {pendingCount} pendientes
                  </span>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{subtreeProgress}%</p>
                    <p className="text-[10px] text-muted-foreground">{teamSize} personas</p>
                  </div>
                  <Progress value={subtreeProgress} className="h-2 w-16" />
                  <StatusBadge status={subtreeStatus as Status} compact />
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
