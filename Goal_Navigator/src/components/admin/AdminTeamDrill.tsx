import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarMap } from "@/data/avatarMap";
import { countReports, type TeamNode } from "@/data/teamHierarchy";
import { ArrowLeft, Network } from "lucide-react";
import type { PersonalKR } from "@/types/okr";
import { OrgChartTree } from "./OrgChartTree";
import { sentenceCaseTitle } from "@/lib/text-utils";

interface AdminTeamDrillProps {
  leaderNode: TeamNode | null;
  getProgress: (name: string) => number;
  getStatus: (name: string) => string;
  onDrillLeader: (name: string) => void;
  onBack: () => void;
  pendingApprovals: Record<string, number>;
  allKRs: PersonalKR[];
}

export function AdminTeamDrill({
  leaderNode, onDrillLeader, onBack, pendingApprovals, allKRs,
}: AdminTeamDrillProps) {
  if (!leaderNode) return null;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarMap[leaderNode.name]} alt={leaderNode.name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {leaderNode.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Equipo de {sentenceCaseTitle(leaderNode.name.split(" ")[0])}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {countReports(leaderNode)} personas · Click en un nodo para ver detalles
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <OrgChartTree
          root={leaderNode}
          allKRs={allKRs}
          pendingApprovals={pendingApprovals}
          onDrillLeader={onDrillLeader}
        />
      </CardContent>
    </Card>
  );
}
