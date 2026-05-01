import { StatusBadge } from "./StatusBadge";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { avatarMap } from "@/data/avatarMap";
import type { Status } from "@/types/okr";

export interface TeamMember {
  name: string;
  area: string;
  subarea: string;
  role: string;
}

interface TeamOverviewProps {
  members: TeamMember[];
  getProgress: (name: string) => number;
  getStatus: (name: string) => Status;
  getKRsCount: (name: string) => number;
  evaluations?: Record<string, { rating?: number }>;
  onSelectPerson: (name: string) => void;
}

export function TeamOverview({ members, getProgress, getStatus, getKRsCount, onSelectPerson }: TeamOverviewProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {members.map((member, i) => {
        const status = getStatus(member.name);
        const krsCount = getKRsCount(member.name);
        const progress = getProgress(member.name);
        const initials = member.name.split(" ").map(w => w[0]).join("").slice(0, 2);

        return (
          <button
            key={member.name}
            onClick={() => onSelectPerson(member.name)}
            className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40 group cursor-pointer ${
              i < members.length - 1 ? "border-b border-border/40" : ""
            }`}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={avatarMap[member.name]} alt={member.name} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground">{member.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{member.area}</span>
            </div>

            <span className="text-xs text-muted-foreground shrink-0">{krsCount} KRs</span>

            <span className="text-xs font-semibold text-foreground shrink-0 w-10 text-right tabular-nums">
              {Math.round(progress)}%
            </span>

            <StatusBadge status={status} compact />

            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
